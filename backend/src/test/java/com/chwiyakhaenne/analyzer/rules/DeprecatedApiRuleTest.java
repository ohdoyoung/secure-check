package com.chwiyakhaenne.analyzer.rules;

import com.chwiyakhaenne.analyzer.AnalysisContext;
import com.chwiyakhaenne.model.CodeFile;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class DeprecatedApiRuleTest {

    private final DeprecatedApiRule rule = new DeprecatedApiRule();

    @Test
    void doesNotFlagEscapeHtmlLibraryFunction() {
        CodeFile file = new CodeFile(
                "PastedCode.js",
                "javascript",
                "const name = escape(String(req.query.name ?? \"\"));"
        );

        assertThat(rule.analyze(file, new AnalysisContext(List.of(file)))).isEmpty();
    }

    @Test
    void flagsBrowserWindowEscapeApi() {
        CodeFile file = new CodeFile(
                "PastedCode.js",
                "javascript",
                "const encoded = window.escape(value);"
        );

        assertThat(rule.analyze(file, new AnalysisContext(List.of(file)))).hasSize(1);
    }
}
