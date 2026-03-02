import type { Prediction } from "../types/prediction";

export function tokenizeQuery(q: string): string[] {
  return (q || "")
    .toLowerCase()
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function matchesPrediction(p: Prediction, tokens: string[]): boolean {
  if (!tokens || tokens.length === 0) return true;
  const summary = (p.summary || "").toLowerCase();
  const rationale = (p.rationale || "").toLowerCase();
  const legacyMetric = (p.metric || "").toLowerCase();
  const multiMetrics = Array.isArray(p.metrics)
    ? p.metrics
        .map((m) => `${m.metric ?? ""} ${m.operator ?? ""} ${m.target ?? ""}`)
        .join(" ")
        .toLowerCase()
    : "";
  const metricsStr = [legacyMetric, multiMetrics].filter(Boolean).join(" ");
  return tokens.every((t) => summary.includes(t) || rationale.includes(t) || metricsStr.includes(t));
}
