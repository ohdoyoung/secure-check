package com.chwiyakhaenne.model;

public record AnalyzerStatus(
        String name,
        boolean enabled,
        boolean available,
        int findingCount,
        String message
) {
}
