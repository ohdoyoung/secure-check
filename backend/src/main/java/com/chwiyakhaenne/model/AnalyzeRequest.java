package com.chwiyakhaenne.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AnalyzeRequest(
        String projectName,
        @NotEmpty @Size(max = 10_000) List<@Valid CodeFile> files,
        List<@Valid FindingSuppression> suppressions
) {
    public AnalyzeRequest {
        if (suppressions == null) {
            suppressions = List.of();
        }
    }

    public AnalyzeRequest(String projectName, List<CodeFile> files) {
        this(projectName, files, List.of());
    }
}
