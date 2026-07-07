import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { BadgeCheck, CheckCircle2, Code2, FileSearch, FileText, FolderOpen, ListChecks, Stethoscope } from "lucide-react";
import { Dashboard } from "../components/Dashboard";
import { FileRiskTable } from "../components/FileRiskTable";
import { FindingList } from "../components/FindingList";
import { HistoryPanel } from "../components/HistoryPanel";
import { ProjectTree } from "../components/ProjectTree";
import { ReportActions } from "../components/ReportActions";
import { UploadPanel } from "../components/UploadPanel";
import { ValidationPanel } from "../components/ValidationPanel";
import { getScoreBreakdown } from "../lib/scoring";
import { useCheckupStore } from "../store/useCheckupStore";
import type { AnalysisResult, CodeFile, Finding, Severity } from "../types/analysis";

type ResultTabId = "overview" | "findings" | "files" | "validation" | "reports";

const resultTabs: Array<{ id: ResultTabId; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "개요", icon: Stethoscope },
  { id: "findings", label: "발견 항목", icon: ListChecks },
  { id: "files", label: "파일", icon: FolderOpen },
  { id: "validation", label: "검증", icon: BadgeCheck },
  { id: "reports", label: "리포트", icon: FileText }
];

export function CheckupPage() {
  const result = useCheckupStore((state) => state.result);
  const history = useCheckupStore((state) => state.history);
  const resultFiles = useCheckupStore((state) => state.resultFiles);
  const [selectedFile, setSelectedFile] = useState("ALL");
  const [activeResultTab, setActiveResultTab] = useState<ResultTabId>("overview");
  const [spotlightResult, setSpotlightResult] = useState(false);
  const [pendingResultFocus, setPendingResultFocus] = useState(false);
  const resultSectionRef = useRef<HTMLElement>(null);
  const dashboardAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedFile("ALL");
    setActiveResultTab("overview");
  }, [result]);

  useEffect(() => {
    if (!result || !pendingResultFocus) return;

    const focusTimer = window.setTimeout(() => {
      focusResultSection();
      setPendingResultFocus(false);
    }, 80);

    return () => window.clearTimeout(focusTimer);
  }, [pendingResultFocus, result]);

  const focusResultSection = () => {
    const target = dashboardAnchorRef.current ?? resultSectionRef.current;
    if (!target) return;

    const top = target.getBoundingClientRect().top + window.scrollY - 18;
    setSpotlightResult(true);
    resultSectionRef.current?.focus({ preventScroll: true });
    window.history.replaceState(null, "", "#checkup-dashboard");
    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
    window.scrollTo({
      top: Math.max(top, 0),
      behavior: "smooth",
    });
    window.setTimeout(() => setSpotlightResult(false), 2600);
  };

  const scheduleResultFocus = () => {
    setPendingResultFocus(true);
    window.setTimeout(() => focusResultSection(), 160);
    window.setTimeout(() => focusResultSection(), 720);
  };

  const selectResultTab = (tabId: ResultTabId) => {
    setActiveResultTab(tabId);

    window.requestAnimationFrame(() => {
      const anchor = dashboardAnchorRef.current;
      if (!anchor) return;

      const anchorTop = anchor.getBoundingClientRect().top;
      const shouldRecenter = anchorTop < 72 || anchorTop > window.innerHeight - 120;
      if (shouldRecenter) {
        anchor.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  };

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-5 px-4 pb-12 pt-5 sm:px-6 lg:px-8">
      <UploadPanel onAnalysisComplete={scheduleResultFocus} />

      {result && (
        <section
          id="checkup-results"
          ref={resultSectionRef}
          tabIndex={-1}
          className={`grid gap-5 scroll-mt-6 rounded-xl p-2 transition-[box-shadow,background-color,outline-color] duration-700 ${
            spotlightResult ? "bg-blue-50/60 shadow-[0_0_0_6px_rgba(147,197,253,0.35)] outline outline-1 outline-blue-200" : "bg-transparent outline outline-0 outline-transparent"
          }`}
        >
          <ResultReadyBanner result={result} active={spotlightResult} />
          <div id="checkup-dashboard" ref={dashboardAnchorRef} className="h-0 scroll-mt-5" aria-hidden="true" />
          <ResultTabBar result={result} activeTab={activeResultTab} onTabSelect={selectResultTab} />
          <div className="result-tab-stack">
            <div
              role="tabpanel"
              id="result-panel-overview"
              aria-labelledby="result-tab-overview"
              hidden={activeResultTab !== "overview"}
              className={activeResultTab === "overview" ? "result-tab-panel grid gap-5" : "hidden"}
            >
              <Dashboard result={result} />
            </div>

            <div
              role="tabpanel"
              id="result-panel-findings"
              aria-labelledby="result-tab-findings"
              hidden={activeResultTab !== "findings"}
              className={activeResultTab === "findings" ? "result-tab-panel" : "hidden"}
            >
              <FindingList findings={result.findings} sourceFiles={resultFiles} selectedFile={selectedFile} onFileSelect={setSelectedFile} />
            </div>

            <div
              role="tabpanel"
              id="result-panel-files"
              aria-labelledby="result-tab-files"
              hidden={activeResultTab !== "files"}
              className={activeResultTab === "files" ? "result-tab-panel grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]" : "hidden"}
            >
              <FileInsightPanel result={result} sourceFiles={resultFiles} selectedFile={selectedFile} />
              <div className="grid content-start gap-5">
                <FileRiskTable files={result.fileSummaries} selectedFile={selectedFile} onFileSelect={setSelectedFile} />
                <ProjectTree tree={result.tree} selectedFile={selectedFile} onFileSelect={setSelectedFile} />
              </div>
            </div>

            <div
              role="tabpanel"
              id="result-panel-validation"
              aria-labelledby="result-tab-validation"
              hidden={activeResultTab !== "validation"}
              className={activeResultTab === "validation" ? "result-tab-panel" : "hidden"}
            >
              <ValidationPanel result={result} />
            </div>

            <div
              role="tabpanel"
              id="result-panel-reports"
              aria-labelledby="result-tab-reports"
              hidden={activeResultTab !== "reports"}
              className={activeResultTab === "reports" ? "result-tab-panel grid gap-5 xl:grid-cols-[1fr_420px]" : "hidden"}
            >
              <ReportActions result={result} />
              <HistoryPanel history={history} />
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

type ResultReadyBannerProps = {
  result: AnalysisResult;
  active: boolean;
};

function ResultReadyBanner({ result, active }: ResultReadyBannerProps) {
  const penalty = getScoreBreakdown(result).totalPenalty;
  const suppressedFindingCount = result.suppressedFindingCount ?? 0;

  return (
    <div className={`flex flex-col gap-3 rounded-lg border px-4 py-3 shadow-sm transition-all duration-700 lg:flex-row lg:items-center lg:justify-between ${
      active ? "border-blue-200 bg-white" : "border-slate-200 bg-white"
    }`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white transition-colors ${
          active ? "bg-blue-600" : "bg-emerald-600"
        }`}>
          <CheckCircle2 size={17} />
        </div>
        <div>
          <p className="text-sm font-black text-slate-950">진단 결과가 준비되었습니다.</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            보안 점수 {result.score}점 · 총 취약점 {result.severityCount.total}개 · {result.verdict}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <ResultChip label="HIGH" value={`${result.severityCount.high}개`} tone="text-red-600" />
        <ResultChip label="MEDIUM" value={`${result.severityCount.medium}개`} tone="text-amber-600" />
        <ResultChip label="LOW" value={`${result.severityCount.low}개`} tone="text-blue-600" />
        <ResultChip label="감점" value={`-${penalty}점`} tone="text-slate-900" />
        {suppressedFindingCount > 0 && <ResultChip label="제외" value={`${suppressedFindingCount}개`} tone="text-slate-900" />}
      </div>
    </div>
  );
}

function ResultChip({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1">
      <span className="text-[10px] font-black text-slate-400">{label}</span>
      <span className={`ml-1.5 text-xs font-black ${tone}`}>{value}</span>
    </div>
  );
}

type ResultTabBarProps = {
  result: AnalysisResult;
  activeTab: ResultTabId;
  onTabSelect: (tabId: ResultTabId) => void;
};

function ResultTabBar({ result, activeTab, onTabSelect }: ResultTabBarProps) {
  return (
    <div className="sticky top-2 z-20 rounded-lg border border-slate-200 bg-white/95 p-2 shadow-panel backdrop-blur">
      <div role="tablist" aria-label="진단 결과 보기" className="scrollbar-thin flex gap-2 overflow-x-auto">
        {resultTabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              id={`result-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`result-panel-${id}`}
              onClick={() => onTabSelect(id)}
              className={`group inline-flex h-11 min-w-fit items-center gap-2 rounded-md border px-3 text-sm font-black transition-all duration-200 ${
                active
                  ? "border-blue-600 bg-blue-600 text-white shadow-panel"
                  : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-black ${
                active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 group-hover:text-slate-700"
              }`}>
                {tabSummary(id, result)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function tabSummary(tabId: ResultTabId, result: AnalysisResult) {
  if (tabId === "overview") return `${result.score}점`;
  if (tabId === "findings") return `${result.severityCount.total}개`;
  if (tabId === "files") return `${result.fileSummaries.filter((file) => file.vulnerabilityCount > 0).length}개`;
  if (tabId === "validation") return `${result.analyzerStatuses?.length ?? 0}개`;
  return "저장";
}

type FileInsightPanelProps = {
  result: AnalysisResult;
  sourceFiles: CodeFile[];
  selectedFile: string;
};

function FileInsightPanel({ result, sourceFiles, selectedFile }: FileInsightPanelProps) {
  const previewPath = selectedFile !== "ALL"
    ? selectedFile
    : result.topRiskFiles[0]?.path ?? result.findings[0]?.filePath ?? sourceFiles[0]?.path ?? "";
  const sourceFile = sourceFiles.find((file) => file.path === previewPath);
  const fileFindings = result.findings
    .filter((finding) => finding.filePath === previewPath)
    .sort((a, b) => severityRank[b.severity] - severityRank[a.severity] || a.lineNumber - b.lineNumber);
  const summary = result.fileSummaries.find((file) => file.path === previewPath);
  const lines = splitSourceLines(sourceFile?.content ?? "");
  const findingsByLine = groupFindingsByLine(fileFindings);
  const modeLabel = selectedFile === "ALL" ? "상위 위험 파일 미리보기" : "선택한 파일";

  if (!previewPath) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
        <div className="rounded-md border border-green-100 bg-green-50 px-4 py-5 text-sm font-semibold text-green-700">
          취약 파일이 없습니다. 파일별 코드 근거도 비어 있습니다.
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-500">
            <FileSearch size={14} />
            {modeLabel}
          </div>
          <h2 className="mt-2 truncate text-lg font-black text-slate-950">{previewPath}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {fileFindings.length}개 finding · 위험 점수 {summary?.riskScore ?? 0}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ResultChip label="HIGH" value={`${summary?.severityCount.high ?? 0}개`} tone="text-red-600" />
          <ResultChip label="MEDIUM" value={`${summary?.severityCount.medium ?? 0}개`} tone="text-amber-600" />
          <ResultChip label="LOW" value={`${summary?.severityCount.low ?? 0}개`} tone="text-blue-600" />
        </div>
      </div>

      <div className="mt-5 grid gap-5">
        <div>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-black text-slate-950">코드 위치</p>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-600">
              <Code2 size={13} />
              {sourceFile?.language || "source"}
            </span>
          </div>

          {lines.length > 0 ? (
            <div className="scrollbar-thin max-h-[520px] overflow-auto rounded-lg border border-slate-800 bg-slate-950 py-2 font-mono text-xs leading-5 text-slate-200">
              {lines.map((line, index) => {
                const lineNumber = index + 1;
                const lineFindings = findingsByLine.get(lineNumber) ?? [];
                const severity = highestSeverityForLine(lineFindings);
                return (
                  <div
                    key={lineNumber}
                    className={`grid min-h-6 grid-cols-[52px_30px_minmax(0,1fr)] gap-2 px-3 ${
                      lineFindings.length > 0 ? highlightedLineClass(severity) : "text-slate-300"
                    }`}
                  >
                    <span className="select-none text-right text-slate-500">{lineNumber}</span>
                    <span className={`select-none font-black ${severityMarkerClass(severity)}`}>
                      {lineFindings.length > 0 ? "●" : ""}
                    </span>
                    <span className="whitespace-pre-wrap break-words">{line || " "}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-5 text-sm font-semibold text-amber-800">
              업로드 당시의 파일 본문 스냅샷이 없어 문제 코드 스니펫만 표시합니다.
            </div>
          )}
        </div>

        <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black text-slate-950">문제 코드</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">많은 항목은 이 영역 안에서만 스크롤됩니다.</p>
            </div>
            <span className="text-xs font-black text-slate-400">{fileFindings.length}개</span>
          </div>
          <div className="scrollbar-thin mt-4 grid max-h-[420px] gap-3 overflow-auto pr-1 lg:grid-cols-2">
            {fileFindings.length === 0 && (
              <div className="rounded-md border border-green-100 bg-green-50 px-4 py-5 text-sm font-semibold text-green-700 lg:col-span-2">
                이 파일에서는 발견된 취약점이 없습니다.
              </div>
            )}
            {fileFindings.map((finding) => (
              <FindingSnippet key={finding.id} finding={finding} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FindingSnippet({ finding }: { finding: Finding }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={`inline-flex h-6 items-center rounded-md px-2 text-[11px] font-black text-white ${severityBgClass(finding.severity)}`}>
            {finding.severity}
          </span>
          <p className="mt-2 line-clamp-2 text-sm font-black leading-5 text-slate-950">{finding.title}</p>
        </div>
        <span className="shrink-0 rounded-md bg-slate-950 px-2 py-1 text-[11px] font-black text-white">
          {finding.lineNumber}라인
        </span>
      </div>
      <p className="mt-2 truncate text-xs font-bold text-slate-500">{finding.ruleId || finding.cwe || finding.category}</p>
      <pre className="scrollbar-thin mt-3 max-h-24 overflow-auto whitespace-pre-wrap break-words rounded-md border border-slate-800 bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-100">
        {finding.codeSnippet || finding.lineContext || "코드 스니펫이 비어 있습니다."}
      </pre>
    </article>
  );
}

const severityRank: Record<Severity, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
};

function splitSourceLines(content: string) {
  if (!content) return [];
  return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

function groupFindingsByLine(findings: Finding[]) {
  const byLine = new Map<number, Finding[]>();
  for (const finding of findings) {
    const current = byLine.get(finding.lineNumber) ?? [];
    current.push(finding);
    byLine.set(finding.lineNumber, current);
  }
  return byLine;
}

function highestSeverityForLine(findings: Finding[]) {
  return findings.slice().sort((a, b) => severityRank[b.severity] - severityRank[a.severity])[0]?.severity;
}

function highlightedLineClass(severity: Severity | undefined) {
  if (severity === "HIGH") return "bg-red-500/20 text-white";
  if (severity === "MEDIUM") return "bg-amber-400/15 text-slate-100";
  if (severity === "LOW") return "bg-blue-500/15 text-slate-100";
  return "bg-slate-700/30 text-slate-100";
}

function severityMarkerClass(severity: Severity | undefined) {
  if (severity === "HIGH") return "text-red-300";
  if (severity === "MEDIUM") return "text-amber-300";
  if (severity === "LOW") return "text-blue-300";
  return "text-transparent";
}

function severityBgClass(severity: Severity) {
  if (severity === "HIGH") return "bg-red-600";
  if (severity === "MEDIUM") return "bg-amber-500";
  return "bg-blue-500";
}
