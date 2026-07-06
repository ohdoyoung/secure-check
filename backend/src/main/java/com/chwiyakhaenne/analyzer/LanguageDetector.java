package com.chwiyakhaenne.analyzer;

import java.util.Locale;
import java.util.Set;

public final class LanguageDetector {

    private static final Set<String> SUPPORTED_EXTENSIONS = Set.of(
            ".java", ".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts", ".py",
            ".php", ".sql",
            ".html", ".yml", ".yaml", ".properties", ".json", ".xml", ".gradle", ".kts",
            ".toml", ".tf", ".tfvars", ".hcl", ".env", ".conf", ".dockerfile", "dockerfile",
            "requirements.txt", "requirements-dev.txt", "package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock",
            "pom.xml", "build.gradle", "build.gradle.kts", "settings.gradle", "settings.gradle.kts"
    );

    private LanguageDetector() {
    }

    public static boolean isSupported(String path) {
        String normalized = path.toLowerCase(Locale.ROOT);
        return SUPPORTED_EXTENSIONS.stream().anyMatch(normalized::endsWith);
    }

    public static String detect(String path, String fallback) {
        if (fallback != null && !fallback.isBlank()) {
            return fallback;
        }

        String normalized = path.toLowerCase(Locale.ROOT);
        if (normalized.endsWith(".java")) {
            return "Java";
        }
        if (normalized.endsWith(".js") || normalized.endsWith(".jsx") || normalized.endsWith(".mjs") || normalized.endsWith(".cjs")) {
            return "JavaScript";
        }
        if (normalized.endsWith(".ts") || normalized.endsWith(".tsx") || normalized.endsWith(".mts") || normalized.endsWith(".cts")) {
            return "TypeScript";
        }
        if (normalized.endsWith(".py")) {
            return "Python";
        }
        if (normalized.endsWith(".php")) {
            return "PHP";
        }
        if (normalized.endsWith(".sql")) {
            return "SQL";
        }
        if (normalized.endsWith("dockerfile") || normalized.endsWith(".dockerfile")) {
            return "Dockerfile";
        }
        if (normalized.endsWith(".html")) {
            return "HTML";
        }
        if (normalized.endsWith(".yml") || normalized.endsWith(".yaml") || normalized.endsWith(".properties") || normalized.endsWith(".conf")
                || normalized.endsWith(".tf") || normalized.endsWith(".tfvars") || normalized.endsWith(".hcl")) {
            return "Config";
        }
        if (normalized.endsWith(".json")
                || normalized.endsWith(".xml")
                || normalized.endsWith(".gradle")
                || normalized.endsWith(".kts")
                || normalized.endsWith(".toml")
                || normalized.endsWith("requirements.txt")
                || normalized.endsWith("requirements-dev.txt")
                || normalized.endsWith("package-lock.json")
                || normalized.endsWith("pnpm-lock.yaml")
                || normalized.endsWith("yarn.lock")
                || normalized.endsWith("pom.xml")) {
            return "Dependency";
        }
        return "Text";
    }
}
