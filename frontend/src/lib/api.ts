import type { AnalysisResult, AnalyzeRequest } from "../types/analysis";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";
const API_CONFIGURATION_ERROR =
  "배포 환경변수 VITE_API_BASE_URL이 비어 있습니다. Vercel 프로젝트 설정에 Render 백엔드 주소를 넣고 다시 배포하세요.";

export async function analyzeProject(payload: AnalyzeRequest): Promise<AnalysisResult> {
  if (import.meta.env.PROD && !API_BASE_URL) {
    throw new Error(API_CONFIGURATION_ERROR);
  }

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
