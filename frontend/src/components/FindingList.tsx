import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ArrowDownAZ, ChevronDown, CircleDot, FileSearch, Filter, ListChecks, LocateFixed, Search, Target, X } from "lucide-react";
import type { CodeFile, Finding, Severity } from "../types/analysis";
import { SeverityBadge } from "./SeverityBadge";

type SeverityFilter = "ALL" | Severity;
type RuleScope = "ALL" | "KISA" | "OWASP" | "CATALOG" | "EXTERNAL";
type SortMode = "priority" | "file" | "rule";

type FindingListProps = {
  findings: Finding[];
  sourceFiles: CodeFile[];
  selectedFile: string;
  onFileSelect: (file: string) => void;
};

const severityFilters: Array<{ label: string; value: SeverityFilter }> = [
  { label: "전체", value: "ALL" },
  { label: "HIGH", value: "HIGH" },
  { label: "MEDIUM", value: "MEDIUM" },
  { label: "LOW", value: "LOW" }
];

const ruleScopes: Array<{ label: string; value: RuleScope }> = [
  { label: "전체 룰", value: "ALL" },
  { label: "KISA", value: "KISA" },
  { label: "OWASP", value: "OWASP" },
  { label: "다언어", value: "CATALOG" },
  { label: "외부", value: "EXTERNAL" }
];

const severityRank: Record<Severity, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
};

