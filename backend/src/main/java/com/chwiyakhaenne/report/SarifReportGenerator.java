package com.chwiyakhaenne.report;

import com.chwiyakhaenne.model.AnalysisResult;
import com.chwiyakhaenne.model.Finding;
import com.chwiyakhaenne.model.Severity;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class SarifReportGenerator {

    private final ObjectMapper objectMapper;

    public SarifReportGenerator(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String generate(AnalysisResult result) {
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(toSarif(result));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("SARIF report generation failed", exception);
        }
    }

    private ObjectNode toSarif(AnalysisResult result) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("version", "2.1.0");
        root.put("$schema", "https://json.schemastore.org/sarif-2.1.0.json");

        ObjectNode run = objectMapper.createObjectNode();
        run.set("tool", tool(result));
        run.set("results", results(result));

        ObjectNode invocation = objectMapper.createObjectNode();
        invocation.put("executionSuccessful", true);
        invocation.put("startTimeUtc", result.analyzedAt().toInstant().toString());
        run.set("invocations", objectMapper.createArrayNode().add(invocation));

        ObjectNode properties = objectMapper.createObjectNode();
        properties.put("projectName", text(result.projectName()));
        properties.put("score", result.score());
        properties.put("verdict", text(result.verdict()));
        properties.put("high", result.severityCount().high());
        properties.put("medium", result.severityCount().medium());
        properties.put("low", result.severityCount().low());
        properties.put("total", result.severityCount().total());
        run.set("properties", properties);

        root.set("runs", objectMapper.createArrayNode().add(run));
        return root;
    }

    private ObjectNode tool(AnalysisResult result) {
        ObjectNode driver = objectMapper.createObjectNode();
        driver.put("name", "취약했네");
        driver.put("semanticVersion", "0.1.0");
        driver.put("informationUri", "https://github.com/security");
        driver.set("rules", rules(result));

        ObjectNode tool = objectMapper.createObjectNode();
        tool.set("driver", driver);
        return tool;
    }

    private ArrayNode rules(AnalysisResult result) {
        Map<String, Finding> byRule = new LinkedHashMap<>();
        for (Finding finding : result.findings()) {
            byRule.putIfAbsent(ruleId(finding), finding);
        }

        ArrayNode rules = objectMapper.createArrayNode();
        for (Finding finding : byRule.values()) {
            ObjectNode rule = objectMapper.createObjectNode();
            rule.put("id", ruleId(finding));
            rule.put("name", text(finding.title()));
            rule.set("shortDescription", message(finding.title()));
            rule.set("fullDescription", message(finding.description()));
            rule.set("help", message(helpText(finding)));

            ObjectNode properties = objectMapper.createObjectNode();
            properties.put("severity", finding.severity().name());
            properties.put("category", text(finding.category()));
            putIfPresent(properties, "cwe", finding.cwe());
            putIfPresent(properties, "detectionType", finding.detectionType());
            putIfPresent(properties, "kisaReference", finding.kisaReference());
            putIfPresent(properties, "kisaItem", finding.kisaItem());
            ArrayNode tags = objectMapper.createArrayNode()
                    .add("security")
                    .add(finding.severity().name().toLowerCase());
            if (finding.cwe() != null && !finding.cwe().isBlank()) {
                tags.add(finding.cwe());
            }
            properties.set("tags", tags);
            rule.set("properties", properties);
            rules.add(rule);
        }
        return rules;
    }

    private ArrayNode results(AnalysisResult result) {
        ArrayNode results = objectMapper.createArrayNode();
        for (Finding finding : result.findings()) {
            ObjectNode sarifResult = objectMapper.createObjectNode();
            sarifResult.put("ruleId", ruleId(finding));
            sarifResult.put("level", level(finding.severity()));
            sarifResult.set("message", message("%s: %s".formatted(text(finding.title()), text(finding.description()))));
            sarifResult.set("locations", objectMapper.createArrayNode().add(location(finding)));

            ObjectNode fingerprints = objectMapper.createObjectNode();
            fingerprints.put("primaryLocationLineHash", fingerprint(finding));
            sarifResult.set("partialFingerprints", fingerprints);

            ObjectNode properties = objectMapper.createObjectNode();
            properties.put("findingId", text(finding.id()));
            properties.put("severity", finding.severity().name());
            properties.put("category", text(finding.category()));
            properties.put("recommendation", text(finding.recommendation()));
            properties.put("fixedExample", text(finding.fixedExample()));
            putIfPresent(properties, "cwe", finding.cwe());
            putIfPresent(properties, "detectionType", finding.detectionType());
            putIfPresent(properties, "kisaReference", finding.kisaReference());
            putIfPresent(properties, "kisaItem", finding.kisaItem());
            sarifResult.set("properties", properties);
            results.add(sarifResult);
        }
        return results;
    }

    private ObjectNode location(Finding finding) {
        ObjectNode artifactLocation = objectMapper.createObjectNode();
        artifactLocation.put("uri", normalizeUri(finding.filePath()));

        ObjectNode region = objectMapper.createObjectNode();
        region.put("startLine", Math.max(1, finding.lineNumber()));
        region.set("snippet", message(evidence(finding)));

        ObjectNode physicalLocation = objectMapper.createObjectNode();
        physicalLocation.set("artifactLocation", artifactLocation);
        physicalLocation.set("region", region);

        ObjectNode location = objectMapper.createObjectNode();
        location.set("physicalLocation", physicalLocation);
        return location;
    }

    private ObjectNode message(String text) {
        ObjectNode message = objectMapper.createObjectNode();
        message.put("text", text(text));
        return message;
    }

    private String helpText(Finding finding) {
        return "권장 조치: %s\n수정 예시:\n%s".formatted(text(finding.recommendation()), text(finding.fixedExample()));
    }

    private String evidence(Finding finding) {
        if (finding.lineContext() != null && !finding.lineContext().isBlank()) {
            return finding.lineContext();
        }
        return finding.codeSnippet();
    }

    private String ruleId(Finding finding) {
        if (finding.ruleId() != null && !finding.ruleId().isBlank()) {
            return finding.ruleId();
        }
        return "CHWIYAKHAENNE:%s:%s".formatted(text(finding.category()), text(finding.title()))
                .replaceAll("\\s+", "_");
    }

    private String level(Severity severity) {
        return switch (severity) {
            case HIGH -> "error";
            case MEDIUM -> "warning";
            case LOW -> "note";
        };
    }

    private String normalizeUri(String filePath) {
        return text(filePath).replace("\\", "/").replaceAll("^/+", "");
    }

    private String fingerprint(Finding finding) {
        String source = "%s:%s:%d:%s".formatted(
                ruleId(finding),
                normalizeUri(finding.filePath()),
                finding.lineNumber(),
                text(finding.codeSnippet())
        );
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(source.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder();
            for (int i = 0; i < 12 && i < hash.length; i++) {
                builder.append("%02x".formatted(hash[i]));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException exception) {
            return Integer.toHexString(source.hashCode());
        }
    }

    private void putIfPresent(ObjectNode node, String field, String value) {
        if (value != null && !value.isBlank()) {
            node.put(field, value);
        }
    }

    private String text(String value) {
        return value == null ? "" : value;
    }
}
