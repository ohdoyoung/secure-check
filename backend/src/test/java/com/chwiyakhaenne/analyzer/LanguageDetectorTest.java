package com.chwiyakhaenne.analyzer;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LanguageDetectorTest {

    @Test
    void supportsServerConfigFiles() {
        assertThat(LanguageDetector.isSupported("nginx/security.conf")).isTrue();
        assertThat(LanguageDetector.detect("nginx/security.conf", null)).isEqualTo("Config");
        assertThat(LanguageDetector.isSupported("infra/main.tf")).isTrue();
        assertThat(LanguageDetector.detect("infra/main.tf", null)).isEqualTo("Config");
    }

    @Test
    void supportsModernJavaScriptAndDependencyFiles() {
        assertThat(LanguageDetector.isSupported("server/index.mjs")).isTrue();
        assertThat(LanguageDetector.detect("server/index.mjs", null)).isEqualTo("JavaScript");
        assertThat(LanguageDetector.isSupported("src/app.mts")).isTrue();
        assertThat(LanguageDetector.detect("src/app.mts", null)).isEqualTo("TypeScript");
        assertThat(LanguageDetector.isSupported("package-lock.json")).isTrue();
        assertThat(LanguageDetector.detect("package-lock.json", null)).isEqualTo("Dependency");
        assertThat(LanguageDetector.isSupported("requirements-dev.txt")).isTrue();
        assertThat(LanguageDetector.detect("requirements-dev.txt", null)).isEqualTo("Dependency");
    }
}
