package com.chwiyakhaenne.analyzer.rules;

import com.chwiyakhaenne.analyzer.AnalysisContext;
import com.chwiyakhaenne.model.CodeFile;
import com.chwiyakhaenne.model.Finding;
import com.chwiyakhaenne.model.Severity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Pattern;

@Component
public class CommandInjectionRule implements SecurityRule {

    private static final Pattern PATTERN = Pattern.compile(
            "(?i)(Runtime\\.getRuntime\\(\\)\\.exec\\s*\\(|new\\s+ProcessBuilder\\s*\\(|child_process\\.exec\\s*\\(|execSync\\s*\\(|os\\.system\\s*\\(|subprocess\\.[a-zA-Z_]+\\s*\\([^;]*shell\\s*=\\s*True)"
    );

    @Override
    public List<Finding> analyze(CodeFile file, AnalysisContext context) {
        return RuleSupport.scan(
                file,
                Severity.HIGH,
                "Command Injection",
                "Command Injection 의심",
                PATTERN,
                "외부 입력이 OS 명령으로 전달되면 서버 명령 실행 취약점이 될 수 있습니다.",
                "명령 실행을 피하고, 반드시 필요한 경우 allowlist와 인자 배열 방식으로 분리하세요.",
                """
                ProcessBuilder builder = new ProcessBuilder("git", "status", "--short");
                builder.directory(projectDirectory);
                Process process = builder.start();
                """
        );
    }
}
