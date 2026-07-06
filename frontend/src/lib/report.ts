import type { AnalysisResult } from "../types/analysis";

export function downloadHtmlReport(result: AnalysisResult) {
  downloadTextFile(result.htmlReport, "text/html;charset=utf-8", `${fileBaseName(result)}-security-report.html`);
}

export function downloadJsonReport(result: AnalysisResult) {
  const { htmlReport, sarifReport, ...analysis } = result;
  const payload = {
    schemaVersion: "chwiyakhaenne.analysis.v1",
    exportedAt: new Date().toISOString(),
    analysis
  };
  downloadTextFile(JSON.stringify(payload, null, 2), "application/json;charset=utf-8", `${fileBaseName(result)}-analysis.json`);
}

export function downloadSarifReport(result: AnalysisResult) {
  const sarif = result.sarifReport?.trim();
  if (!sarif) {
    return false;
  }
  downloadTextFile(sarif, "application/sarif+json;charset=utf-8", `${fileBaseName(result)}.sarif`);
  return true;
}

function downloadTextFile(content: string, type: string, filename: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function printHtmlReport(result: AnalysisResult) {
  const reportWindow = window.open("", "_blank", "noopener,noreferrer,width=1100,height=800");
  if (!reportWindow) {
    return false;
  }

  reportWindow.document.open();
  reportWindow.document.write(result.htmlReport);
  reportWindow.document.close();
  reportWindow.focus();
  window.setTimeout(() => reportWindow.print(), 350);
  return true;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function fileBaseName(result: AnalysisResult) {
  return (result.projectName || "chwiyakhaenne")
    .trim()
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "chwiyakhaenne";
}
