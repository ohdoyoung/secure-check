import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  tone: "red" | "amber" | "blue" | "green" | "slate";
  icon: LucideIcon;
};

const toneStyles = {
  red: "bg-red-50 text-red-700",
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-blue-50 text-blue-700",
  green: "bg-green-50 text-green-700",
  slate: "bg-slate-100 text-slate-700"
};

export function StatCard({ label, value, tone, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-md ${toneStyles[tone]}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-4 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}
