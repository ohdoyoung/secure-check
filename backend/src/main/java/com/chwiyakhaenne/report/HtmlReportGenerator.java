package com.chwiyakhaenne.report;

import com.chwiyakhaenne.model.AnalysisResult;
import com.chwiyakhaenne.model.AnalyzerStatus;
import com.chwiyakhaenne.model.FileRiskSummary;
import com.chwiyakhaenne.model.Finding;
import com.chwiyakhaenne.model.ScoreBreakdown;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

import java.time.format.DateTimeFormatter;

@Component
public class HtmlReportGenerator {

    public String generate(AnalysisResult result) {
        String findings = result.findings().stream()
                .map(this::findingSection)
                .reduce("", String::concat);
        String priorityFindings = result.findings().stream()
                .limit(3)
                .map(this::prioritySection)
                .reduce("", String::concat);
        String topRiskFiles = result.topRiskFiles().stream()
                .limit(5)
                .map(this::topRiskFileSection)
                .reduce("", String::concat);
        String analyzerStatuses = result.analyzerStatuses().stream()
                .map(this::analyzerStatusSection)
                .reduce("", String::concat);
        ScoreBreakdown scoreBreakdown = result.scoreBreakdown();

        return """
                <!doctype html>
                <html lang="ko">
                <head>
                  <meta charset="utf-8" />
                  <title>취약했네 보안 진단서</title>
                  <style>
                    @page { margin: 18mm; }
                    * { box-sizing: border-box; }
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #111827; margin: 0; padding: 32px; background: #f6f7f9; line-height: 1.55; }
                    main { max-width: 980px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 24px; padding: 44px; box-shadow: 0 24px 70px rgba(15, 23, 42, .08); }
                    h1 { margin: 0 0 8px; font-size: 32px; line-height: 1.18; letter-spacing: 0; }
                    h2 { margin: 34px 0 12px; font-size: 19px; line-height: 1.3; letter-spacing: 0; }
                    h3 { margin: 0 0 8px; font-size: 17px; line-height: 1.35; letter-spacing: 0; }
                    p { margin: 0 0 12px; }
                    .muted { color: #64748b; }
                    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(176px, 1fr)); gap: 12px; margin: 20px 0 26px; }
                    .card { min-height: 92px; border: 1px solid #e5e7eb; border-radius: 14px; padding: 15px 16px; background: #f9fafb; }
                    .label { color: #64748b; font-size: 12px; font-weight: 700; }
                    .value { margin-top: 8px; font-size: 24px; font-weight: 800; line-height: 1.16; overflow-wrap: anywhere; }
                    .finding { border-top: 1px solid #e5e7eb; margin-top: 18px; padding: 22px 0 0; break-inside: avoid; }
                    .list { display: grid; gap: 10px; margin: 12px 0 26px; }
                    .row { border: 1px solid #e5e7eb; border-radius: 14px; padding: 14px 16px; background: #f9fafb; }
                    .row strong { display: block; margin-bottom: 5px; line-height: 1.4; overflow-wrap: anywhere; }
                    .meta { display: flex; flex-wrap: wrap; gap: 7px; margin: 10px 0 14px; }
                    .pill { border: 1px solid #e5e7eb; border-radius: 999px; padding: 5px 10px; color: #475569; font-size: 12px; font-weight: 700; background: #fff; }
                    code, pre { background: #f3f4f6; border-radius: 12px; }
                    pre { margin: 10px 0 16px; padding: 14px 16px; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; }
                    code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; font-size: 12px; line-height: 1.55; }
                    .HIGH { color: #dc2626; }
                    .MEDIUM { color: #d97706; }
                    .LOW { color: #2563eb; }
                    @media (max-width: 720px) {
                      body { padding: 16px; }
                      main { padding: 24px; border-radius: 18px; }
                    }
                    @media print {
                      body { padding: 0; background: #fff; }
                      main { max-width: none; border: 0; border-radius: 0; padding: 0; box-shadow: none; }
                      .card, .row, pre { break-inside: avoid; }
                    }
                  </style>
                </head>
                <body>
                <main>
                  <p class="muted">AI 기반 시큐어코딩 건강검진 서비스</p>
                  <h1>취약했네 보안 진단서</h1>
                  <p class="muted">당신의 코드는... 취약했네.</p>
                  <section class="summary">
                    <div class="card"><div class="label">프로젝트명</div><div class="value">%s</div></div>
                    <div class="card"><div class="label">검사일</div><div class="value">%s</div></div>
                    <div class="card"><div class="label">보안 점수</div><div class="value">%d점</div></div>
                    <div class="card"><div class="label">종합 판정</div><div class="value">%s</div></div>
                  </section>
                  <section class="summary">
                    <div class="card"><div class="label">HIGH</div><div class="value HIGH">%d</div></div>
                    <div class="card"><div class="label">MEDIUM</div><div class="value MEDIUM">%d</div></div>
                    <div class="card"><div class="label">LOW</div><div class="value LOW">%d</div></div>
                    <div class="card"><div class="label">총 취약점</div><div class="value">%d</div></div>
                    <div class="card"><div class="label">억제됨</div><div class="value">%d</div></div>
                  </section>
                  <h2>권장 조치</h2>
                  <p>HIGH 항목부터 우선 수정하고, 인증/인가와 입력값 검증 흐름을 프로젝트 공통 규칙으로 정리하세요.</p>
                  <h2>점수 산정</h2>
                  <p class="muted">HIGH/MEDIUM/LOW별 상한을 둔 비선형 누적 감점 방식으로 산정합니다.</p>
                  <section class="summary">
                    <div class="card"><div class="label">HIGH 감점</div><div class="value HIGH">-%d</div></div>
                    <div class="card"><div class="label">MEDIUM 감점</div><div class="value MEDIUM">-%d</div></div>
                    <div class="card"><div class="label">LOW 감점</div><div class="value LOW">-%d</div></div>
                    <div class="card"><div class="label">총 감점</div><div class="value">%d</div></div>
                  </section>
                  <h2>가장 먼저 고칠 항목</h2>
                  <div class="list">%s</div>
                  <h2>위험 파일 TOP5</h2>
                  <div class="list">%s</div>
                  <h2>검증 기준</h2>
                  <p class="muted">KISA JavaScript 32개, OWASP JavaScript 추가 11개, 다언어 보안 카탈로그 123개를 합산한 166개 활성 룰로 점검합니다. 현재 KISA JS 커버리지는 32/42(76.19%%), curated 샘플 검증 수는 332개입니다.</p>
                  <h2>외부 분석기 상태</h2>
                  <div class="list">%s</div>
                  <h2>발견 항목</h2>
                  <p class="muted">상세 finding %d개 전체를 포함합니다. 위험도와 파일 위치 기준으로 정렬된 결과이며, 상단에는 우선 조치 3개와 위험 파일 TOP5를 별도로 요약했습니다.</p>
                  %s
                </main>
                </body>
                </html>
                """.formatted(
                escape(result.projectName()),
                result.analyzedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                result.score(),
                escape(result.verdict()),
                result.severityCount().high(),
                result.severityCount().medium(),
                result.severityCount().low(),
                result.severityCount().total(),
                result.suppressedFindingCount(),
                scoreBreakdown.highPenalty(),
                scoreBreakdown.mediumPenalty(),
                scoreBreakdown.lowPenalty(),
                scoreBreakdown.totalPenalty(),
                priorityFindings.isBlank() ? "<p class=\"muted\">우선 수정 항목이 없습니다.</p>" : priorityFindings,
                topRiskFiles.isBlank() ? "<p class=\"muted\">위험 파일이 없습니다.</p>" : topRiskFiles,
                analyzerStatuses.isBlank() ? "<p class=\"muted\">등록된 외부 분석기가 없습니다.</p>" : analyzerStatuses,
                result.findings().size(),
                findings.isBlank() ? "<p class=\"muted\">발견된 취약점이 없습니다.</p>" : findings
        );
    }

