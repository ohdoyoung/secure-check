package com.chwiyakhaenne.api;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AnalysisRateLimiterTest {

    @Test
    void rejectsRequestsAfterClientExceedsWindowLimit() {
        MutableClock clock = new MutableClock();
        AnalysisRateLimiter limiter = new AnalysisRateLimiter(clock, 2, Duration.ofMinutes(1));
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.7");

        limiter.check(request);
        limiter.check(request);

        assertThatThrownBy(() -> limiter.check(request))
                .isInstanceOf(RateLimitExceededException.class);
    }

    @Test
    void allowsRequestsAfterWindowResets() {
        MutableClock clock = new MutableClock();
        AnalysisRateLimiter limiter = new AnalysisRateLimiter(clock, 1, Duration.ofMinutes(1));
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.7");

        limiter.check(request);
        clock.advance(Duration.ofSeconds(61));
        limiter.check(request);
    }

    private static final class MutableClock extends Clock {

        private Instant instant = Instant.parse("2026-07-04T00:00:00Z");

        @Override
        public ZoneId getZone() {
            return ZoneId.of("UTC");
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }

        private void advance(Duration duration) {
            instant = instant.plus(duration);
        }
    }
}
