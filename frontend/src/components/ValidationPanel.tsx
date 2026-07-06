import { BadgeCheck, FlaskConical, ShieldCheck, Wrench } from "lucide-react";
import type { AnalysisResult, AnalyzerStatus } from "../types/analysis";

const verificationMetrics = [
  { label: "KISA JS 커버리지", value: "32/42", detail: "76.19% · 2023 가이드 매핑" },
  { label: "활성 룰", value: "166개", detail: "KISA 32 + OWASP 11 + 다언어 123" },
  { label: "샘플 검증", value: "332개", detail: "positive/negative 자동 테스트" },
  { label: "정밀도/재현율", value: "100%", detail: "curated QA 기준" }
];

const scenarioMetrics = [
  "Curated catalog: 123/123 탐지",
  "현실형 취약 플로우: 98/98 탐지",
  "실무형 폴더 시나리오: 97/97 탐지",
  "안전 코드 핵심 금지 룰: 0건 탐지"
];

type ValidationPanelProps = {
  result: AnalysisResult;
};

export function ValidationPanel({ result }: ValidationPanelProps) {
  const analyzerStatuses = result.analyzerStatuses ?? [];

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">검증률</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">룰셋 신뢰도 지표</h2>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
            <BadgeCheck size={17} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {verificationMetrics.map((metric) => (
            <div key={metric.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase text-slate-400">{metric.label}</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{metric.value}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{metric.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {scenarioMetrics.map((metric) => (
            <div key={metric} className="flex items-center gap-2 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
              <ShieldCheck size={14} />
              {metric}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">외부 SAST</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">분석기 연결 상태</h2>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
            <Wrench size={17} />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {analyzerStatuses.length === 0 && (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500">
              등록된 외부 분석기 상태가 없습니다.
            </div>
          )}
          {analyzerStatuses.map((status) => (
            <AnalyzerStatusRow key={status.name} status={status} />
          ))}
        </div>

        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-500">
          <FlaskConical size={14} className="mr-1 inline text-slate-400" />
          Semgrep, SonarQube, CodeQL은 같은 어댑터 구조로 결과를 합산할 수 있게 분리되어 있습니다.
        </div>
      </div>
    </section>
  );
}

function AnalyzerStatusRow({ status }: { status: AnalyzerStatus }) {
  const tone = !status.enabled
    ? "border-slate-200 bg-slate-50 text-slate-600"
    : status.available
      ? "border-emerald-100 bg-emerald-50 text-emerald-800"
      : "border-amber-100 bg-amber-50 text-amber-800";
  const state = !status.enabled ? "비활성" : status.available ? "연결됨" : "대기";

  return (
    <div className={`rounded-lg border px-4 py-3 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black">{status.name}</p>
        <span className="rounded-md bg-white/70 px-2 py-1 text-xs font-black">{state}</span>
      </div>
      <p className="mt-2 text-xs font-semibold leading-5">{status.message}</p>
      <p className="mt-2 text-xs font-black">이번 검사 탐지 {status.findingCount}개</p>
    </div>
  );
}
