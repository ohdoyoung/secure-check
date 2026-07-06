package com.chwiyakhaenne.analyzer.rules;

import com.chwiyakhaenne.analyzer.AnalysisContext;
import com.chwiyakhaenne.model.CodeFile;
import com.chwiyakhaenne.model.Finding;
import com.chwiyakhaenne.model.Severity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Pattern;

@Component
public class SensitiveLogRule implements SecurityRule {

    private static final Pattern PATTERN = Pattern.compile(
            "(?i)((log|logger)\\.(info|debug|warn|error)\\s*\\([^;]*(password|token|secret|authorization)|console\\.log\\s*\\([^;]*(password|token|secret)|print\\s*\\([^;]*(password|token|secret))"
    );

    @Override
    public List<Finding> analyze(CodeFile file, AnalysisContext context) {
        return RuleSupport.scan(
                file,
                Severity.MEDIUM,
                "민감정보 로그",
                "민감정보 로그 출력",
                PATTERN,
                "비밀번호, 토큰, 인증 헤더가 로그에 남으면 내부자나 로그 수집 시스템을 통해 유출될 수 있습니다.",
                "민감정보는 마스킹하고 운영 로그에는 식별자와 상태만 남기세요.",
                """
                log.info("login failed userId={}, reason={}", userId, reason);
                // token/password 값은 출력하지 않습니다.
                """
        );
    }
}
