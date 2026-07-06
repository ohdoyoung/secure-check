package com.chwiyakhaenne.model;

public record Finding(
        String id,
        String ruleId,
        Severity severity,
        String category,
        String title,
        String filePath,
        int lineNumber,
        String codeSnippet,
        String lineContext,
        String description,
        String recommendation,
        String fixedExample,
        String cwe,
        String detectionType,
        String kisaReference,
        String kisaItem
) {
    public Finding(
            String id,
            Severity severity,
            String category,
            String title,
            String filePath,
            int lineNumber,
            String codeSnippet,
            String description,
            String recommendation,
            String fixedExample
    ) {
        this(
                id,
                severity,
                category,
                title,
                filePath,
                lineNumber,
                codeSnippet,
                codeSnippet,
                description,
                recommendation,
                fixedExample
        );
    }

    public Finding(
            String id,
            Severity severity,
            String category,
            String title,
            String filePath,
            int lineNumber,
            String codeSnippet,
            String lineContext,
            String description,
            String recommendation,
            String fixedExample
    ) {
        this(
                id,
                null,
                severity,
                category,
                title,
                filePath,
                lineNumber,
                codeSnippet,
                lineContext,
                description,
                recommendation,
                fixedExample,
                null,
                null,
                null,
                null
        );
    }
}
