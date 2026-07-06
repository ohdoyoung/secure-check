import { useState } from "react";
import { Braces, Download, Eye, FileJson, FileText, Printer, X } from "lucide-react";
import { downloadHtmlReport, downloadJsonReport, downloadSarifReport, formatDateTime, printHtmlReport } from "../lib/report";
import type { AnalysisResult } from "../types/analysis";

export function ReportActions({ result }: { result: AnalysisResult }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const sarifReady = Boolean(result.sarifReport?.trim());

  return (
    <>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
              <FileText size={19} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">HTML 리포트</p>
              <h2 className="mt-1 text-lg font-black text-slate-950">취약했네 보안 진단서</h2>
              <p className="mt-2 text-sm text-slate-500">
                검사일 {formatDateTime(result.analyzedAt)} · 총 {result.severityCount.total}개 항목 · 전체 finding 상세 포함
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-600">
                  점수 {result.score}점
                </span>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-600">
                  TOP 파일 {result.topRiskFiles.length}개
                </span>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-600">
                  SARIF {sarifReady ? "지원" : "대기"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 md:w-[420px]">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              <Eye size={17} />
              미리보기
            </button>
            <button
              type="button"
              onClick={() => printHtmlReport(result)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              <Printer size={17} />
              PDF 출력
            </button>
            <button
              type="button"
              onClick={() => downloadJsonReport(result)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              <Braces size={17} />
              JSON 저장
            </button>
            <button
              type="button"
              onClick={() => downloadSarifReport(result)}
              disabled={!sarifReady}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <FileJson size={17} />
              SARIF 저장
            </button>
            <button
              type="button"
              onClick={() => downloadHtmlReport(result)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-black text-white transition hover:bg-slate-800 sm:col-span-2"
            >
              <Download size={17} />
              HTML 저장
            </button>
          </div>
        </div>
      </section>

      {previewOpen && (
        <div className="fixed inset-0 z-50 grid bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
              <div>
                <p className="text-sm font-black text-slate-950">진단서 미리보기</p>
                <p className="text-xs font-semibold text-slate-500">{result.projectName} · {formatDateTime(result.analyzedAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                aria-label="진단서 미리보기 닫기"
              >
                <X size={17} />
              </button>
            </div>
            <iframe title="취약했네 보안 진단서 미리보기" srcDoc={result.htmlReport} className="min-h-0 flex-1 bg-slate-50" />
          </div>
        </div>
      )}
    </>
  );
}