export function FindingList({ findings, sourceFiles, selectedFile, onFileSelect }: FindingListProps) {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("ALL");
  const [ruleScope, setRuleScope] = useState<RuleScope>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("priority");
  const [query, setQuery] = useState("");
  const [activeFindingId, setActiveFindingId] = useState<string | null>(null);

  useEffect(() => {
    setSeverityFilter("ALL");
    setRuleScope("ALL");
    setSortMode("priority");
    setQuery("");
    setActiveFindingId(null);
  }, [findings]);

  const files = useMemo(() => Array.from(new Set(findings.map((finding) => finding.filePath))).sort(), [findings]);
  const sourceFilesByPath = useMemo(() => new Map(sourceFiles.map((file) => [file.path, file])), [sourceFiles]);

  const selectedFileFindings = useMemo(
    () => findings.filter((finding) => selectedFile === "ALL" || finding.filePath === selectedFile),
    [findings, selectedFile]
  );

  const filteredFindings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = findings.filter((finding) => {
      const matchesSeverity = severityFilter === "ALL" || finding.severity === severityFilter;
      const matchesFile = selectedFile === "ALL" || finding.filePath === selectedFile;
      const matchesScope = ruleScope === "ALL" || getRuleScope(finding.ruleId) === ruleScope;
      const matchesQuery = !normalizedQuery
        || [
          finding.ruleId,
          finding.title,
          finding.category,
          finding.filePath,
          finding.cwe,
          finding.description,
          finding.recommendation,
          finding.kisaItem
        ].some((value) => value?.toLowerCase().includes(normalizedQuery));

      return matchesSeverity && matchesFile && matchesScope && matchesQuery;
    });

    return filtered.sort((a, b) => compareFindings(a, b, sortMode));
  }, [findings, query, ruleScope, selectedFile, severityFilter, sortMode]);

  const highCount = selectedFileFindings.filter((finding) => finding.severity === "HIGH").length;
  const mediumCount = selectedFileFindings.filter((finding) => finding.severity === "MEDIUM").length;
  const lowCount = selectedFileFindings.filter((finding) => finding.severity === "LOW").length;
  const topQueue = filteredFindings.filter((finding) => finding.severity === "HIGH").slice(0, 3);
  const activeFinding = useMemo(
    () => findings.find((finding) => finding.id === activeFindingId) ?? null,
    [activeFindingId, findings]
  );
  const activeSourceFile = activeFinding ? sourceFilesByPath.get(activeFinding.filePath) : undefined;
  const activeFileFindings = activeFinding
    ? findings.filter((finding) => finding.filePath === activeFinding.filePath)
    : [];

  const openCodeLocation = (finding: Finding) => {
    setActiveFindingId(finding.id);
    onFileSelect(finding.filePath);
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-semibold text-slate-500">발견 항목</p>
          <h2 className="mt-1 text-lg font-black text-slate-950">수정 우선순위 보드</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {filteredFindings.length} / {findings.length}개 표시
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px] lg:w-[560px]">
          <label className="relative block h-10 min-w-0">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="룰 ID, 파일, 설명 검색"
              className="h-full w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </label>
          <select
            value={selectedFile}
            onChange={(event) => onFileSelect(event.target.value)}
            className="h-10 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
          >
            <option value="ALL">전체 파일</option>
            {files.map((file) => (
              <option key={file} value={file}>
                {file}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-slate-400">현재 범위</p>
              <p className="mt-1 truncate text-sm font-black text-slate-900">
                {selectedFile === "ALL" ? "전체 프로젝트" : selectedFile}
              </p>
            </div>
            {selectedFile !== "ALL" && (
              <button
                type="button"
                onClick={() => onFileSelect("ALL")}
                className="h-8 rounded-md border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:bg-slate-100"
              >
                전체 보기
              </button>
            )}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <CountPill label="HIGH" value={highCount} className="border-red-100 bg-red-50 text-red-700" />
            <CountPill label="MEDIUM" value={mediumCount} className="border-amber-100 bg-amber-50 text-amber-700" />
            <CountPill label="LOW" value={lowCount} className="border-blue-100 bg-blue-50 text-blue-700" />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white">
          <div className="flex items-center gap-2">
            <ListChecks size={16} className="text-slate-300" />
            <p className="text-sm font-black">먼저 볼 항목</p>
          </div>
          <div className="mt-3 space-y-2">
            {topQueue.length === 0 && (
              <p className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold leading-5 text-slate-300">
                현재 필터에서는 HIGH 항목이 없습니다.
              </p>
            )}
            {topQueue.map((finding) => (
              <button
                key={finding.id}
                type="button"
                onClick={() => openCodeLocation(finding)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:bg-white/10"
              >
                <p className="truncate text-xs font-black text-white">{finding.title}</p>
                <p className="mt-1 truncate text-[11px] font-semibold text-slate-400">
                  {finding.filePath}:{finding.lineNumber} · {finding.ruleId}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {severityFilters.map((filter) => {
            const active = severityFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setSeverityFilter(filter.value)}
                className={`h-9 rounded-md border px-3 text-xs font-black transition ${
                  active
                    ? "border-slate-900 bg-slate-950 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
          <div className="flex flex-wrap gap-2">
            {ruleScopes.map((scope) => {
              const active = ruleScope === scope.value;
              return (
                <button
                  key={scope.value}
                  type="button"
                  onClick={() => setRuleScope(scope.value)}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-black transition ${
                    active
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
                  }`}
                >
                  <Filter size={13} />
                  {scope.label}
                </button>
              );
            })}
          </div>
          <label className="relative block h-9">
            <ArrowDownAZ size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="h-full w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs font-black text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="priority">우선순위순</option>
              <option value="file">파일/라인순</option>
              <option value="rule">룰 ID순</option>
            </select>
          </label>
        </div>
      </div>

      {activeFinding && (
        <SourceFileViewer
          finding={activeFinding}
          sourceFile={activeSourceFile}
          fileFindings={activeFileFindings}
          onFindingSelect={(finding) => setActiveFindingId(finding.id)}
          onClose={() => setActiveFindingId(null)}
        />
      )}

      <div className="mt-5 space-y-3">
        {findings.length === 0 && (
          <div className="rounded-md border border-green-100 bg-green-50 px-4 py-5 text-sm font-semibold text-green-700">
            발견된 취약점이 없습니다. 지금 상태를 유지하면 됩니다.
          </div>
        )}
        {findings.length > 0 && filteredFindings.length === 0 && (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-600">
            조건에 맞는 발견 항목이 없습니다.
          </div>
        )}
        {filteredFindings.map((finding, index) => (
          <details key={finding.id} className="group rounded-lg border border-slate-200 bg-slate-50 p-4 open:bg-white">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <PriorityBadge index={index} severity={finding.severity} />
                  <SeverityBadge severity={finding.severity} />
                  {finding.ruleId && (
                    <span className="inline-flex h-7 items-center rounded-md bg-white px-2.5 text-xs font-black text-slate-600 ring-1 ring-slate-200">
                      {finding.ruleId}
                    </span>
                  )}
                  <RuleScopeBadge scope={getRuleScope(finding.ruleId)} />
                </div>
                <p className="mt-3 text-sm font-black text-slate-950">{finding.title}</p>
                <p className="mt-2 truncate text-sm font-semibold text-slate-500">
                  {finding.filePath} {finding.lineNumber}라인
                </p>
              </div>
              <ChevronDown size={20} className="mt-1 shrink-0 text-slate-400 transition group-open:rotate-180" />
            </summary>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
              <CodeEvidence finding={finding} />
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => openCodeLocation(finding)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-950 px-3 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  <LocateFixed size={15} />
                  코드 위치
                </button>
                <InfoBlock label="왜 탐지됐나" value={buildWhyDetected(finding)} icon={<Target size={15} />} />
                <InfoBlock label="권장 조치" value={finding.recommendation} icon={<CircleDot size={15} />} />
              </div>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <ResultBlock label="문제 코드" value={finding.codeSnippet} />
              <ResultBlock label="수정 예시" value={finding.fixedExample} />
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-4">
              <MetaBlock label="CWE" value={finding.cwe || "미지정"} />
              <MetaBlock label="탐지 방식" value={finding.detectionType || "Regex"} />
              <MetaBlock label="기준 문서" value={finding.kisaReference || "MVP Rule"} />
              <MetaBlock label="기준 항목" value={finding.kisaItem || finding.category} />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function SourceFileViewer({
  finding,
  sourceFile,
  fileFindings,
  onFindingSelect,
  onClose
}: {
  finding: Finding;
  sourceFile?: CodeFile;
  fileFindings: Finding[];
  onFindingSelect: (finding: Finding) => void;
  onClose: () => void;
}) {
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const lines = useMemo(() => splitSourceLines(sourceFile?.content ?? ""), [sourceFile]);
  const findingsByLine = useMemo(() => {
    const byLine = new Map<number, Finding[]>();
    for (const item of fileFindings) {
      const current = byLine.get(item.lineNumber) ?? [];
      current.push(item);
      byLine.set(item.lineNumber, current);
    }
    return byLine;
  }, [fileFindings]);

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ block: "center" });
  }, [finding.id, lines.length]);

  return (
    <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-400">
            <FileSearch size={14} />
            코드 위치
          </div>
          <p className="mt-1 truncate text-sm font-black text-slate-950">{finding.filePath}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {finding.lineNumber}라인 · {finding.ruleId || finding.category}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="코드 위치 닫기"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-white"
        >
          <X size={15} />
        </button>
      </div>

      {sourceFile ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
          <div className="scrollbar-thin max-h-[520px] overflow-auto rounded-md border border-slate-200 bg-slate-950 py-2 font-mono text-xs leading-5 text-slate-200">
            {lines.map((line, index) => {
              const lineNumber = index + 1;
              const lineFindings = findingsByLine.get(lineNumber) ?? [];
              const isActiveLine = lineNumber === finding.lineNumber;
              const highestSeverity = highestSeverityForLine(lineFindings);
              return (
                <div
                  key={lineNumber}
                  ref={isActiveLine ? activeLineRef : undefined}
                  className={`grid min-h-6 grid-cols-[56px_34px_minmax(0,1fr)] gap-2 px-3 ${
                    isActiveLine
                      ? "bg-red-500/20 text-white"
                      : lineFindings.length > 0
                        ? "bg-amber-400/10 text-slate-100"
                        : "text-slate-300"
                  }`}
                >
                  <span className="select-none text-right text-slate-500">{lineNumber}</span>
                  <span className={`select-none font-black ${severityMarkerClass(highestSeverity, isActiveLine)}`}>
                    {lineFindings.length > 0 ? "●" : ""}
                  </span>
                  <span className="whitespace-pre-wrap break-words">{line || " "}</span>
                </div>
              );
            })}
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-black uppercase text-slate-400">이 파일의 finding</p>
            <div className="mt-3 space-y-2">
              {fileFindings
                .slice()
                .sort((a, b) => a.lineNumber - b.lineNumber || severityRank[b.severity] - severityRank[a.severity])
                .map((item) => {
                  const active = item.id === finding.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onFindingSelect(item)}
                      className={`w-full rounded-md border px-3 py-2 text-left transition ${
                        active
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span className={`text-[11px] font-black ${active ? "text-white" : severityTextClass(item.severity)}`}>
                        {item.severity} · {item.lineNumber}라인
                      </span>
                      <span className="mt-1 block truncate text-xs font-bold">{item.ruleId || item.title}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          파일 본문 스냅샷이 없어 전후 라인 근거만 볼 수 있습니다.
        </div>
      )}
    </div>
  );
}

function splitSourceLines(content: string) {
  if (!content) return [];
  return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

function highestSeverityForLine(findings: Finding[]) {
  return findings
    .slice()
    .sort((a, b) => severityRank[b.severity] - severityRank[a.severity])[0]?.severity;
}

function severityMarkerClass(severity: Severity | undefined, active: boolean) {
  if (active) return "text-red-300";
  if (severity === "HIGH") return "text-red-400";
  if (severity === "MEDIUM") return "text-amber-300";
  if (severity === "LOW") return "text-blue-300";
  return "text-transparent";
}

function severityTextClass(severity: Severity) {
  if (severity === "HIGH") return "text-red-600";
  if (severity === "MEDIUM") return "text-amber-600";
  return "text-blue-600";
}

function compareFindings(a: Finding, b: Finding, sortMode: SortMode) {
  if (sortMode === "file") {
    return a.filePath.localeCompare(b.filePath) || a.lineNumber - b.lineNumber || severityRank[b.severity] - severityRank[a.severity];
  }
  if (sortMode === "rule") {
    return (a.ruleId ?? "").localeCompare(b.ruleId ?? "") || severityRank[b.severity] - severityRank[a.severity];
  }
  return severityRank[b.severity] - severityRank[a.severity] || a.filePath.localeCompare(b.filePath) || a.lineNumber - b.lineNumber;
}

function getRuleScope(ruleId?: string): RuleScope {
  if (!ruleId) return "EXTERNAL";
  if (ruleId.startsWith("JS-KISA-")) return "KISA";
  if (ruleId.startsWith("JS-OWASP-")) return "OWASP";
  if (/^(JAVA|PY|PHP|NODE|TS|REACT|SQL|GEN|SPRING)_/.test(ruleId)) return "CATALOG";
  return "EXTERNAL";
}

function buildWhyDetected(finding: Finding) {
  const detector = finding.detectionType || "Regex";
  const standard = finding.kisaReference || finding.kisaItem || finding.cwe || "내장 룰셋";
  return `${detector} 기반 탐지에서 ${finding.ruleId || finding.title} 패턴이 발견됐습니다. 기준은 ${standard}이며, ${finding.filePath} ${finding.lineNumber}라인의 코드가 근거입니다.`;
}

function PriorityBadge({ index, severity }: { index: number; severity: Severity }) {
  const tone = severity === "HIGH" ? "bg-red-600 text-white" : severity === "MEDIUM" ? "bg-amber-500 text-white" : "bg-blue-500 text-white";
  return (
    <span className={`inline-flex h-7 items-center rounded-md px-2.5 text-xs font-black ${tone}`}>
      #{index + 1}
    </span>
  );
}

function RuleScopeBadge({ scope }: { scope: RuleScope }) {
  const label = scope === "CATALOG" ? "다언어" : scope === "EXTERNAL" ? "외부" : scope;
  return (
    <span className="inline-flex h-7 items-center rounded-md bg-slate-100 px-2.5 text-xs font-black text-slate-600 ring-1 ring-slate-200">
      {label}
    </span>
  );
}

function CountPill({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className={`rounded-md border px-3 py-2 ${className}`}>
      <p className="text-[11px] font-black">{label}</p>
      <p className="mt-1 text-sm font-black">{value}개</p>
    </div>
  );
}

function CodeEvidence({ finding }: { finding: Finding }) {
  const evidence = finding.lineContext?.trim() || finding.codeSnippet || "코드 근거가 비어 있습니다.";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-slate-400">탐지 근거 · 전후 라인</p>
          <p className="mt-1 truncate text-sm font-black text-slate-900">{finding.filePath}</p>
        </div>
        <span className="inline-flex h-8 shrink-0 items-center rounded-md bg-slate-950 px-3 text-xs font-black text-white">
          {finding.lineNumber}라인
        </span>
      </div>
      <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
        <span className="font-black text-slate-700">&gt;</span> 표시가 실제 탐지 라인입니다.
      </p>
      <pre className="scrollbar-thin mt-4 max-h-48 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3 whitespace-pre-wrap break-words font-mono text-xs leading-5 text-slate-800">
        {evidence}
      </pre>
    </div>
  );
}

function ResultBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-slate-100">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      </div>
      <pre className="scrollbar-thin max-h-52 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5">{value}</pre>
    </div>
  );
}

function InfoBlock({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <p className="text-xs font-black uppercase">{label}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function MetaBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 truncate text-xs font-bold text-slate-700">{value}</p>
    </div>
  );
}
