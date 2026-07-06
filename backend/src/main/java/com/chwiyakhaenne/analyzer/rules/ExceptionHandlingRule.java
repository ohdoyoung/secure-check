package com.chwiyakhaenne.analyzer.rules;

import com.chwiyakhaenne.analyzer.AnalysisContext;
import com.chwiyakhaenne.model.CodeFile;
import com.chwiyakhaenne.model.Finding;
import com.chwiyakhaenne.model.Severity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Pattern;

@Component
public class ExceptionHandlingRule implements SecurityRule {

    private static final Pattern PATTERN = Pattern.compile(
            "(?i)(catch\\s*\\([^)]*\\)\\s*\\{\\s*\\}|except\\s+[^:]+:\\s*pass|catch\\s*\\([^)]*\\)\\s*\\{\\s*e\\.printStackTrace\\s*\\(\\s*\\))"
    );

    @Override
    public List<Finding> analyze(CodeFile file, AnalysisContext context) {
        return RuleSupport.scan(
                file,
                Severity.LOW,
                "예외 처리",
                "예외처리 부족",
                PATTERN,
                "예외를 삼키거나 스택트레이스만 출력하면 장애 원인 파악과 보안 대응이 어려워집니다.",
                "도메인 예외로 변환하고, 필요한 맥락만 안전하게 로깅하세요.",
                """
                catch (IOException exception) {
                    log.warn("file processing failed id={}", fileId);
                    throw new FileProcessingException("파일 처리에 실패했습니다.", exception);
                }
                """
        );
    }
}
