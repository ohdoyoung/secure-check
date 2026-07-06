package com.chwiyakhaenne.analyzer.rules;

import com.chwiyakhaenne.analyzer.AnalysisContext;
import com.chwiyakhaenne.model.CodeFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CatalogSecurityRuleTest {

    private final CatalogSecurityRule rule = new CatalogSecurityRule(new ObjectMapper());

    @Test
    void handlesMatchAtFirstCharacter() {
        CodeFile file = new CodeFile(
                "application.properties",
                "Config",
                "management.endpoints.web.exposure.include=*"
        );

        assertThat(rule.analyze(file, new AnalysisContext(List.of(file))))
                .extracting("ruleId")
                .contains("SPRING_ACTUATOR_EXPOSED_001");
    }
}
