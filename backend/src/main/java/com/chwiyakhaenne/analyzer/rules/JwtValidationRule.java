package com.chwiyakhaenne.analyzer.rules;

import com.chwiyakhaenne.analyzer.AnalysisContext;
import com.chwiyakhaenne.model.CodeFile;
import com.chwiyakhaenne.model.Finding;
import com.chwiyakhaenne.model.Severity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Pattern;

@Component
public class JwtValidationRule implements SecurityRule {

    private static final Pattern WEAK_JWT_PATTERN = Pattern.compile(
            "(?i)(JWT\\.decode\\s*\\(|jwt\\.decode\\s*\\(|parseClaimsJwt\\s*\\(|split\\(\"\\\\\\.\"\\))"
    );
    private static final Pattern STRONG_VALIDATION_PATTERN = Pattern.compile(
            "(?i)(verify\\s*\\(|parseClaimsJws\\s*\\(|validateToken|JwtDecoder|require\\(Algorithm|withIssuer)"
    );

    @Override
    public List<Finding> analyze(CodeFile file, AnalysisContext context) {
        if (!WEAK_JWT_PATTERN.matcher(file.content()).find()) {
            return List.of();
        }
        if (STRONG_VALIDATION_PATTERN.matcher(file.content()).find()) {
            return List.of();
        }
        return RuleSupport.scan(
                file,
                Severity.MEDIUM,
                "JWT",
                "JWT 검증 누락",
                WEAK_JWT_PATTERN,
                "JWT payload decode만 수행하면 서명, 만료, issuer 검증이 빠질 수 있습니다.",
                "검증 가능한 JWT 라이브러리로 서명, 만료 시간, issuer, audience를 확인하세요.",
                """
                Jws<Claims> claims = Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token);
                """
        );
    }
}
