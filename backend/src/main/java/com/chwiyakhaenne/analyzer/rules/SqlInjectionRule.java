package com.chwiyakhaenne.analyzer.rules;

import com.chwiyakhaenne.analyzer.AnalysisContext;
import com.chwiyakhaenne.model.CodeFile;
import com.chwiyakhaenne.model.Finding;
import com.chwiyakhaenne.model.Severity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Pattern;

@Component
public class SqlInjectionRule implements SecurityRule {

    private static final Pattern PATTERN = Pattern.compile(
            "(?i)(createStatement\\s*\\(|statement\\s*\\.\\s*execute(Query|Update)?\\s*\\(|\\.execute(Query|Update)?\\s*\\([^;]*(\\+|String\\.format|`)|cursor\\.execute\\s*\\([^;]*(\\+|f[\"']|\\.format\\(|[\"']\\s*%\\s*[A-Za-z_\\(]))"
    );

    @Override
    public List<Finding> analyze(CodeFile file, AnalysisContext context) {
        return RuleSupport.scan(
                file,
                Severity.HIGH,
                "SQL Injection",
                "SQL Injection 의심",
                PATTERN,
                "사용자 입력값이 SQL 문자열에 직접 결합되면 인증 우회나 데이터 유출로 이어질 수 있습니다.",
                "PreparedStatement, 바인딩 파라미터, ORM 쿼리 파라미터를 사용하세요.",
                """
                PreparedStatement ps = connection.prepareStatement(
                    "SELECT * FROM users WHERE email = ?"
                );
                ps.setString(1, email);
                ResultSet rs = ps.executeQuery();
                """
        );
    }
}
