"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import styles from "./NewPredictionModal.module.scss";
import { getAuth } from "firebase/auth";
import CategorySelect from "../CategorySelect/CategorySelect";
import { createPrediction } from "../../services/prediction-service";
import { aiAnalyze, type AIAnalysis } from "../../lib/ai";

type Taxonomy = { domain: string; subcategory: string; topic: string };

type Props = {
  onClose: () => void;
  onCreated: (id?: string) => void;
  initialTaxonomy?: Taxonomy;
};

const OPS = [">", ">=", "<", "<=", "="] as const;

export default function NewPredictionModal({ onClose, onCreated, initialTaxonomy }: Props) {
  const auth = getAuth();
  const user = auth.currentUser;
  const emailVerified = !!user?.emailVerified;

  const [summary, setSummary] = useState("");
  const [metrics, setMetrics] = useState<Array<{ metric: string; operator: typeof OPS[number] | ""; target: string }>>([
    { metric: "", operator: "", target: "" }
  ]);
  const [rationale, setRationale] = useState("");
  const [timebox, setTimebox] = useState("");
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(initialTaxonomy ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [lastSig, setLastSig] = useState<string | null>(null);
  const metricInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const valid = useMemo(() => {
    if (!summary.trim() || summary.length > 140) return false;
    if (!timebox) return false;
    if (!taxonomy?.domain) return false;
    const d = new Date(timebox);
    if (isNaN(d.getTime())) return false;
    const rows = metrics.filter((m) => m.metric.trim() && m.operator && m.target.trim());
    if (rows.length < 1) return false;
    return true;
  }, [summary, timebox, taxonomy, metrics]);

  const sig = useMemo(() => JSON.stringify({ s: summary.trim(), m: metrics.map(m => ({ metric: m.metric.trim(), operator: m.operator, target: m.target.trim() })), tb: timebox }), [summary, metrics, timebox]);
  const needsPropose = useMemo(() => !lastSig || lastSig !== sig, [lastSig, sig]);

  const publish = useCallback(async () => {
    if (!user) { setError("Please sign in"); return; }
    if (!emailVerified) { setError("Please verify your email before publishing"); return; }
    if (!valid) { setError("Please fill all required fields"); return; }
    if (needsPropose) { setError("Please Propose to run AI analysis before submitting"); return; }
    setSaving(true);
    setError(null);
    try {
      const first = metrics[0];
      const id = await createPrediction({
        authorId: user.uid,
        summary: summary.trim(),
        metric: (first?.metric ?? "").trim(),
        operator: (first?.operator ?? "=") as any,
        target: (first?.target ?? "").trim(),
        referenceValue: "",
        timeboxISO: timebox,
        taxonomy: taxonomy as Taxonomy,
        aiScore: undefined,
        metrics: metrics.map(m => ({ metric: m.metric.trim(), operator: m.operator as any, target: m.target.trim() })),
        rationale: rationale.trim() || undefined,
        aiAnalysis: analysis || undefined
      });
      onCreated(id);
    } catch (e: any) {
      setError(e?.message || "Failed to publish");
    } finally {
      setSaving(false);
    }
  }, [user, emailVerified, valid, needsPropose, summary, metrics, rationale, timebox, taxonomy, onCreated]);

  const propose = useCallback(async () => {
    if (!user) { setError("Please sign in"); return; }
    if (!valid) { setError("Please fill all required fields"); return; }
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const out = await aiAnalyze({
        summary: summary.trim(),
        metrics: metrics.map(m => ({ metric: m.metric.trim(), operator: m.operator as any, target: m.target.trim() })),
        rationale: rationale.trim() || undefined,
        timeboxISO: timebox || undefined,
        taxonomy: taxonomy || undefined
      });
      setAnalysis(out);
      setLastSig(sig);
    } catch (e: any) {
      setAnalysisError(e?.message || "AI analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }, [user, valid, summary, metrics, rationale, timebox, taxonomy, sig]);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.close} onClick={onClose} aria-label="Close">✕</button>
        <h2 className={styles.title}>New Prediction</h2>
        <p className={styles.subtitle}>State a falsifiable claim with measurable criteria.</p>

        <div className={styles.group}>
          <label className={styles.label}>Summary</label>
          <input className={styles.input} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="e.g. US GDP will exceed $30T by 2028" maxLength={140} />
          <div className={styles.hint}>{summary.length}/140</div>
        </div>

        {metrics.map((row, idx) => (
          <div key={idx} className={styles.row3}>
            <div className={styles.group}>
              <label className={styles.label}>Metric {metrics.length > 1 ? `#${idx + 1}` : ""}</label>
              <input
                className={styles.input}
                ref={(el) => { metricInputRefs.current[idx] = el; }}
                value={row.metric}
                onChange={(e) => {
                  const v = e.target.value; setMetrics(ms => ms.map((m, i) => i === idx ? { ...m, metric: v } : m));
                }}
                placeholder="e.g. US GDP"
              />
            </div>
            <div className={styles.group}>
              <label className={styles.label}>Op</label>
              <select className={styles.input} value={row.operator} onChange={(e) => {
                const v = e.target.value as any; setMetrics(ms => ms.map((m, i) => i === idx ? { ...m, operator: v } : m));
              }}>
                <option value="">Select</option>
                {OPS.map((op) => <option key={op} value={op}>{op}</option>)}
              </select>
            </div>
            <div className={styles.group}>
              <label className={styles.label}>Target</label>
              <input className={styles.input} value={row.target} onChange={(e) => {
                const v = e.target.value; setMetrics(ms => ms.map((m, i) => i === idx ? { ...m, target: v } : m));
              }} placeholder="e.g. $30T" />
            </div>
          </div>
        ))}

        <div className="flex gap-2 mt-2">
          {metrics.length > 1 && (
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setMetrics(ms => (ms.length > 1 ? ms.slice(0, ms.length - 1) : ms))}
            >
              Remove
            </button>
          )}
          {metrics.length <= 2 && (
            <button
              type="button"
              className={styles.secondary}
              onClick={() => {
                setMetrics(ms => {
                  if (ms.length >= 3) return ms;
                  const newRow: { metric: string; operator: typeof OPS[number] | ""; target: string } = { metric: "", operator: "" as typeof OPS[number] | "", target: "" };
                  const next = [...ms, newRow];
                  // after DOM updates, focus the newly added metric input and scroll into view
                  setTimeout(() => {
                    const i = next.length - 1;
                    const el = metricInputRefs.current[i];
                    if (el) {
                      try { el.focus(); el.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch {}
                    }
                  }, 0);
                  return next;
                });
              }}
            >
              Add
            </button>
          )}
        </div>

        <div className={styles.row2}>
          <div className={styles.group}>
            <label className={styles.label}>Rationale</label>
            <input className={styles.input} value={rationale} onChange={(e) => setRationale(e.target.value)} placeholder="Why these metrics? Context, definitions…" />
          </div>
          <div className={styles.group}>
            <label className={styles.label}>Timebox</label>
            <input className={styles.input} type="date" value={timebox} onChange={(e) => setTimebox(e.target.value)} />
          </div>
        </div>

        <div className={styles.group}>
          <label className={styles.label}>Taxonomy</label>
          <CategorySelect value={taxonomy} onChange={setTaxonomy as any} />
        </div>

        <div className={styles.group}>
          <label className={styles.label}>AI analysis</label>
          <div className="flex items-center gap-3">
            <span className="text-sm">Boldness: <strong>{analysis?.boldness ?? "-"}</strong></span>
            <span className="text-sm">Relevance: <strong>{analysis?.relevance ?? "-"}</strong></span>
            {analyzing && <span className="text-sm text-neutral-600">Analyzing…</span>}
            {needsPropose && <span className="text-xs px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800">Changes detected — Propose again</span>}
          </div>
          {analysisError && <div className={styles.error}>{analysisError}</div>}
          {analysis?.notes?.length ? (
            <ul className="list-disc pl-5 text-sm text-neutral-700">
              {analysis.notes!.map((n, i) => (<li key={i}>{n}</li>))}
            </ul>
          ) : null}
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {!emailVerified && user && (
          <div className={styles.warn}>Please verify your email before publishing.</div>
        )}

        <div className={styles.actions}>
          <button className={styles.secondary} onClick={onClose} disabled={saving || analyzing}>Cancel</button>
          {needsPropose ? (
            <button className={styles.primary} onClick={propose} disabled={!valid || analyzing}>{analyzing ? "Analyzing…" : "Propose"}</button>
          ) : (
            <button className={styles.primary} onClick={publish} disabled={!valid || !emailVerified || saving}>{saving ? "Submitting…" : "Submit"}</button>
          )}
        </div>
      </div>
    </div>
  );
}