    private String prioritySection(Finding finding) {
        return """
                <div class="row">
                  <strong><span class="%s">[%s]</span> %s</strong>
                  <span class="muted">%s %d라인 · %s · %s</span>
                </div>
                """.formatted(
                finding.severity(),
                finding.severity(),
                escape(finding.title()),
                escape(finding.filePath()),
                finding.lineNumber(),
                escape(finding.ruleId() == null ? "MVP-RULE" : finding.ruleId()),
                escape(finding.cwe() == null ? "CWE 미지정" : finding.cwe())
        );
    }

    private String topRiskFileSection(FileRiskSummary file) {
        return """
                <div class="row">
                  <strong>%s</strong>
                  <span class="muted">총 %d개 · HIGH %d · MEDIUM %d · LOW %d · risk %d</span>
                </div>
                """.formatted(
                escape(file.path()),
                file.vulnerabilityCount(),
                file.severityCount().high(),
                file.severityCount().medium(),
                file.severityCount().low(),
                file.riskScore()
        );
    }

    private String analyzerStatusSection(AnalyzerStatus status) {
        String state = status.enabled()
                ? status.available() ? "연결됨" : "대기"
                : "비활성";
        return """
                <div class="row">
                  <strong>%s · %s</strong>
                  <span class="muted">탐지 %d개 · %s</span>
                </div>
                """.formatted(
                escape(status.name()),
                state,
                status.findingCount(),
                escape(status.message())
        );
    }

    private String findingSection(Finding finding) {
        String evidence = finding.lineContext() == null || finding.lineContext().isBlank()
                ? finding.codeSnippet()
                : finding.lineContext();
        return """
                <article class="finding">
                  <h3><span class="%s">[%s]</span> %s</h3>
                  <p class="muted">%s %d라인</p>
                  <div class="meta">%s</div>
                  <p><strong>코드 컨텍스트:</strong></p>
                  <pre><code>%s</code></pre>
                  <p><strong>설명:</strong> %s</p>
                  <p><strong>권장 조치:</strong> %s</p>
                  <p><strong>수정 예시:</strong></p>
                  <pre><code>%s</code></pre>
                </article>
                """.formatted(
                finding.severity(),
                finding.severity(),
                escape(finding.title()),
                escape(finding.filePath()),
                finding.lineNumber(),
                metadata(finding),
                escape(evidence),
                escape(finding.description()),
                escape(finding.recommendation()),
                escape(finding.fixedExample())
        );
    }

    private String metadata(Finding finding) {
        return """
                <span class="pill">%s</span>
                <span class="pill">%s</span>
                <span class="pill">%s</span>
                <span class="pill">%s</span>
                """.formatted(
                escape(finding.ruleId() == null ? "MVP-RULE" : finding.ruleId()),
                escape(finding.cwe() == null ? "CWE 미지정" : finding.cwe()),
                escape(finding.detectionType() == null ? "Regex" : finding.detectionType()),
                escape(finding.kisaItem() == null ? finding.category() : finding.kisaItem())
        );
    }

    private String escape(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value);
    }
}
