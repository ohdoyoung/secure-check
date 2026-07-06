package com.chwiyakhaenne.analyzer.port;

import com.chwiyakhaenne.model.CodeFile;
import com.chwiyakhaenne.model.Finding;

import java.util.List;

public interface DependencyScannerPort {
    List<Finding> scanManifests(List<CodeFile> dependencyManifests);
}
