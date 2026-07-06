package com.chwiyakhaenne.analyzer.rules;

import com.chwiyakhaenne.analyzer.AnalysisContext;
import com.chwiyakhaenne.model.CodeFile;
import com.chwiyakhaenne.model.Finding;
import com.chwiyakhaenne.model.Severity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Pattern;

@Component
public class AuthorizationRule implements SecurityRule {

    private static final Pattern CONTROLLER_PATTERN = Pattern.compile("@(RestController|Controller|GetMapping|PostMapping|PutMapping|DeleteMapping)");
    private static final Pattern AUTH_PATTERN = Pattern.compile("@(PreAuthorize|PostAuthorize|Secured|RolesAllowed)|SecurityFilterChain|authorizeHttpRequests|authenticated\\(\\)");

    @Override
    public List<Finding> analyze(CodeFile file, AnalysisContext context) {
        if (!file.path().toLowerCase().contains("controller") || !CONTROLLER_PATTERN.matcher(file.content()).find()) {
            return List.of();
        }
        if (AUTH_PATTERN.matcher(file.content()).find() || context.files().stream().anyMatch(candidate -> AUTH_PATTERN.matcher(candidate.content()).find())) {
            return List.of();
        }

        int line = firstMatchingLine(file, CONTROLLER_PATTERN);
        return List.of(RuleSupport.finding(
                file,
                Severity.HIGH,
                "인증/인가",
                "인증/인가 누락 의심",
                line,
                RuleSupport.lines(file).get(Math.max(0, line - 1)),
                "컨트롤러 엔드포인트가 보이지만 접근 제어 설정을 찾지 못했습니다.",
                "Spring Security 설정과 메서드 단위 권한 검사를 명시하세요.",
                """
                @PreAuthorize("hasRole('ADMIN')")
                @GetMapping("/admin/users")
                public List<UserResponse> users() {
                    return userService.findAll();
                }
                """
        ));
    }

    private int firstMatchingLine(CodeFile file, Pattern pattern) {
        List<String> lines = RuleSupport.lines(file);
        for (int i = 0; i < lines.size(); i++) {
            if (pattern.matcher(lines.get(i)).find()) {
                return i + 1;
            }
        }
        return 1;
    }
}
