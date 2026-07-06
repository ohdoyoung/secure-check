package com.chwiyakhaenne.analyzer;

import com.chwiyakhaenne.analyzer.port.ExternalAnalyzerPort;
import com.chwiyakhaenne.analyzer.rules.SecurityRule;
import com.chwiyakhaenne.model.AnalysisResult;
import com.chwiyakhaenne.model.AnalyzeRequest;
import com.chwiyakhaenne.model.AnalyzerStatus;
import com.chwiyakhaenne.model.CodeFile;
import com.chwiyakhaenne.model.Finding;
import com.chwiyakhaenne.model.Severity;
import com.chwiyakhaenne.report.HtmlReportGenerator;
import com.chwiyakhaenne.report.SarifReportGenerator;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class StaticRuleAnalyzerTest {

    @Test
    void deduplicatesFindingsForSameFileLineAndRuleBeforeScoringAndSummaries() {
        CodeFile file = new CodeFile(
                "src/app.js",
                "JavaScript",
                "const query = req.query.name;\ndb.query('select * from users where name=' + query);"
        );
        Finding builtInFinding = finding(
                "built-in",
                "NODE_SQLI_001",
                Severity.HIGH,
                "src/app.js",
                2,
                "db.query('select * from users where name=' + query);"
        );
        Finding duplicateExternalFinding = finding(
                "semgrep",
                "NODE_SQLI_001",
                Severity.HIGH,
                "src/app.js",
                2,
                "db.query('select * from users where name=' + query);"
        );
        Finding separateFinding = finding(
                "other-rule",
                "NODE_DEBUG_001",
                Severity.MEDIUM,
                "src/app.js",
                2,
                "console.log(query);"
        );
        SecurityRule rule = (candidate, context) -> List.of(builtInFinding, separateFinding);
        ExternalAnalyzerPort externalAnalyzer = new ExternalAnalyzerPort() {
            @Override
            public String name() {
                return "test-external";
            }

            @Override
            public List<Finding> analyze(List<CodeFile> files) {
                return List.of(duplicateExternalFinding);
            }
        };
        StaticRuleAnalyzer analyzer = new StaticRuleAnalyzer(
                List.of(rule),
                List.of(externalAnalyzer),
                new HtmlReportGenerator(),
                new SarifReportGenerator(new ObjectMapper())
        );

        AnalysisResult result = analyzer.analyze(new AnalyzeRequest("dedupe-project", List.of(file)));

        assertThat(result.findings())
                .extracting(Finding::id)
                .containsExactly("built-in", "other-rule");
        assertThat(result.severityCount().high()).isEqualTo(1);
        assertThat(result.severityCount().medium()).isEqualTo(1);
        assertThat(result.fileSummaries().get(0).vulnerabilityCount()).isEqualTo(2);
        assertThat(result.topRiskFiles().get(0).vulnerabilityCount()).isEqualTo(2);
        assertThat(result.analyzerStatuses().get(0).findingCount()).isEqualTo(1);
        assertThat(result.sarifReport()).contains("\"version\" : \"2.1.0\"");
    }

    private Finding finding(
            String id,
            String ruleId,
            Severity severity,
            String filePath,
            int lineNumber,
            String snippet
    ) {
        return new Finding(
                id,
                ruleId,
                severity,
                "입력데이터 검증 및 표현",
                "테스트 취약점",
                filePath,
                lineNumber,
                snippet,
                "> %4d | %s".formatted(lineNumber, snippet),
                "테스트 설명",
                "파라미터 바인딩과 입력 검증을 적용하세요.",
                "db.query('select * from users where name = ?', [query]);",
                "CWE-89",
                "Regex",
                "KISA",
                "입력데이터 검증"
        );
    }
}
