import { ShieldCheck } from "lucide-react";

export function AppHeader() {
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
        <div className="hidden items-center gap-2 text-xs font-bold text-slate-500 sm:flex">
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1">KISA Mapped</span>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1">166 Active Rules</span>
        </div>
      </div>
    </header>
  );
}
