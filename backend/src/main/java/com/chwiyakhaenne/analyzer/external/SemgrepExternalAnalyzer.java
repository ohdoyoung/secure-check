package com.chwiyakhaenne.analyzer.external;

import com.chwiyakhaenne.analyzer.LanguageDetector;
import com.chwiyakhaenne.analyzer.port.ExternalAnalyzerPort;
import com.chwiyakhaenne.model.AnalyzerStatus;
import com.chwiyakhaenne.model.CodeFile;
import com.chwiyakhaenne.model.Finding;
import com.chwiyakhaenne.model.Severity;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

@Component
public class SemgrepExternalAnalyzer implements ExternalAnalyzerPort {

    private final ObjectMapper objectMapper;
    private final boolean enabled;
    private final String command;
    private final String config;

    public SemgrepExternalAnalyzer(
            ObjectMapper objectMapper,
            @Value("${chwiyakhaenne.semgrep.enabled:false}") boolean enabled,
            @Value("${chwiyakhaenne.semgrep.command:semgrep}") String command,
            @Value("${chwiyakhaenne.semgrep.config:p/owasp-top-ten}") String config
    ) {
        this.objectMapper = objectMapper;
        this.enabled = enabled;
        this.command = command;
        this.config = config;
    }

    @Override
    public String name() {
        return "semgrep";
    }

    @Override
    public List<Finding> analyze(List<CodeFile> files) {
        if (!enabled || files.isEmpty()) {
            return List.of();
        }

        Path workspace = null;
        try {
            workspace = Files.createTempDirectory("chwiyakhaenne-semgrep-");
            writeFiles(workspace, files);
            String output = runSemgrep(workspace);
            if (output.isBlank()) {
                return List.of();
            }
            return parseFindings(output, workspace);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return List.of();
        } catch (IOException exception) {
            return List.of();
        } finally {
            deleteRecursively(workspace);
        }
    }

    @Override
    public AnalyzerStatus status(int findingCount) {
        if (!enabled) {
            return new AnalyzerStatus(
                    "Semgrep",
                    false,
                    false,
                    findingCount,
                    "기본 비활성 상태입니다. chwiyakhaenne.semgrep.enabled=true 설정과 Semgrep CLI 설치 후 외부 SAST 결과를 합산합니다."
            );
        }
        boolean available = commandAvailable();
        return new AnalyzerStatus(
                "Semgrep",
                true,
                available,
                findingCount,
                available
                        ? "Semgrep CLI 연결됨 · config=%s".formatted(config)
                        : "Semgrep CLI를 찾지 못했습니다. 설치 후 command 경로를 확인하세요."
        );
    }

    private void writeFiles(Path workspace, List<CodeFile> files) throws IOException {
        for (CodeFile file : files) {
            if (!LanguageDetector.isSupported(file.path())) {
                continue;
            }
            Path relative = Path.of(file.path()).normalize();
            if (relative.isAbsolute() || relative.startsWith("..")) {
                continue;
            }
            Path target = workspace.resolve(relative);
            Files.createDirectories(target.getParent());
            Files.writeString(target, file.content(), StandardCharsets.UTF_8);
        }
    }

    private String runSemgrep(Path workspace) throws IOException, InterruptedException {
        Process process = new ProcessBuilder(command, "--json", "--config", config, workspace.toString())
                .redirectError(ProcessBuilder.Redirect.DISCARD)
                .start();
        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        process.waitFor();
        return output;
    }

    private List<Finding> parseFindings(String output, Path workspace) throws IOException {
        JsonNode root = objectMapper.readTree(output);
        JsonNode results = root.path("results");
        if (!results.isArray()) {
            return List.of();
        }

        List<Finding> findings = new ArrayList<>();
        for (JsonNode result : results) {
            String checkId = result.path("check_id").asText("semgrep");
            String rawPath = result.path("path").asText("unknown");
            String path = normalizeSemgrepPath(workspace, rawPath);
            JsonNode extra = result.path("extra");
            String message = extra.path("message").asText("Semgrep finding");
            int line = Math.max(1, result.path("start").path("line").asInt(1));
            String snippet = extra.path("lines").asText(message);
            String ruleId = mapRuleId(checkId, path);
            findings.add(new Finding(
                    "semgrep:%s:%s:%d".formatted(checkId, path, line),
                    ruleId,
                    severity(extra.path("severity").asText()),
                    "External SAST",
                    "Semgrep: " + checkId,
                    path,
                    line,
                    snippet,
                    semgrepContext(snippet, line),
                    message,
                    "Semgrep 룰 설명과 프로젝트 컨텍스트를 확인한 뒤 안전한 API, 입력 검증, 권한 검사를 적용하세요.",
                    message,
                    cwe(extra.path("metadata").path("cwe")),
                    "Semgrep",
                    "Semgrep CLI",
                    checkId
            ));
        }
        return findings;
    }

