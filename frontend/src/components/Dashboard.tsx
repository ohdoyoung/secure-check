import { AlertTriangle, BadgeCheck, Calculator, ClipboardCheck, FileWarning, ShieldCheck, Stethoscope, Target } from "lucide-react";
import { getScoreBreakdown } from "../lib/scoring";
import type { AnalysisResult } from "../types/analysis";
import { ScoreGauge } from "./ScoreGauge";
import { StatCard } from "./StatCard";

const CATALOG_RULE_PATTERN = /^(JAVA|PY|PHP|NODE|TS|REACT|SQL|GEN)_/;
const severityRank = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
} as const;

export function Dashboard({ result }: { result: AnalysisResult }) {
  const total = result.severityCount.total || 1;
  const high = (result.severityCount.high / total) * 100;
  const medium = (result.severityCount.medium / total) * 100;
  const low = (result.severityCount.low / total) * 100;
  const kisaFindingCount = result.findings.filter((finding) => finding.ruleId?.startsWith("JS-KISA-")).length;
  const owaspFindingCount = result.findings.filter((finding) => finding.ruleId?.startsWith("JS-OWASP-")).length;
  const catalogFindingCount = result.findings.filter((finding) => CATALOG_RULE_PATTERN.test(finding.ruleId ?? "")).length;
  const ruleBackedFindingCount = kisaFindingCount + owaspFindingCount + catalogFindingCount;
  const scoreBreakdown = getScoreBreakdown(result);
  const suppressedFindingCount = result.suppressedFindingCount ?? 0;
  const priorityFindings = [...result.findings]
    .sort((a, b) => severityRank[b.severity] - severityRank[a.severity] || a.filePath.localeCompare(b.filePath) || a.lineNumber - b.lineNumber)
    .slice(0, 3);

  return (
    <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
      <ScoreGauge score={result.score} verdict={result.verdict} />

      <section className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="HIGH" value={`${result.severityCount.high}개`} tone="red" icon={AlertTriangle} />
          <StatCard label="MEDIUM" value={`${result.severityCount.medium}개`} tone="amber" icon={FileWarning} />
          <StatCard label="LOW" value={`${result.severityCount.low}개`} tone="blue" icon={ShieldCheck} />
          <StatCard label="총 취약점" value={`${result.severityCount.total}개`} tone="green" icon={Stethoscope} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">수정 우선순위</p>
              <h2 className="mt-1 text-lg font-black text-slate-950">가장 먼저 고칠 3개</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-600">
              <Target size={13} />
              severity · file · line
            </span>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {priorityFindings.length === 0 && (
              <div className="rounded-md border border-green-100 bg-green-50 px-3 py-3 text-sm font-bold text-green-700">
                우선 수정 항목이 없습니다.
              </div>
            )}
            {priorityFindings.map((finding, index) => (
              <div key={finding.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md bg-slate-950 px-2 py-1 text-[11px] font-black text-white">#{index + 1}</span>
                  <span className={`text-xs font-black ${finding.severity === "HIGH" ? "text-red-600" : finding.severity === "MEDIUM" ? "text-amber-600" : "text-blue-600"}`}>
                    {finding.severity}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm font-black leading-5 text-slate-950">{finding.title}</p>
                <p className="mt-2 truncate text-xs font-semibold text-slate-500">{finding.filePath}:{finding.lineNumber}</p>
                <p className="mt-1 truncate text-xs font-bold text-slate-400">{finding.ruleId || finding.cwe || finding.category}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">심각도 비율</p>
              <h2 className="mt-1 text-lg font-black text-slate-950">위험 분포</h2>
            </div>
            <p className="text-sm font-semibold text-slate-500">{result.projectName}</p>
          </div>

          <div className="mt-6 flex h-4 overflow-hidden rounded-full bg-slate-100">
            <div className="bg-red-500" style={{ width: `${high}%` }} />
            <div className="bg-amber-500" style={{ width: `${medium}%` }} />
            <div className="bg-blue-500" style={{ width: `${low}%` }} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <RatioItem label="HIGH" value={result.severityCount.high} className="bg-red-500" />
            <RatioItem label="MEDIUM" value={result.severityCount.medium} className="bg-amber-500" />
            <RatioItem label="LOW" value={result.severityCount.low} className="bg-blue-500" />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">점수 산정</p>
              <h2 className="mt-1 text-lg font-black text-slate-950">감점 내역</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-600">
              <Calculator size={13} />
              100 - {scoreBreakdown.totalPenalty} = {result.score}
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <PenaltyItem label="HIGH" count={result.severityCount.high} limit={82} penalty={scoreBreakdown.highPenalty} tone="text-red-600" />
            <PenaltyItem label="MEDIUM" count={result.severityCount.medium} limit={13} penalty={scoreBreakdown.mediumPenalty} tone="text-amber-600" />
            <PenaltyItem label="LOW" count={result.severityCount.low} limit={5} penalty={scoreBreakdown.lowPenalty} tone="text-blue-600" />
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-xs font-black uppercase text-slate-400">최종 점수</p>
              <p className="mt-1 text-sm font-black text-slate-950">{result.score}점</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">검증 기준</p>
              <h2 className="mt-1 text-lg font-black text-slate-950">룰셋 신뢰도</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-600">
              <BadgeCheck size={13} />
              KISA Coverage 76.19%
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <MetricItem label="활성 룰" value="166개" />
            <MetricItem label="KISA 구현" value="32 / 42" />
            <MetricItem label="샘플 검증" value="332개" />
            <MetricItem label="룰 기반 탐지" value={`${ruleBackedFindingCount}개`} />
            <MetricItem label="다언어 탐지" value={`${catalogFindingCount}개`} />
            <MetricItem label="룰 제외" value={`${suppressedFindingCount}개`} />
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold leading-5 text-slate-600">
            <ClipboardCheck size={15} className="mt-0.5 shrink-0 text-slate-500" />
            <p>Curated positive/negative 샘플 기준 Precision/Recall 100%. 실제 프로젝트 검증률은 오픈소스 벤치마크와 Semgrep 연동으로 별도 측정합니다.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function PenaltyItem({ label, count, limit, penalty, tone }: { label: string; count: number; limit: number; penalty: number; tone: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-black ${tone}`}>-{penalty}점</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{count}개 · 최대 {limit}점</p>
    </div>
  );
}

function RatioItem({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-600">
        <span className={`h-2.5 w-2.5 rounded-full ${className}`} />
        {label}
      </span>
      <span className="text-sm font-black text-slate-900">{value}개</span>
    </div>
  );
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}
