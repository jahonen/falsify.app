"use client";
import { useEffect, useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import { db, auth, storage, emulatorMode, loadAnalytics } from "../src/lib/firebase-client";
import { collection, getDocs, orderBy, limit, query } from "firebase/firestore";
import type { Prediction } from "../src/types/prediction";
import PredictionCard from "../src/components/PredictionCard/PredictionCard";
import CategorySelect from "../src/components/CategorySelect/CategorySelect";
import Link from "next/link";

export default function HomePage() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Prediction[] | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<{ domain: string; subcategory: string; topic: string } | null>(null);

  useEffect(() => {
    const a = getAuth();
    const unsub = a.onAuthStateChanged((u) => {
      setUser(u ? u.uid : null);
      setVerified(u ? !!u.emailVerified : null);
    });
    setReady(true);
    loadAnalytics();
    return () => unsub();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, "predictions"), orderBy("createdAt", "desc"), limit(10));
        const snap = await getDocs(q);
        const items: Prediction[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            authorId: data.authorId ?? "",
            summary: data.summary ?? "",
            metric: data.metric ?? "",
            referenceValue: data.referenceValue ?? "",
            timebox: data.timebox ?? new Date().toISOString(),
            taxonomy: data.taxonomy ?? { domain: "", subcategory: "", topic: "" },
            status: data.status ?? "pending",
            aiScore: data.aiScore ?? { plausibility: 5, vaguenessFlag: false, notes: [] },
            humanVotes: data.humanVotes ?? { outcome: { calledIt: 0, botched: 0, fence: 0 }, quality: { high: 0, low: 0 } },
            comments: data.comments ?? [],
            createdAt: (data.createdAt?.toDate?.() ?? new Date()) as Date,
            resolvedAt: data.resolvedAt ? (data.resolvedAt.toDate?.() ?? undefined) : undefined
          } as Prediction;
        });
        setPredictions(items);
      } catch {
        setPredictions([]);
      }
    }
    load();
  }, []);

  return (
    <main className="mx-auto max-w-3xl p-6 grid gap-6">

      <section className="bg-white rounded-lg shadow-subtle p-4 grid gap-2">
        <h2 className="font-medium">Local Setup</h2>
        <ul className="list-disc ml-6 text-sm">
          <li>Auth: {auth ? "ready" : "not ready"}</li>
          <li>Firestore: {db ? "ready" : "not ready"}</li>
          <li>Storage: {storage ? "ready" : "not ready"}</li>
          <li>User: {ready ? (user ?? "anonymous") : "…"}</li>
        </ul>
      </section>

      {user && verified === false && (
        <section className="bg-statusPending/20 border border-statusPending rounded-lg p-4 text-sm text-neutral-800">
          Please verify your email to create predictions or write comments. Check your inbox for a verification email.
        </section>
      )}

      <section className="bg-white rounded-lg shadow-subtle p-4 grid gap-3">
        <h2 className="font-medium">Category search</h2>
        <CategorySelect value={selectedTaxonomy} onChange={setSelectedTaxonomy} />
        {selectedTaxonomy && (
          <div className="text-sm text-neutral-700">
            Selected: {selectedTaxonomy.domain} › {selectedTaxonomy.subcategory} › {selectedTaxonomy.topic}
          </div>
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="font-medium">Recent predictions</h2>
        {predictions === null && (
          <div className="bg-white rounded-lg shadow-subtle p-4 text-sm text-neutral-500">Loading…</div>
        )}
        {predictions && predictions.length === 0 && (
          <div className="bg-white rounded-lg shadow-subtle p-4 grid gap-2">
            <p className="text-sm text-neutral-600">No predictions yet. Here’s a sample:</p>
            <PredictionCard
              prediction={{
                id: "sample-1",
                authorId: "demo",
                summary: "US GDP will exceed $30T by end of 2028",
                metric: "US GDP > $30T",
                referenceValue: "$25T (2023)",
                timebox: new Date(new Date().getFullYear() + 2, 11, 31).toISOString(),
                taxonomy: { domain: "Economy", subcategory: "Macroeconomics", topic: "GDP" },
                status: "pending",
                aiScore: { plausibility: 7, vaguenessFlag: false, notes: [] },
                humanVotes: { outcome: { calledIt: 12, botched: 3, fence: 5 }, quality: { high: 9, low: 1 } },
                comments: [],
                createdAt: new Date()
              }}
            />
          </div>
        )}
        {predictions && predictions.length > 0 && (
          <div className="grid gap-3">
            {predictions.map((p) => (
              <PredictionCard key={p.id} prediction={p} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
