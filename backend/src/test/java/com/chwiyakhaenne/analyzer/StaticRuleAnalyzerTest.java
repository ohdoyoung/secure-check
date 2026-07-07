package com.chwiyakhaenne.analyzer;

import com.chwiyakhaenne.analyzer.port.ExternalAnalyzerPort;
import com.chwiyakhaenne.analyzer.rules.SecurityRule;
import com.chwiyakhaenne.model.AnalysisResult;
import com.chwiyakhaenne.model.AnalyzeRequest;
import com.chwiyakhaenne.model.AnalyzerStatus;
import com.chwiyakhaenne.model.CodeFile;
import com.chwiyakhaenne.model.Finding;
import com.chwiyakhaenne.model.FindingSuppression;
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

    @Test
    void suppressesFindingsByRuleFileOrExactFindingBeforeScoringAndReports() {
        CodeFile firstFile = new CodeFile(
                "src/app.js",
                "JavaScript",
                "db.query('select * from users where id=' + id);\nconsole.log(id);"
        );
        CodeFile secondFile = new CodeFile(
                "src/admin.js",
                "JavaScript",
                "res.send(req.query.next);"
        );
        Finding suppressedByRule = finding(
                "sql-finding",
                "NODE_SQLI_001",
                Severity.HIGH,
                "src/app.js",
                1,
                "db.query('select * from users where id=' + id);"
        );
        Finding suppressedByFile = finding(
                "xss-finding",
                "NODE_XSS_001",
                Severity.MEDIUM,
                "src/admin.js",
                1,
                "res.send(req.query.next);"
        );
        Finding keptFinding = finding(
                "debug-finding",
                "NODE_DEBUG_001",
                Severity.LOW,
                "src/app.js",
                2,
                "console.log(id);"
        );
        SecurityRule rule = (candidate, context) -> {
            if (candidate.path().equals("src/app.js")) {
                return List.of(suppressedByRule, keptFinding);
            }
            return List.of(suppressedByFile);
        };
        StaticRuleAnalyzer analyzer = new StaticRuleAnalyzer(
                List.of(rule),
                List.of(),
                new HtmlReportGenerator(),
                new SarifReportGenerator(new ObjectMapper())
        );

        AnalysisResult result = analyzer.analyze(new AnalyzeRequest(
                "suppression-project",
                List.of(firstFile, secondFile),
                List.of(
                        new FindingSuppression("rule", "NODE_SQLI_001", null, null, null, "테스트 fixture에서 의도적으로 남김"),
                        new FindingSuppression("file", null, "src/admin.js", null, null, "관리자 샘플 제외")
                )
        ));

        assertThat(result.findings())
                .extracting(Finding::id)
                .containsExactly("debug-finding");
        assertThat(result.suppressedFindingCount()).isEqualTo(2);
        assertThat(result.severityCount().total()).isEqualTo(1);
        assertThat(result.score()).isEqualTo(99);
        assertThat(result.scoreBreakdown().lowPenalty()).isEqualTo(1);
        assertThat(result.fileSummaries())
                .filteredOn(summary -> summary.path().equals("src/admin.js"))
                .first()
                .extracting(summary -> summary.severityCount().total())
                .isEqualTo(0);
        assertThat(result.sarifReport()).contains("NODE_DEBUG_001");
        assertThat(result.sarifReport()).doesNotContain("NODE_SQLI_001");
    }

    @Test
    void usesCappedCurveScoringSoManyHighFindingsDoNotImmediatelyZeroTheScore() {
        List<Finding> findings = java.util.stream.IntStream.rangeClosed(1, 40)
                .mapToObj(index -> finding(
                        "high-" + index,
                        "NODE_SQLI_" + index,
                        Severity.HIGH,
                        "src/app" + index + ".js",
                        index,
                        "db.query('select * from users where id=' + id);"
                ))
                .toList();
        SecurityRule rule = (candidate, context) -> findings;
        StaticRuleAnalyzer analyzer = new StaticRuleAnalyzer(
                List.of(rule),
                List.of(),
                new HtmlReportGenerator(),
                new SarifReportGenerator(new ObjectMapper())
        );

        AnalysisResult result = analyzer.analyze(new AnalyzeRequest(
                "curve-score-project",
                List.of(new CodeFile("src/app.js", "JavaScript", "db.query('select * from users where id=' + id);"))
        ));

        assertThat(result.severityCount().high()).isEqualTo(40);
        assertThat(result.scoreBreakdown().highPenalty()).isLessThanOrEqualTo(82);
        assertThat(result.score()).isGreaterThan(0);
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
