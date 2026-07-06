package com.chwiyakhaenne.analyzer.rules;

import com.chwiyakhaenne.analyzer.AnalysisContext;
import com.chwiyakhaenne.model.CodeFile;
import com.chwiyakhaenne.model.Finding;
import com.chwiyakhaenne.model.Severity;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class CatalogSecurityRule implements SecurityRule {

    private final List<RuleDefinition> rules;

    public CatalogSecurityRule(ObjectMapper objectMapper) {
        this.rules = loadRules(objectMapper);
    }

    @Override
    public List<Finding> analyze(CodeFile file, AnalysisContext context) {
        List<Finding> findings = new ArrayList<>();
        for (RuleDefinition rule : rules) {
            if (!supports(rule, file)) {
                continue;
            }
            for (Pattern pattern : rule.compiledDetectPatterns()) {
                Matcher matcher = pattern.matcher(file.content());
                while (matcher.find()) {
                    if (isSafeMatch(rule, file.content(), matcher)) {
                        continue;
                    }
                    findings.add(toFinding(file, rule, matcher.start()));
                    break;
                }
                if (!findings.isEmpty() && findings.get(findings.size() - 1).ruleId().equals(rule.ruleId())) {
                    break;
                }
            }
        }
        return findings;
    }

    private List<RuleDefinition> loadRules(ObjectMapper objectMapper) {
        Path path = resolveRulePath();
        try {
            String json = Files.readString(path);
            List<RuleDefinition> definitions = objectMapper.readValue(json, new TypeReference<>() {
            });
            return definitions.stream()
                    .sorted((left, right) -> left.ruleId().compareTo(right.ruleId()))
                    .toList();
        } catch (IOException exception) {
            throw new IllegalStateException("Secure coding rule catalog cannot be loaded: " + path, exception);
        }
    }

    private Path resolveRulePath() {
        List<Path> candidates = List.of(
                Path.of("rules", "secure_coding_rules.json"),
                Path.of("backend", "rules", "secure_coding_rules.json")
        );
        return candidates.stream()
                .filter(Files::isRegularFile)
                .findFirst()
                .orElse(candidates.get(0));
    }

    private boolean supports(RuleDefinition rule, CodeFile file) {
        String language = normalize(rule.language());
        String path = file.path().toLowerCase(Locale.ROOT);
        String detected = normalize(file.language());

        if ("generic".equals(language)) {
            return true;
        }
        if ("javascript/typescript".equals(language)) {
            return isJavaScript(path) || "javascript".equals(detected) || "typescript".equals(detected);
        }
        if ("typescript".equals(language)) {
            return path.endsWith(".ts") || path.endsWith(".tsx") || "typescript".equals(detected);
        }
        if ("sql".equals(language)) {
            return path.endsWith(".sql") || "sql".equals(detected);
        }
        return detected.equals(language) || path.endsWith("." + language);
    }

    private boolean isJavaScript(String path) {
        return path.endsWith(".js")
                || path.endsWith(".jsx")
                || path.endsWith(".ts")
                || path.endsWith(".tsx")
                || path.endsWith(".mjs")
                || path.endsWith(".cjs");
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private boolean isSafeMatch(RuleDefinition rule, String source, Matcher matcher) {
        String evidence = matcher.group() + "\n" + lineAt(source, matcher.start());
        return rule.compiledSafePatterns().stream().anyMatch(pattern -> pattern.matcher(evidence).find());
    }

    private Finding toFinding(CodeFile file, RuleDefinition rule, int offset) {
        int lineNumber = file.content().substring(0, offset).split("\n", -1).length;
        return RuleSupport.finding(
                file,
                rule.ruleId(),
                severity(rule.severity()),
                rule.category(),
                rule.title(),
                lineNumber,
                lineAt(file.content(), offset),
                rule.description(),
                rule.fix(),
                rule.goodExample(),
                rule.cwe(),
                "Regex",
                reference(rule),
                rule.kisaCategory()
        );
    }

    private Severity severity(String rawSeverity) {
        String normalized = normalize(rawSeverity);
        if ("critical".equals(normalized) || "high".equals(normalized)) {
            return Severity.HIGH;
        }
        if ("medium".equals(normalized)) {
            return Severity.MEDIUM;
        }
        return Severity.LOW;
    }

    private String reference(RuleDefinition rule) {
        return "%s / %s".formatted(rule.kisaCategory(), rule.owasp());
    }

    private String lineAt(String source, int offset) {
        int safeOffset = Math.max(0, Math.min(offset, source.length()));
        int previousLineBreak = safeOffset == 0 ? -1 : source.lastIndexOf('\n', safeOffset - 1);
        int start = previousLineBreak + 1;
        int end = source.indexOf('\n', safeOffset);
        if (end < 0) {
            end = source.length();
        }
        if (end < start) {
            end = start;
        }
        return source.substring(start, end);
    }

    private record RuleDefinition(
            @JsonProperty("rule_id") String ruleId,
            String language,
            String category,
            String severity,
            @JsonProperty("kisa_category") String kisaCategory,
            String owasp,
            String cwe,
            String title,
            String description,
            @JsonProperty("detect_hint") String detectHint,
            @JsonProperty("bad_example") String badExample,
            @JsonProperty("good_example") String goodExample,
            String fix,
            List<String> detectPatterns,
            List<String> safePatterns
    ) {
        private List<Pattern> compiledDetectPatterns() {
            return compile(detectPatterns);
        }

        private List<Pattern> compiledSafePatterns() {
            return compile(safePatterns);
        }

        private List<Pattern> compile(List<String> patterns) {
            if (patterns == null) {
                return List.of();
            }
            return patterns.stream().map(Pattern::compile).toList();
        }
    }
}
