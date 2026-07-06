package com.chwiyakhaenne.analyzer.rules;

import com.chwiyakhaenne.analyzer.AnalysisContext;
import com.chwiyakhaenne.model.CodeFile;
import com.chwiyakhaenne.model.Finding;

import java.util.List;

public interface SecurityRule {
    List<Finding> analyze(CodeFile file, AnalysisContext context);
}
