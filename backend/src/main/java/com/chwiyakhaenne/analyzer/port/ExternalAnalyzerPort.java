package com.chwiyakhaenne.analyzer.port;

import com.chwiyakhaenne.model.AnalyzerStatus;
import com.chwiyakhaenne.model.CodeFile;
import com.chwiyakhaenne.model.Finding;

import java.util.List;

public interface ExternalAnalyzerPort {
    String name();

    List<Finding> analyze(List<CodeFile> files);

    default AnalyzerStatus status(int findingCount) {
        return new AnalyzerStatus(
                name(),
                true,
                true,
                findingCount,
                "외부 분석기 결과가 합산되었습니다."
        );
    }
}
