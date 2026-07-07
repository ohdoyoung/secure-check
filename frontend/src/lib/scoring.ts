import type { AnalysisResult, ScoreBreakdown, SeverityCount } from "../types/analysis";

const HIGH_MAX_PENALTY = 82;
const MEDIUM_MAX_PENALTY = 13;
const LOW_MAX_PENALTY = 5;
const HIGH_CURVE = 12;
const MEDIUM_CURVE = 18;
const LOW_CURVE = 30;

export function getScoreBreakdown(result: AnalysisResult): ScoreBreakdown {
  return result.scoreBreakdown ?? calculateScoreBreakdown(result.severityCount);
}

export function calculateScoreBreakdown(count: SeverityCount): ScoreBreakdown {
  const highPenalty = severityPenalty(count.high, HIGH_MAX_PENALTY, HIGH_CURVE);
  const mediumPenalty = severityPenalty(count.medium, MEDIUM_MAX_PENALTY, MEDIUM_CURVE);
  const lowPenalty = severityPenalty(count.low, LOW_MAX_PENALTY, LOW_CURVE);
  const totalPenalty = Math.min(100, highPenalty + mediumPenalty + lowPenalty);

  return {
    highPenalty,
    mediumPenalty,
    lowPenalty,
    totalPenalty
  };
}

function severityPenalty(count: number, maxPenalty: number, curve: number) {
  if (count <= 0) return 0;

  const penalty = Math.round(maxPenalty * (1 - Math.exp(-count / curve)));
  return Math.min(maxPenalty, Math.max(1, penalty));
}
