package com.chwiyakhaenne.model;

import jakarta.validation.constraints.NotBlank;

public record CodeFile(
        @NotBlank String path,
        String language,
        @NotBlank String content
) {
}
