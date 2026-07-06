package com.chwiyakhaenne.analyzer.rules;

import com.chwiyakhaenne.analyzer.AnalysisContext;
import com.chwiyakhaenne.model.CodeFile;
import com.chwiyakhaenne.model.Finding;
import com.chwiyakhaenne.model.Severity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Pattern;

@Component
public class SecretKeyRule implements SecurityRule {

    private static final Pattern PATTERN = Pattern.compile(
            "(?i)(password|passwd|pwd|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|jwt[_-]?secret)\\s*[:=]\\s*[\\\"'][^\\\"']{6,}[\\\"']"
    );

    @Override
    public List<Finding> analyze(CodeFile file, AnalysisContext context) {
        return RuleSupport.scan(
                file,
                Severity.HIGH,
                "Secret",
                "하드코딩된 비밀번호/키",
                PATTERN,
                "코드나 설정 파일에 비밀값이 포함되면 저장소 유출 시 즉시 악용될 수 있습니다.",
                "환경 변수, Secret Manager, 배포 환경별 설정 주입 방식을 사용하세요.",
                """
                String dbPassword = System.getenv("DB_PASSWORD");
                String jwtSecret = secretProvider.get("JWT_SECRET");
                """
        );
    }
}
