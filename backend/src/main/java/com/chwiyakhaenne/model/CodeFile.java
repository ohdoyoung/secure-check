package com.chwiyakhaenne.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CodeFile(
        @NotBlank String path,
        String language,
        @NotNull String content
) {
}
