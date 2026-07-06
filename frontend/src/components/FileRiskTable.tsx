import { FileCode2, ListFilter, RotateCcw } from "lucide-react";
import type { FileRiskSummary, SeverityCount } from "../types/analysis";

type FileRiskTableProps = {
  files: FileRiskSummary[];
  selectedFile: string;
  onFileSelect: (file: string) => void;
};

export function FileRiskTable({ files, selectedFile, onFileSelect }: FileRiskTableProps) {
  const visible = files
    .filter((file) => file.vulnerabilityCount > 0)
    .sort((a, b) => b.riskScore - a.riskScore || b.vulnerabilityCount - a.vulnerabilityCount || a.path.localeCompare(b.path))
    .slice(0, 8);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">파일별 취약점 개수</p>
          <h2 className="mt-1 text-lg font-black text-slate-950">취약 파일 드릴다운</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">위험 점수와 심각도 기준으로 정렬됩니다.</p>
        </div>
        <button
          type="button"
          onClick={() => onFileSelect("ALL")}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-600 transition hover:bg-white"
        >
          <RotateCcw size={13} />
          전체
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {visible.length === 0 && (
          <div className="rounded-md border border-green-100 bg-green-50 px-4 py-5 text-sm font-semibold text-green-700">
            취약 파일이 없습니다. 꽤 건강한 상태예요.
          </div>
        )}
        {visible.map((file, index) => {
          const active = selectedFile === file.path;
          return (
            <button
              key={file.path}
              type="button"
              onClick={() => onFileSelect(file.path)}
              className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                active
                  ? "border-slate-950 bg-slate-950 text-white shadow-panel"
                  : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${active ? "border-white/10 bg-white/10 text-white" : "border-slate-200 bg-white text-slate-600"}`}>
                    <FileCode2 size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex h-6 items-center rounded-md px-2 text-[11px] font-black ${active ? "bg-white text-slate-950" : "bg-slate-950 text-white"}`}>
                        #{index + 1}
                      </span>
                      <p className="truncate text-sm font-black">{file.path}</p>
                    </div>
                    <p className={`mt-1 text-xs font-semibold ${active ? "text-slate-300" : "text-slate-500"}`}>
                      위험 점수 {file.riskScore} · 총 {file.vulnerabilityCount}개
                    </p>
                  </div>
                </div>
                <SeverityMiniStats severityCount={file.severityCount} active={active} />
              </div>
              <div className={`mt-3 flex items-center gap-1.5 text-xs font-black ${active ? "text-slate-200" : "text-slate-500"}`}>
                <ListFilter size={13} />
                {active ? "현재 이 파일만 보는 중" : "이 파일 결과만 보기"}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SeverityMiniStats({ severityCount, active }: { severityCount: SeverityCount; active: boolean }) {
  const base = active ? "border-white/10 bg-white/10 text-white" : "border-slate-200 bg-white text-slate-700";
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className={`inline-flex h-7 items-center rounded-md border px-2 text-[11px] font-black ${base}`}>
        H {severityCount.high}
      </span>
      <span className={`inline-flex h-7 items-center rounded-md border px-2 text-[11px] font-black ${base}`}>
        M {severityCount.medium}
      </span>
      <span className={`inline-flex h-7 items-center rounded-md border px-2 text-[11px] font-black ${base}`}>
        L {severityCount.low}
      </span>
    </div>
  );
}
