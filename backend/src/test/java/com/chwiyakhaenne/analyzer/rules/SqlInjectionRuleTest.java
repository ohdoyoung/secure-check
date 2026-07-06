package com.chwiyakhaenne.analyzer.rules;

import com.chwiyakhaenne.analyzer.AnalysisContext;
import com.chwiyakhaenne.model.CodeFile;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SqlInjectionRuleTest {

    private final SqlInjectionRule rule = new SqlInjectionRule();

    @Test
    void doesNotFlagParameterizedPythonQuery() {
        CodeFile file = new CodeFile(
                "services/report.py",
                "python",
                "cursor.execute(\"SELECT * FROM reports WHERE id=%s\", (user_id,))"
        );

        assertThat(rule.analyze(file, new AnalysisContext(List.of(file)))).isEmpty();
    }

    @Test
    void flagsPythonStringConcatenatedQuery() {
        CodeFile file = new CodeFile(
                "services/report.py",
                "python",
                "cursor.execute(\"SELECT * FROM reports WHERE id='\" + user_id + \"'\")"
        );

        assertThat(rule.analyze(file, new AnalysisContext(List.of(file)))).hasSize(1);
    }
}
