package com.chwiyakhaenne.api;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AnalysisRateLimiter {

    private static final int DEFAULT_MAX_REQUESTS = 30;
    private static final Duration DEFAULT_WINDOW = Duration.ofMinutes(1);

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final Clock clock;
    private final int maxRequests;
    private final Duration window;

    public AnalysisRateLimiter() {
        this(Clock.systemUTC(), DEFAULT_MAX_REQUESTS, DEFAULT_WINDOW);
    }

    AnalysisRateLimiter(Clock clock, int maxRequests, Duration window) {
        this.clock = clock;
        this.maxRequests = maxRequests;
        this.window = window;
    }

    public void check(HttpServletRequest request) {
        String key = clientKey(request);
        Instant now = Instant.now(clock);
        Bucket bucket = buckets.compute(key, (ignored, current) -> nextBucket(current, now));
        pruneExpiredBuckets(now);
        if (bucket.requests() > maxRequests) {
            throw new RateLimitExceededException();
        }
    }

    private Bucket nextBucket(Bucket current, Instant now) {
        if (current == null || !now.isBefore(current.windowStart().plus(window))) {
            return new Bucket(now, 1);
        }
        return new Bucket(current.windowStart(), current.requests() + 1);
    }

    private String clientKey(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        String remoteAddr = request.getRemoteAddr();
        return remoteAddr == null || remoteAddr.isBlank() ? "unknown" : remoteAddr;
    }

    private void pruneExpiredBuckets(Instant now) {
        Instant oldestAllowed = now.minus(window.multipliedBy(2));
        buckets.entrySet().removeIf(entry -> entry.getValue().windowStart().isBefore(oldestAllowed));
    }

    private record Bucket(Instant windowStart, int requests) {
    }
}
