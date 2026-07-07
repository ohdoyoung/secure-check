package com.chwiyakhaenne.model;

public record ScoreBreakdown(
        int highPenalty,
        int mediumPenalty,
        int lowPenalty,
        int totalPenalty
) {
}
