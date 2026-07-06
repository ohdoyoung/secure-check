package com.chwiyakhaenne.analyzer.rules;

import com.chwiyakhaenne.analyzer.AnalysisContext;
import com.chwiyakhaenne.model.CodeFile;
import com.chwiyakhaenne.model.Finding;
import com.chwiyakhaenne.model.Severity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Pattern;

@Component
public class DangerousApiRule implements SecurityRule {

    private static final Pattern PATTERN = Pattern.compile(
            "(?i)(eval\\s*\\(|Function\\s*\\(|ObjectInputStream\\s*\\(|pickle\\.loads\\s*\\(|yaml\\.load\\s*\\(|md5\\s*\\(|sha1\\s*\\()"
    );

    @Override
    public List<Finding> analyze(CodeFile file, AnalysisContext context) {
        return RuleSupport.scan(
                file,
                Severity.HIGH,
                "위험 API",
                "위험 API 사용",
                PATTERN,
                "동적 코드 실행, 안전하지 않은 역직렬화, 취약한 해시 API는 공격 표면을 크게 늘립니다.",
                "안전한 파서와 검증된 암호화 API를 사용하고, 동적 실행은 제거하세요.",
                """
                // 예: eval 대신 명시적인 매핑 사용
                const handlers = { start: startJob, stop: stopJob };
                handlers[action]?.();
                """
        );
    }
}
