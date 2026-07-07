package com.chwiyakhaenne.model;

import java.util.Locale;

public record FindingSuppression(
        String scope,
        String ruleId,
        String filePath,
        Integer lineNumber,
        String findingId,
        String reason
) {
    public boolean matches(Finding finding) {
        return switch (normalizedScope()) {
            case "rule" -> sameText(ruleId, finding.ruleId());
            case "file" -> samePath(filePath, finding.filePath());
            case "finding" -> matchesFinding(finding);
            default -> false;
        };
    }

    public boolean usable() {
        return switch (normalizedScope()) {
            case "rule" -> hasText(ruleId);
            case "file" -> hasText(filePath);
            case "finding" -> hasText(findingId) || (hasText(ruleId) && hasText(filePath) && lineNumber != null);
            default -> false;
        };
    }

    private boolean matchesFinding(Finding finding) {
        if (hasText(findingId) && sameText(findingId, finding.id())) {
            return true;
        }
        return sameText(ruleId, finding.ruleId())
                && samePath(filePath, finding.filePath())
                && lineNumber != null
                && lineNumber == finding.lineNumber();
    }

    private String normalizedScope() {
        return scope == null ? "" : scope.trim().toLowerCase(Locale.ROOT);
    }

    private boolean sameText(String left, String right) {
        return normalizeText(left).equals(normalizeText(right));
    }

    private boolean samePath(String left, String right) {
        return normalizePath(left).equals(normalizePath(right));
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizePath(String value) {
        return normalizeText(value).replace("\\", "/").replaceAll("^/+", "");
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
