package com.chwiyakhaenne.analyzer.rules;

import com.chwiyakhaenne.analyzer.AnalysisContext;
import com.chwiyakhaenne.model.CodeFile;
import com.chwiyakhaenne.model.Finding;
import com.chwiyakhaenne.model.Severity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Pattern;

@Component
public class DeprecatedApiRule implements SecurityRule {

    private static final Pattern PATTERN = Pattern.compile(
            "(?i)(@Deprecated|Thread\\.stop\\s*\\(|Date\\.getYear\\s*\\(|window\\.(escape|unescape)\\s*\\(|\\bunescape\\s*\\(|WebSecurityConfigurerAdapter)"
    );

    @Override
    public List<Finding> analyze(CodeFile file, AnalysisContext context) {
        return RuleSupport.scan(
                file,
                Severity.LOW,
                "Deprecated",
                "Deprecated 함수/구조 사용",
                PATTERN,
                "오래된 API는 보안 패치와 프레임워크 권장 흐름에서 멀어질 가능성이 큽니다.",
                "현재 프레임워크 권장 API로 교체하고, 제거 예정 API는 이관 일정을 잡으세요.",
                """
                @Bean
                SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                    return http.authorizeHttpRequests(auth -> auth.anyRequest().authenticated()).build();
                }
                """
        );
    }
}
