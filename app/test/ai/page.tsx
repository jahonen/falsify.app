"use client";
import { useState } from "react";
import { aiScore } from "../../../src/lib/ai";

export default function AiSelfTestPage() {
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setErr(null);
    setOut(null);
    try {
      const res = await aiScore({
        summary: "US GDP will exceed $30T by end of 2028",
        metric: "US GDP",
        operator: ">",
        target: "$30T",
        referenceValue: "$27.4T (2024)",
        timeboxISO: "2028-12-31",
        taxonomy: { domain: "Economy", subcategory: "Macroeconomics", topic: "GDP" }
      });
      setOut(res);
    } catch (e: any) {
      setErr(e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6 grid gap-4">
      <h1 className="text-xl font-semibold">AI Score Self-Test</h1>
      <p className="text-sm text-neutral-700">You must be signed in. Click the button to call the aiScore Cloud Function with a sample payload.</p>
      <div>
        <button className="text-sm px-3 py-2 rounded-md border" onClick={run} disabled={loading}>{loading ? "Running…" : "Run test"}</button>
      </div>
      {err && (
        <pre className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3 overflow-auto">{err}</pre>
      )}
      {out && (
        <pre className="text-sm bg-neutral-50 border border-neutral-200 rounded p-3 overflow-auto">{JSON.stringify(out, null, 2)}</pre>
      )}
    </main>
  );
}
