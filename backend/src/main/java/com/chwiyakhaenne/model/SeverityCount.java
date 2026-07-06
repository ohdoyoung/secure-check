package com.chwiyakhaenne.model;

public record SeverityCount(
        int high,
        int medium,
        int low,
        int total
) {
    public static SeverityCount empty() {
        return new SeverityCount(0, 0, 0, 0);
    }

    public static SeverityCount of(int high, int medium, int low) {
        return new SeverityCount(high, medium, low, high + medium + low);
    }
}
