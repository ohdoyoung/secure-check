package com.chwiyakhaenne.analyzer;

import com.chwiyakhaenne.model.AnalysisResult;
import com.chwiyakhaenne.model.AnalyzeRequest;

public interface AnalyzerEngine {
    AnalysisResult analyze(AnalyzeRequest request);
}
