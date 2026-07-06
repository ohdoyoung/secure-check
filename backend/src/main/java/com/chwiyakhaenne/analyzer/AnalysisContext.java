package com.chwiyakhaenne.analyzer;

import com.chwiyakhaenne.model.CodeFile;

import java.util.List;

public record AnalysisContext(List<CodeFile> files) {

    public boolean containsPath(String fileName) {
        return files.stream().anyMatch(file -> file.path().endsWith(fileName));
    }

    public boolean containsCode(String needle) {
        String loweredNeedle = needle.toLowerCase();
        return files.stream().anyMatch(file -> file.content().toLowerCase().contains(loweredNeedle));
    }
}
