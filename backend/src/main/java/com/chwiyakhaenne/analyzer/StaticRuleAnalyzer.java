package com.chwiyakhaenne.analyzer;

import com.chwiyakhaenne.analyzer.port.ExternalAnalyzerPort;
import com.chwiyakhaenne.analyzer.rules.SecurityRule;
import com.chwiyakhaenne.model.AnalysisResult;
import com.chwiyakhaenne.model.AnalyzerStatus;
import com.chwiyakhaenne.model.AnalyzeRequest;
import com.chwiyakhaenne.model.CodeFile;
import com.chwiyakhaenne.model.FileRiskSummary;
import com.chwiyakhaenne.model.Finding;
import com.chwiyakhaenne.model.ProjectTreeNode;
import com.chwiyakhaenne.model.Severity;
import com.chwiyakhaenne.model.SeverityCount;
import com.chwiyakhaenne.report.HtmlReportGenerator;
import com.chwiyakhaenne.report.SarifReportGenerator;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class StaticRuleAnalyzer implements AnalyzerEngine {

    private final List<SecurityRule> rules;
    private final List<ExternalAnalyzerPort> externalAnalyzers;
    private final HtmlReportGenerator htmlReportGenerator;
    private final SarifReportGenerator sarifReportGenerator;

    public StaticRuleAnalyzer(
            List<SecurityRule> rules,
            List<ExternalAnalyzerPort> externalAnalyzers,
            HtmlReportGenerator htmlReportGenerator,
            SarifReportGenerator sarifReportGenerator
    ) {
        this.rules = rules;
        this.externalAnalyzers = externalAnalyzers;
        this.htmlReportGenerator = htmlReportGenerator;
        this.sarifReportGenerator = sarifReportGenerator;
    }

    @Override
    public AnalysisResult analyze(AnalyzeRequest request) {
        List<CodeFile> files = normalizeFiles(request.files());
        AnalysisContext context = new AnalysisContext(files);
        List<Finding> findings = new ArrayList<>();
        findings.addAll(files.stream()
                .filter(file -> LanguageDetector.isSupported(file.path()))
                .flatMap(file -> rules.stream().flatMap(rule -> rule.analyze(file, context).stream()))
                .toList());
        List<AnalyzerStatus> analyzerStatuses = new ArrayList<>();
        for (ExternalAnalyzerPort analyzer : externalAnalyzers) {
            List<Finding> analyzerFindings = analyzer.analyze(files);
            findings.addAll(analyzerFindings);
            analyzerStatuses.add(analyzer.status(analyzerFindings.size()));
        }
        findings = deduplicate(findings).stream()
                .sorted(findingComparator())
                .toList();

        SeverityCount totalCount = count(findings);
        int score = calculateScore(totalCount);
        String verdict = verdict(score);
        List<FileRiskSummary> summaries = summarizeFiles(files, findings);
        List<FileRiskSummary> topRiskFiles = summaries.stream()
                .filter(summary -> summary.vulnerabilityCount() > 0)
                .sorted(Comparator.comparingInt(FileRiskSummary::riskScore).reversed())
                .limit(5)
                .toList();
        ProjectTreeNode tree = buildTree(files, summaries);

        AnalysisResult result = new AnalysisResult(
                projectName(request.projectName()),
                OffsetDateTime.now(),
                score,
                verdict,
                totalCount,
                findings,
                summaries,
                topRiskFiles,
                tree,
                analyzerStatuses,
                "",
                ""
        );
        return new AnalysisResult(
                result.projectName(),
                result.analyzedAt(),
                result.score(),
                result.verdict(),
                result.severityCount(),
                result.findings(),
                result.fileSummaries(),
                result.topRiskFiles(),
                result.tree(),
                result.analyzerStatuses(),
                htmlReportGenerator.generate(result),
                sarifReportGenerator.generate(result)
        );
    }

    private List<CodeFile> normalizeFiles(List<CodeFile> files) {
        return files.stream()
                .filter(Objects::nonNull)
                .filter(file -> file.path() != null && file.content() != null)
                .map(file -> new CodeFile(
                        normalizePath(file.path()),
                        LanguageDetector.detect(file.path(), file.language()),
                        file.content()
                ))
                .filter(file -> !file.content().isBlank())
                .toList();
    }

    private String normalizePath(String path) {
        return path.replace("\\", "/").replaceAll("^/+", "");
    }

    private String projectName(String projectName) {
        if (projectName == null || projectName.isBlank()) {
            return "취약했네 프로젝트";
        }
        return projectName;
    }

    private Comparator<Finding> findingComparator() {
        Map<Severity, Integer> order = new EnumMap<>(Severity.class);
        order.put(Severity.HIGH, 0);
        order.put(Severity.MEDIUM, 1);
        order.put(Severity.LOW, 2);
        return Comparator
                .comparing((Finding finding) -> order.get(finding.severity()))
                .thenComparing(Finding::filePath)
                .thenComparingInt(Finding::lineNumber);
    }

    private List<Finding> deduplicate(List<Finding> findings) {
        Map<String, Finding> byLocationAndRule = new LinkedHashMap<>();
        for (Finding finding : findings) {
            String key = deduplicationKey(finding);
            Finding existing = byLocationAndRule.get(key);
            if (existing == null || evidenceScore(finding) > evidenceScore(existing)) {
                byLocationAndRule.put(key, finding);
            }
        }
        return new ArrayList<>(byLocationAndRule.values());
    }

    private String deduplicationKey(Finding finding) {
        String ruleKey = normalizeKey(finding.ruleId());
        if (ruleKey.isBlank()) {
            ruleKey = normalizeKey(finding.category()) + ":" + normalizeKey(finding.title());
        }
        return normalizePath(finding.filePath()) + ":" + finding.lineNumber() + ":" + ruleKey;
    }

    private int evidenceScore(Finding finding) {
        return evidenceValue(finding.lineContext())
                + evidenceValue(finding.codeSnippet())
                + evidenceValue(finding.description())
                + evidenceValue(finding.recommendation())
                + evidenceValue(finding.fixedExample())
                + evidenceValue(finding.cwe())
                + evidenceValue(finding.detectionType())
                + evidenceValue(finding.kisaReference())
                + evidenceValue(finding.kisaItem());
    }

    private int evidenceValue(String value) {
        if (value == null || value.isBlank()) {
            return 0;
        }
        return Math.min(value.trim().length(), 200);
    }

    private String normalizeKey(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private SeverityCount count(List<Finding> findings) {
        int high = 0;
        int medium = 0;
        int low = 0;
        for (Finding finding : findings) {
            if (finding.severity() == Severity.HIGH) {
                high++;
            } else if (finding.severity() == Severity.MEDIUM) {
                medium++;
            } else {
                low++;
            }
        }
        return SeverityCount.of(high, medium, low);
    }

    private int calculateScore(SeverityCount count) {
        int penalty = count.high() * 12 + count.medium() * 6 + count.low() * 2;
        return Math.max(0, 100 - penalty);
    }

    private String verdict(int score) {
        if (score >= 90) {
            return "건강함";
        }
        if (score >= 70) {
            return "관리 필요";
        }
        if (score >= 40) {
            return "많이 취약했네";
        }
        return "입원 권장";
    }

    private List<FileRiskSummary> summarizeFiles(List<CodeFile> files, List<Finding> findings) {
        Map<String, List<Finding>> byPath = findings.stream()
                .collect(Collectors.groupingBy(Finding::filePath));
        List<FileRiskSummary> summaries = new ArrayList<>();
        for (CodeFile file : files) {
            List<Finding> fileFindings = byPath.getOrDefault(file.path(), List.of());
            SeverityCount count = count(fileFindings);
            summaries.add(new FileRiskSummary(
                    file.path(),
                    count,
                    count.total(),
                    count.high() * 100 + count.medium() * 40 + count.low() * 10
            ));
        }
        return summaries.stream()
                .sorted(Comparator.comparingInt(FileRiskSummary::riskScore).reversed().thenComparing(FileRiskSummary::path))
                .toList();
    }

    private ProjectTreeNode buildTree(List<CodeFile> files, List<FileRiskSummary> summaries) {
        Map<String, FileRiskSummary> summaryMap = summaries.stream()
                .collect(Collectors.toMap(FileRiskSummary::path, summary -> summary, (left, right) -> left, LinkedHashMap::new));
        ProjectTreeNode root = new ProjectTreeNode("project", "", "directory");
        for (CodeFile file : files) {
            String[] parts = file.path().split("/");
            ProjectTreeNode current = root;
            StringBuilder currentPath = new StringBuilder();
            for (int i = 0; i < parts.length; i++) {
                if (parts[i].isBlank()) {
                    continue;
                }
                if (!currentPath.isEmpty()) {
                    currentPath.append("/");
                }
                currentPath.append(parts[i]);
                String type = i == parts.length - 1 ? "file" : "directory";
                current = current.child(parts[i], currentPath.toString(), type);
                FileRiskSummary summary = summaryMap.get(currentPath.toString());
                if (summary != null) {
                    current.setSeverityCount(summary.severityCount());
                    current.setVulnerable(summary.vulnerabilityCount() > 0);
                }
            }
        }
        aggregateTree(root);
        sortTree(root);
        return root;
    }

    private SeverityCount aggregateTree(ProjectTreeNode node) {
        int high = node.getSeverityCount().high();
        int medium = node.getSeverityCount().medium();
        int low = node.getSeverityCount().low();
        for (ProjectTreeNode child : node.getChildren()) {
            SeverityCount childCount = aggregateTree(child);
            high += childCount.high();
            medium += childCount.medium();
            low += childCount.low();
            if (child.isVulnerable()) {
                node.setVulnerable(true);
            }
        }
        SeverityCount count = SeverityCount.of(high, medium, low);
        node.setSeverityCount(count);
        if (count.total() > 0) {
            node.setVulnerable(true);
        }
        return count;
    }

    private void sortTree(ProjectTreeNode node) {
        node.getChildren().sort(Comparator
                .comparing(ProjectTreeNode::getType)
                .thenComparing(child -> child.getName().toLowerCase(Locale.ROOT)));
        node.getChildren().forEach(this::sortTree);
    }
}
