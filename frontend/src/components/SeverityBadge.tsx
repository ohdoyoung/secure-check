import type { Severity } from "../types/analysis";

const styles: Record<Severity, string> = {
  HIGH: "bg-red-50 text-red-700 ring-red-100",
  MEDIUM: "bg-amber-50 text-amber-700 ring-amber-100",
  LOW: "bg-blue-50 text-blue-700 ring-blue-100"
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`inline-flex h-7 items-center rounded-md px-2.5 text-xs font-semibold ring-1 ${styles[severity]}`}>
      {severity}
    </span>
  );
}
