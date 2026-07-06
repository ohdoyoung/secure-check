export type Severity = "HIGH" | "MEDIUM" | "LOW";

export type CodeFile = {
  path: string;
  language?: string;
  content: string;
};

export type PastedCodeLanguageOption =
  | "auto"
  | "Java"
  | "JavaScript"
  | "TypeScript"
  | "Python"
  | "PHP"
  | "SQL";

export type AnalyzeRequest = {
  projectName: string;
  files: CodeFile[];
};

export type Finding = {
  id: string;
  ruleId?: string;
  severity: Severity;
  category: string;
  title: string;
  filePath: string;
  lineNumber: number;
  codeSnippet: string;
  lineContext?: string;
  description: string;
  recommendation: string;
  fixedExample: string;
  cwe?: string;
  detectionType?: string;
  kisaReference?: string;
  kisaItem?: string;
};

export type AnalyzerStatus = {
  name: string;
  enabled: boolean;
  available: boolean;
  findingCount: number;
  message: string;
};

export type SeverityCount = {
  high: number;
  medium: number;
  low: number;
  total: number;
};

export type FileRiskSummary = {
  path: string;
  severityCount: SeverityCount;
  vulnerabilityCount: number;
  riskScore: number;
};

export type ProjectTreeNode = {
  name: string;
  path: string;
  type: "directory" | "file";
  vulnerable: boolean;
  severityCount: SeverityCount;
  children: ProjectTreeNode[];
};

export type AnalysisResult = {
  projectName: string;
  analyzedAt: string;
  score: number;
  verdict: string;
  severityCount: SeverityCount;
  findings: Finding[];
  fileSummaries: FileRiskSummary[];
  topRiskFiles: FileRiskSummary[];
  tree: ProjectTreeNode;
  analyzerStatuses?: AnalyzerStatus[];
  htmlReport: string;
  sarifReport?: string;
};

export type InputMode = "paste" | "file" | "zip" | "folder" | "github";
