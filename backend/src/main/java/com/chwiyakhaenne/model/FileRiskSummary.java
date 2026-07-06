package com.chwiyakhaenne.model;

public record FileRiskSummary(
        String path,
        SeverityCount severityCount,
        int vulnerabilityCount,
        int riskScore
) {
}
