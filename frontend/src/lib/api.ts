import type { AnalysisResult, AnalyzeRequest } from "../types/analysis";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

export async function analyzeProject(payload: AnalyzeRequest): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const fallback = "분석 요청에 실패했습니다.";
    const error = await response.json().catch(() => ({ message: fallback }));
    throw new Error(error.message ?? fallback);
  }

  return response.json();
}
