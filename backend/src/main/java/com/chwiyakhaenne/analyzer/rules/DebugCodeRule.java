package com.chwiyakhaenne.analyzer.rules;

import com.chwiyakhaenne.analyzer.AnalysisContext;
import com.chwiyakhaenne.model.CodeFile;
import com.chwiyakhaenne.model.Finding;
import com.chwiyakhaenne.model.Severity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Pattern;

@Component
public class DebugCodeRule implements SecurityRule {

    private static final Pattern PATTERN = Pattern.compile(
            "(?i)(debugger;|System\\.out\\.println\\s*\\(|printStackTrace\\s*\\(|console\\.log\\s*\\(|TODO\\s*security|FIXME\\s*security)"
    );

    @Override
    public List<Finding> analyze(CodeFile file, AnalysisContext context) {
        return RuleSupport.scan(
                file,
                Severity.LOW,
                "Debug",
                "디버그 코드 잔존",
                PATTERN,
                "개발 중 출력 코드가 운영 환경에 남으면 내부 상태나 민감한 흐름이 노출될 수 있습니다.",
                "구조화된 로거를 사용하고, 배포 전 디버그 출력과 보안 TODO를 정리하세요.",
                """
                log.debug("request received id={}", requestId);
                // 운영 설정에서는 debug 레벨을 비활성화합니다.
                """
        );
    }
}
