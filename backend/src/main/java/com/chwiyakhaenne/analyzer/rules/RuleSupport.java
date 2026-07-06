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
        return new Finding(
                id(file.path(), title, lineNumber),
                severity,
                category,
                title,
                file.path(),
                lineNumber,
                codeSnippet.trim(),
                lineContext(file, lineNumber),
                description,
                recommendation,
                fixedExample
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
