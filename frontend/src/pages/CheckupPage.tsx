import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Dashboard } from "../components/Dashboard";
import { FileRiskTable } from "../components/FileRiskTable";
import { FindingList } from "../components/FindingList";
import { HistoryPanel } from "../components/HistoryPanel";
import { ProjectTree } from "../components/ProjectTree";
import { ReportActions } from "../components/ReportActions";
import { UploadPanel } from "../components/UploadPanel";
import { ValidationPanel } from "../components/ValidationPanel";
import { useCheckupStore } from "../store/useCheckupStore";
import type { AnalysisResult } from "../types/analysis";

export function CheckupPage() {
  const result = useCheckupStore((state) => state.result);
  const history = useCheckupStore((state) => state.history);
  const resultFiles = useCheckupStore((state) => state.resultFiles);
  const [selectedFile, setSelectedFile] = useState("ALL");
  const [spotlightResult, setSpotlightResult] = useState(false);
  const [pendingResultFocus, setPendingResultFocus] = useState(false);
  const resultSectionRef = useRef<HTMLElement>(null);
  const dashboardAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedFile("ALL");
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
          <Dashboard result={result} />
          <ValidationPanel result={result} />
          <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
            <FindingList findings={result.findings} sourceFiles={resultFiles} selectedFile={selectedFile} onFileSelect={setSelectedFile} />
            <div className="grid content-start gap-5">
              <FileRiskTable files={result.fileSummaries} selectedFile={selectedFile} onFileSelect={setSelectedFile} />
              <ProjectTree tree={result.tree} />
            </div>
          </div>
          <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
            <ReportActions result={result} />
            <HistoryPanel history={history} />
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
  const penalty = Math.min(result.severityCount.high * 12 + result.severityCount.medium * 6 + result.severityCount.low * 2, 100);

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
