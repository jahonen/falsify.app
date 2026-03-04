"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Prediction } from "../../../src/types/prediction";
import { getPredictionById } from "../../../src/services/prediction-service";
import PredictionModal from "../../../src/components/PredictionModal/PredictionModal";

export default function PredictionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const p = await getPredictionById(params.id);
        if (!active) return;
        setPrediction(p);
      } catch {
        setPrediction(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [params.id]);

  if (loading) {
    return <main className="mx-auto max-w-3xl p-4"><div className="bg-white rounded-lg shadow-subtle p-4 text-sm text-neutral-500">Loading…</div></main>;
  }
  if (!prediction) {
    return <main className="mx-auto max-w-3xl p-4"><div className="bg-[#FFF3F2] border border-[#F0C1BD] text-[#7A2E2A] rounded-lg p-4 text-sm">Prediction not found.</div></main>;
  }

  return (
    <PredictionModal prediction={prediction} onClose={() => router.push("/")} />
  );
}
