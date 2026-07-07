import { Moon, ShieldCheck, Sun } from "lucide-react";
import type { ThemeMode } from "../App";

type AppHeaderProps = {
  theme: ThemeMode;
  onThemeToggle: () => void;
};

export function AppHeader({ theme, onThemeToggle }: AppHeaderProps) {
  const nextThemeLabel = theme === "dark" ? "라이트 모드" : "다크 모드";
  const ThemeIcon = theme === "dark" ? Sun : Moon;

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-sm font-black text-slate-950">취약했네</p>
            <p className="text-xs font-semibold text-slate-500">Secure Coding Checkup</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 text-xs font-bold text-slate-500 sm:flex">
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1">KISA Mapped</span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1">166 Active Rules</span>
          </div>
          <button
            type="button"
            onClick={onThemeToggle}
            aria-label={`${nextThemeLabel}로 변경`}
            aria-pressed={theme === "dark"}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50"
          >
            <ThemeIcon size={15} />
            <span>{nextThemeLabel}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
