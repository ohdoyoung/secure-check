package com.chwiyakhaenne.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record AnalyzeRequest(
        String projectName,
        @NotEmpty List<@Valid CodeFile> files
) {
}
