import { useMutation } from "@tanstack/react-query";
import { analyzeProject } from "../lib/api";
import { useCheckupStore } from "../store/useCheckupStore";
import type { AnalyzeRequest } from "../types/analysis";

export function useAnalysisMutation() {
  const setResult = useCheckupStore((state) => state.setResult);

  return useMutation({
    mutationFn: (payload: AnalyzeRequest) => analyzeProject(payload),
    onSuccess: (result) => setResult(result)
  });
}
