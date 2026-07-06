package com.chwiyakhaenne.analyzer.rules;

import com.chwiyakhaenne.analyzer.AnalysisContext;
import com.chwiyakhaenne.model.CodeFile;
import com.chwiyakhaenne.model.Finding;
import com.chwiyakhaenne.model.Severity;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Component
public class XssRule implements SecurityRule {

    private static final Pattern PATTERN = Pattern.compile(
            "(?i)(innerHTML\\s*=|outerHTML\\s*=|document\\.write\\s*\\(|dangerouslySetInnerHTML|v-html=)"
    );

    @Override
    public List<Finding> analyze(CodeFile file, AnalysisContext context) {
        List<Finding> findings = new ArrayList<>();
        List<String> lines = RuleSupport.lines(file);
        for (int i = 0; i < lines.size(); i++) {
            String line = lines.get(i);
            if (!PATTERN.matcher(line).find() || isSanitizedHtmlInjection(lines, i)) {
                continue;
            }
            findings.add(RuleSupport.finding(
                    file,
                    Severity.MEDIUM,
                    "XSS",
                    "XSS 가능성",
                    i + 1,
                    line,
                    "HTML을 직접 주입하면 스크립트 실행 취약점으로 이어질 수 있습니다.",
                    "텍스트 바인딩을 기본으로 사용하고, 필요한 경우 신뢰 가능한 sanitizer를 거치세요.",
                    """
                    element.textContent = userInput;
                    // React에서는 dangerouslySetInnerHTML 대신 JSX escape를 사용하세요.
                    """
            ));
        }
        return findings;
    }

    private boolean isSanitizedHtmlInjection(List<String> lines, int index) {
        String line = lines.get(index);
        if (line.matches("(?is).*\\b(?:DOMPurify\\.sanitize|sanitize)\\s*\\(.*")) {
            return true;
        }
        if (!line.matches("(?is).*__html\\s*:\\s*(?:clean|sanitized|safeHtml)\\b.*")) {
            return false;
        }

        int start = Math.max(0, index - 3);
        for (int i = start; i <= index; i++) {
            if (lines.get(i).matches("(?is).*\\b(?:DOMPurify\\.sanitize|sanitize)\\s*\\(.*")) {
                return true;
            }
        }
        return false;
    }
}
