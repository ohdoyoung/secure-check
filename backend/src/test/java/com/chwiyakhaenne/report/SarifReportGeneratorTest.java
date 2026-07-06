package com.chwiyakhaenne.report;

import com.chwiyakhaenne.model.AnalysisResult;
import com.chwiyakhaenne.model.AnalyzerStatus;
import com.chwiyakhaenne.model.FileRiskSummary;
import com.chwiyakhaenne.model.Finding;
import com.chwiyakhaenne.model.ProjectTreeNode;
import com.chwiyakhaenne.model.Severity;
import com.chwiyakhaenne.model.SeverityCount;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SarifReportGeneratorTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final SarifReportGenerator generator = new SarifReportGenerator(objectMapper);

    @Test
    void generatesGithubCodeScanningCompatibleSarif() throws Exception {
        Finding finding = new Finding(
                "sql-1",
                "NODE_SQLI_001",
                Severity.HIGH,
                "입력데이터 검증 및 표현",
                "SQL Injection",
                "/src/app.js",
                12,
                "db.query('select * from users where id=' + id);",
                "   11 | const id = req.query.id;\n>  12 | db.query('select * from users where id=' + id);",
                "사용자 입력이 SQL 문자열에 직접 결합됩니다.",
                "파라미터 바인딩을 사용하세요.",
                "db.query('select * from users where id = ?', [id]);",
                "CWE-89",
                "Regex",
                "KISA",
                "입력데이터 검증"
        );
        AnalysisResult result = new AnalysisResult(
                "ci-project",
                OffsetDateTime.parse("2026-07-06T09:00:00+09:00"),
                88,
                "관리 필요",
                SeverityCount.of(1, 0, 0),
                List.of(finding),
                List.of(new FileRiskSummary("src/app.js", SeverityCount.of(1, 0, 0), 1, 100)),
                List.of(new FileRiskSummary("src/app.js", SeverityCount.of(1, 0, 0), 1, 100)),
                new ProjectTreeNode("project", "", "directory"),
                List.of(new AnalyzerStatus("Semgrep", false, false, 0, "테스트 비활성")),
                "",
                ""
        );

        JsonNode sarif = objectMapper.readTree(generator.generate(result));

        assertThat(sarif.path("version").asText()).isEqualTo("2.1.0");
        JsonNode run = sarif.path("runs").get(0);
        assertThat(run.path("tool").path("driver").path("name").asText()).isEqualTo("취약했네");
        assertThat(run.path("tool").path("driver").path("rules").get(0).path("id").asText()).isEqualTo("NODE_SQLI_001");
        JsonNode sarifResult = run.path("results").get(0);
        assertThat(sarifResult.path("level").asText()).isEqualTo("error");
        assertThat(sarifResult.path("locations").get(0).path("physicalLocation").path("artifactLocation").path("uri").asText())
                .isEqualTo("src/app.js");
        assertThat(sarifResult.path("locations").get(0).path("physicalLocation").path("region").path("startLine").asInt())
                .isEqualTo(12);
        assertThat(sarifResult.path("properties").path("recommendation").asText()).contains("파라미터");
        assertThat(sarifResult.path("partialFingerprints").path("primaryLocationLineHash").asText()).isNotBlank();
    }
}
