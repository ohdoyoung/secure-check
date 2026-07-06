import { useMemo } from "react";
import { Clock3, TrendingDown, TrendingUp } from "lucide-react";
import { formatDateTime } from "../lib/report";
import type { AnalysisResult } from "../types/analysis";

export function HistoryPanel({ history }: { history: AnalysisResult[] }) {
  const latest = history[0];
  const projectHistory = useMemo(
    () => latest ? history.filter((item) => item.projectName === latest.projectName) : [],
    [history, latest]
  );
  const previousSameProject = projectHistory[1];
  const projectScoreDiff = latest && previousSameProject ? latest.score - previousSameProject.score : 0;
  const projectFindingDiff = latest && previousSameProject
    ? latest.severityCount.total - previousSameProject.severityCount.total
    : 0;
  const averageScore = projectHistory.length > 0
    ? Math.round(projectHistory.reduce((sum, item) => sum + item.score, 0) / projectHistory.length)
    : 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">최근 검사 기록</p>
          <h2 className="mt-1 text-lg font-black text-slate-950">점수 변화</h2>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
          <Clock3 size={17} />
        </div>
      </div>

      {latest && (
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase text-slate-400">프로젝트 추세</p>
          <p className="mt-1 truncate text-sm font-black text-slate-950">{latest.projectName}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <TrendMetric label="기록" value={`${projectHistory.length}회`} />
            <TrendMetric label="평균" value={`${averageScore}점`} />
            <TrendMetric label="변화" value={previousSameProject ? `${projectScoreDiff >= 0 ? "+" : ""}${projectScoreDiff}점` : "신규"} />
          </div>
          {previousSameProject && (
            <p className={`mt-3 text-xs font-black ${projectFindingDiff <= 0 ? "text-emerald-700" : "text-red-700"}`}>
              취약점 {projectFindingDiff <= 0 ? "" : "+"}{projectFindingDiff}개 변화
            </p>
          )}
        </div>
      )}

      <div className="mt-5 space-y-3">
        {history.length === 0 && <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500">검사 기록이 아직 없습니다.</p>}
        {history.map((item, index) => {
          const previous = history[index + 1];
          const diff = previous ? item.score - previous.score : 0;
          const DiffIcon = diff >= 0 ? TrendingUp : TrendingDown;
          return (
            <div key={item.analyzedAt} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">{item.projectName}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{formatDateTime(item.analyzedAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-black text-slate-950">{item.score}점</span>
                {previous && (
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-black ${diff >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    <DiffIcon size={13} />
                    {diff > 0 ? `+${diff}` : diff}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TrendMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}
