import { Activity, HeartPulse } from "lucide-react";

type ScoreGaugeProps = {
  score: number;
  verdict: string;
};

export function ScoreGauge({ score, verdict }: ScoreGaugeProps) {
  const color = score >= 90 ? "#18a058" : score >= 70 ? "#2563eb" : score >= 40 ? "#d97706" : "#dc2626";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">프로젝트 건강도</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">{verdict}</h2>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
          <HeartPulse size={18} />
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-end gap-1">
          <span className="text-5xl font-black leading-none text-slate-950">{score}</span>
          <span className="pb-1 text-sm font-bold text-slate-500">점</span>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
        <Activity size={16} className="shrink-0 text-slate-500" />
        HIGH는 12점, MEDIUM은 6점, LOW는 2점씩 감점됩니다.
      </div>
    </section>
  );
}
