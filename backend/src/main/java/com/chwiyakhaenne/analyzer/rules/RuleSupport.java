package com.chwiyakhaenne.analyzer.rules;

import com.chwiyakhaenne.model.CodeFile;
import com.chwiyakhaenne.model.Finding;
import com.chwiyakhaenne.model.Severity;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.regex.Pattern;

final class RuleSupport {

    private RuleSupport() {
    }

    static List<String> lines(CodeFile file) {
        return file.content().lines().toList();
    }

    static List<Finding> scan(
            CodeFile file,
            Severity severity,
            String category,
            String title,
            Pattern pattern,
            String description,
            String recommendation,
            String fixedExample
    ) {
        List<Finding> findings = new ArrayList<>();
        List<String> lines = lines(file);
        for (int i = 0; i < lines.size(); i++) {
            String line = lines.get(i);
            if (pattern.matcher(line).find()) {
                findings.add(finding(
                        file,
                        severity,
                        category,
                        title,
                        i + 1,
                        line,
                        description,
                        recommendation,
                        fixedExample
                ));
            }
        }
        return findings;
    }

    static Finding finding(
            CodeFile file,
            Severity severity,
            String category,
            String title,
            int lineNumber,
            String codeSnippet,
            String description,
            String recommendation,
            String fixedExample
    ) {
        String ruleId = builtInRuleId(title);
        return new Finding(
                id(file.path(), ruleId, lineNumber),
                ruleId,
                severity,
                category,
                title,
                file.path(),
                lineNumber,
                codeSnippet.trim(),
                lineContext(file, lineNumber),
                description,
                recommendation,
                fixedExample,
                null,
                "Regex",
                null,
                null
        );
    }

    static Finding finding(
            CodeFile file,
            String ruleId,
            Severity severity,
            String category,
            String title,
            int lineNumber,
            String codeSnippet,
            String description,
            String recommendation,
            String fixedExample,
            String cwe,
            String detectionType,
            String kisaReference,
            String kisaItem
    ) {
        return new Finding(
                id(file.path(), ruleId == null ? title : ruleId, lineNumber),
                ruleId,
                severity,
                category,
                title,
                file.path(),
                lineNumber,
                codeSnippet.trim(),
                lineContext(file, lineNumber),
                description,
                recommendation,
                fixedExample,
                cwe,
                detectionType,
                kisaReference,
                kisaItem
        );
    }

    private static String id(String path, String title, int lineNumber) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest((path + title + lineNumber).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash).substring(0, 12);
        } catch (NoSuchAlgorithmException exception) {
            return path + ":" + lineNumber + ":" + title;
        }
    }

    private static String builtInRuleId(String title) {
        return switch (title) {
            case "인증/인가 누락 의심" -> "BUILTIN_AUTHZ_MISSING_001";
            case "Command Injection 의심" -> "BUILTIN_CMDI_001";
            case "위험 API 사용" -> "BUILTIN_DANGEROUS_API_001";
            case "Deprecated 함수/구조 사용" -> "BUILTIN_DEPRECATED_API_001";
            case "디버그 코드 잔존" -> "BUILTIN_DEBUG_CODE_001";
            case "예외처리 부족" -> "BUILTIN_EXCEPTION_HANDLING_001";
            case "파일 업로드 검증 부족" -> "BUILTIN_FILE_UPLOAD_001";
            case "JWT 검증 누락" -> "BUILTIN_JWT_VALIDATION_001";
            case "하드코딩된 비밀번호/키" -> "BUILTIN_SECRET_KEY_001";
            case "민감정보 로그 출력" -> "BUILTIN_SENSITIVE_LOG_001";
            case "SQL Injection 의심" -> "BUILTIN_SQLI_001";
            case "XSS 가능성" -> "BUILTIN_XSS_001";
            default -> "BUILTIN_" + title.replaceAll("[^A-Za-z0-9]+", "_").replaceAll("^_+|_+$", "").toUpperCase() + "_001";
        };
    }

    private static String lineContext(CodeFile file, int lineNumber) {
        List<String> lines = lines(file);
        int index = Math.max(0, lineNumber - 1);
        int start = Math.max(0, index - 2);
        int end = Math.min(lines.size(), index + 3);
        List<String> context = new ArrayList<>();
        for (int i = start; i < end; i++) {
            String marker = i == index ? ">" : " ";
            context.add("%s %4d | %s".formatted(marker, i + 1, lines.get(i)));
        }
        return String.join("\n", context);
    }
}
