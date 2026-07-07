package com.chwiyakhaenne.report;

import com.chwiyakhaenne.model.AnalysisResult;
import com.chwiyakhaenne.model.AnalyzerStatus;
import com.chwiyakhaenne.model.FileRiskSummary;
import com.chwiyakhaenne.model.Finding;
import com.chwiyakhaenne.model.ProjectTreeNode;
import com.chwiyakhaenne.model.ScoreBreakdown;
import com.chwiyakhaenne.model.Severity;
import com.chwiyakhaenne.model.SeverityCount;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

class HtmlReportGeneratorTest {

    private final HtmlReportGenerator generator = new HtmlReportGenerator();

    @Test
    void includesAllFindingsInDetailedReport() {
        List<Finding> findings = IntStream.rangeClosed(1, 35)
                .mapToObj(index -> new Finding(
                        "finding-" + index,
                        "RULE-" + index,
                        index % 2 == 0 ? Severity.HIGH : Severity.MEDIUM,
                        "입력데이터 검증 및 표현",
                        "테스트 취약점 " + index,
                        "src/App" + index + ".js",
                        index,
                        "dangerousCall(" + index + ");",
                        "  " + Math.max(1, index - 1) + " | const safe = true;\n> " + index + " | dangerousCall(" + index + ");\n  " + (index + 1) + " | safeCall();",
                        "테스트 설명",
                        "안전한 API를 사용하세요.",
                        "safeCall();",
                        "CWE-79",
                        "Regex",
                        "KISA",
                        "입력데이터 검증"
                ))
                .toList();
        AnalysisResult result = new AnalysisResult(
                "report-project",
                OffsetDateTime.parse("2026-06-15T12:00:00+09:00"),
                28,
                "입원 권장",
                SeverityCount.of(18, 17, 0),
                new ScoreBreakdown(64, 8, 0, 72),
                findings,
                List.of(new FileRiskSummary("src/App35.js", SeverityCount.of(1, 0, 0), 1, 100)),
                List.of(new FileRiskSummary("src/App35.js", SeverityCount.of(1, 0, 0), 1, 100)),
                new ProjectTreeNode("project", "", "directory"),
                2,
                List.of(new AnalyzerStatus("Semgrep", false, false, 0, "테스트 비활성")),
                "",
                ""
        );

        String html = generator.generate(result);

        assertThat(html).contains("상세 finding 35개 전체");
        assertThat(html).contains("테스트 취약점 1");
        assertThat(html).contains("테스트 취약점 35");
        assertThat(html).contains("외부 분석기 상태");
        assertThat(html).contains("코드 컨텍스트");
        assertThat(html).contains("억제됨");
    }
}
