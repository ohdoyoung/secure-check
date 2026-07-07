package com.chwiyakhaenne.model;

import java.time.OffsetDateTime;
import java.util.List;

public record AnalysisResult(
        String projectName,
        OffsetDateTime analyzedAt,
        int score,
        String verdict,
        SeverityCount severityCount,
        ScoreBreakdown scoreBreakdown,
        List<Finding> findings,
        List<FileRiskSummary> fileSummaries,
        List<FileRiskSummary> topRiskFiles,
        ProjectTreeNode tree,
        int suppressedFindingCount,
        List<AnalyzerStatus> analyzerStatuses,
        String htmlReport,
        String sarifReport
) {
}
