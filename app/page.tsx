"use client";
import { useEffect, useMemo, useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import { db, auth, storage, emulatorMode, loadAnalytics } from "../src/lib/firebase-client";
import type { Prediction } from "../src/types/prediction";
import PredictionCard from "../src/components/PredictionCard/PredictionCard";
import Link from "next/link";
import { usePredictionFeed } from "../src/hooks/usePredictionFeed";
import Sidebar from "../src/components/Sidebar/Sidebar";
import NewPredictionModal from "../src/components/NewPredictionModal/NewPredictionModal";
import PredictionModal from "../src/components/PredictionModal/PredictionModal";
import { useSearchParams } from "next/navigation";
import { tokenizeQuery, matchesPrediction } from "../src/lib/search";

export default function HomePage() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<{ domain: string; subcategory: string; topic: string } | null>(null);
  const { items: predictions, loading: feedLoading, error: feedError, hasMore, loadMore, refresh } = usePredictionFeed({
    pageSize: 10,
    domain: selectedTaxonomy?.domain ?? null
  });
  const params = useSearchParams();
  const q = params.get("q") || "";
  const tokens = useMemo(() => tokenizeQuery(q), [q]);
  const filteredPredictions = useMemo(() => predictions.filter((p) => matchesPrediction(p as Prediction, tokens)), [predictions, tokens]);
  const [activeNav, setActiveNav] = useState<"feed" | "mine" | "voted" | "watchlist">("feed");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [openPrediction, setOpenPrediction] = useState<Prediction | null>(null);

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

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-6 grid gap-4 md:gap-6">

      

      {user && verified === false && (
        <section className="bg-statusPending/20 border border-statusPending rounded-lg p-4 text-sm text-neutral-800">
          Please verify your email to create predictions or write comments. Check your inbox for a verification email.
        </section>
      )}

      <div className="md:hidden">
        <button className="text-sm px-3 py-2 rounded-md border border-neutralBorder hover:bg-neutralBg" onClick={() => setSidebarOpen(true)}>Filters</button>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[80%] bg-white p-3" onClick={(e) => e.stopPropagation()}>
            <Sidebar
              activeNav={activeNav}
              onChangeNav={(id) => { setActiveNav(id); setSidebarOpen(false); }}
              selectedDomain={selectedTaxonomy?.domain ?? null}
              onSelectDomain={(d) => { setSelectedTaxonomy(d ? { domain: d, subcategory: "", topic: "" } : null); setSidebarOpen(false); }}
            />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-12 gap-4 md:gap-6 items-start">
        <div className="hidden md:block md:col-span-4 lg:col-span-3">
          <Sidebar
            activeNav={activeNav}
            onChangeNav={setActiveNav}
            selectedDomain={selectedTaxonomy?.domain ?? null}
            onSelectDomain={(d) => setSelectedTaxonomy(d ? { domain: d, subcategory: "", topic: "" } : null)}
          />
        </div>

        <div className="md:col-span-8 lg:col-span-9 grid gap-3">
          {user && verified && (
            <div className="flex items-center justify-end">
              <button className="text-sm px-3 py-2 rounded-md border border-neutralBorder hover:bg-neutralBg" onClick={() => setCreateOpen(true)}>
                New Prediction
              </button>
            </div>
          )}
          

          <section className="grid gap-3">
            <h2 className="font-medium">Recent predictions</h2>
            {feedError && (
              <div className="bg-[#FFF3F2] border border-[#F0C1BD] text-[#7A2E2A] rounded-lg p-3 text-sm">
                {feedError}
              </div>
            )}
            {feedLoading && predictions.length === 0 && (
              <div className="bg-white rounded-lg shadow-subtle p-4 text-sm text-neutral-500">Loading…</div>
            )}
            {!feedLoading && filteredPredictions.length === 0 && (
              <div className="bg-white rounded-lg shadow-subtle p-4 grid gap-2">
                <p className="text-sm text-neutral-600">No predictions yet{q ? ` for "${q}"` : ""}. Here’s a sample:</p>
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
            {filteredPredictions.length > 0 && (
              <div className="grid gap-3">
                {filteredPredictions.map((p) => (
                  <div key={p.id} onClick={() => setOpenPrediction(p as Prediction)} role="button" className="cursor-pointer">
                    <PredictionCard prediction={p} />
                  </div>
                ))}
                <div className="flex items-center justify-center py-2">
                  {hasMore && (
                    <button className="text-sm px-3 py-1 rounded-md border border-neutralBorder hover:bg-neutralBg" onClick={loadMore} disabled={feedLoading}>
                      {feedLoading ? "Loading…" : "Load more"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {createOpen && user && (
        <NewPredictionModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); refresh(); }}
          initialTaxonomy={selectedTaxonomy ?? undefined}
        />
      )}
      {openPrediction && (
        <PredictionModal prediction={openPrediction} onClose={() => setOpenPrediction(null)} />
      )}
    </main>
  );
}