    private boolean commandAvailable() {
        try {
            Process process = new ProcessBuilder(command, "--version")
                    .redirectError(ProcessBuilder.Redirect.DISCARD)
                    .start();
            boolean finished = process.waitFor(2, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return false;
            }
            return process.exitValue() == 0;
        } catch (IOException exception) {
            return false;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return false;
        }
    }

    private String semgrepContext(String snippet, int line) {
        String safeSnippet = snippet == null || snippet.isBlank() ? "Semgrep finding" : snippet;
        return "> %4d | %s".formatted(Math.max(1, line), safeSnippet);
    }

    private String normalizeSemgrepPath(Path workspace, String rawPath) {
        Path path = Path.of(rawPath);
        if (path.isAbsolute() && path.startsWith(workspace)) {
            return workspace.relativize(path).toString();
        }
        String prefix = workspace.toString();
        if (rawPath.startsWith(prefix)) {
            return rawPath.substring(prefix.length()).replaceAll("^/+", "");
        }
        return rawPath.replace("\\", "/");
    }

    private String mapRuleId(String checkId, String path) {
        String normalized = checkId.toLowerCase(Locale.ROOT);
        String loweredPath = path.toLowerCase(Locale.ROOT);
        if (normalized.contains("sql") && normalized.contains("injection")) {
            if (loweredPath.endsWith(".java")) return "JAVA_SQLI_001";
            if (loweredPath.endsWith(".py")) return "PY_SQLI_001";
            if (loweredPath.endsWith(".php")) return "PHP_SQLI_001";
            return "NODE_SQLI_001";
        }
        if (normalized.contains("command") && normalized.contains("injection")) {
            if (loweredPath.endsWith(".java")) return "JAVA_CMDI_001";
            if (loweredPath.endsWith(".py")) return "PY_CMDI_001";
            if (loweredPath.endsWith(".php")) return "PHP_CMDI_001";
            return "NODE_CMDI_001";
        }
        if (normalized.contains("xss")) {
            if (loweredPath.endsWith(".java")) return "JAVA_XSS_001";
            if (loweredPath.endsWith(".php")) return "PHP_XSS_001";
            return "NODE_XSS_001";
        }
        if (normalized.contains("ssrf")) {
            if (loweredPath.endsWith(".java")) return "JAVA_SSRF_001";
            if (loweredPath.endsWith(".py")) return "PY_SSRF_001";
            return "GEN_SSRF_001";
        }
        return "SEMGREP:" + checkId;
    }

    private Severity severity(String rawSeverity) {
        String normalized = rawSeverity == null ? "" : rawSeverity.toUpperCase(Locale.ROOT);
        if (normalized.contains("ERROR") || normalized.contains("HIGH")) {
            return Severity.HIGH;
        }
        if (normalized.contains("WARNING") || normalized.contains("MEDIUM")) {
            return Severity.MEDIUM;
        }
        return Severity.LOW;
    }

    private String cwe(JsonNode cweNode) {
        if (cweNode.isArray() && !cweNode.isEmpty()) {
            return cweNode.get(0).asText();
        }
        if (cweNode.isTextual()) {
            return cweNode.asText();
        }
        return "Semgrep";
    }

    private void deleteRecursively(Path root) {
        if (root == null || !Files.exists(root)) {
            return;
        }
        try (var paths = Files.walk(root)) {
            paths.sorted(Comparator.reverseOrder()).forEach(path -> {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException ignored) {
                    // Temporary scan files can be left for the OS cleanup if deletion fails.
                }
            });
        } catch (IOException ignored) {
            // Temporary scan files can be left for the OS cleanup if traversal fails.
        }
    }
}
