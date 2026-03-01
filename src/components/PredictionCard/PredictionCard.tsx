import styles from "./PredictionCard.module.scss";
import AIBadge from "../AIBadge/AIBadge";
import TaxonomyChip from "../TaxonomyChip/TaxonomyChip";
import VoteButton from "../VoteButton/VoteButton";
import { daysUntil, daysSince } from "../../lib/date-utils";
import type { Prediction } from "../../types/prediction";
import { useEffect, useState } from "react";
import { doc, getDoc, getFirestore } from "firebase/firestore";

export interface PredictionCardProps {
  prediction: Prediction;
}

function statusColor(status: Prediction["status"]): string {
  if (status === "pending") return "bg-statusPending";
  if (status === "resolved") return "bg-statusResolved";
  return "bg-statusDisputed";
}

export default function PredictionCard({ prediction }: PredictionCardProps) {
  const dUntil = daysUntil(prediction.timebox);
  const dSince = daysSince(prediction.createdAt);
  const statusCls = statusColor(prediction.status);
  const [authorName, setAuthorName] = useState<string | null>(null);
  const [authorPhoto, setAuthorPhoto] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        if (!prediction.authorId) return;
        const db = getFirestore();
        const snap = await getDoc(doc(db, "users", prediction.authorId));
        if (!active) return;
        if (snap.exists()) {
          const d = snap.data() as any;
          setAuthorName(d.displayName ?? null);
          setAuthorPhoto(d.photoURL ?? null);
        }
      } catch {}
    }
    run();
    return () => { active = false; };
  }, [prediction.authorId]);

  return (
    <article className={`${styles.card} bg-white rounded-lg shadow-subtle p-4 grid gap-3`}>
      <header className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <h3 className="text-base font-semibold">{prediction.summary}</h3>
          <p className="text-sm text-neutral-600">{prediction.metric} • Ref: {prediction.referenceValue}</p>
          <div className="flex items-center gap-2 mt-1">
            {authorPhoto ? (
              <img src={authorPhoto} alt={authorName ?? ""} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-neutral-300 text-neutral-700 grid place-items-center text-xs">
                {(authorName?.trim()?.[0] ?? "?").toUpperCase()}
              </div>
            )}
            <span className="text-sm text-neutral-700">{authorName || "Unknown"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AIBadge score={prediction.aiScore?.plausibility ?? 5} />
          <span className={`px-2 py-1 rounded-full text-xs text-white ${statusCls}`}>{prediction.status}</span>
        </div>
      </header>

      <div className="flex items-center gap-2 flex-wrap">
        {prediction.taxonomy?.domain && <TaxonomyChip label={prediction.taxonomy.domain} />}
        {prediction.taxonomy?.subcategory && <TaxonomyChip label={prediction.taxonomy.subcategory} />}
        {prediction.taxonomy?.topic && <TaxonomyChip label={prediction.taxonomy.topic} />}
      </div>

      <div className="flex items-center justify-between text-sm text-neutral-700">
        <span>Created {dSince}d ago</span>
        <span>{dUntil >= 0 ? `Closes in ${dUntil}d` : `Closed ${Math.abs(dUntil)}d ago`}</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <VoteButton variant="calledIt" label={`Called It (${prediction.humanVotes?.outcome?.calledIt ?? 0})`} />
        <VoteButton variant="botched" label={`Botched (${prediction.humanVotes?.outcome?.botched ?? 0})`} />
        <VoteButton variant="fence" label={`Fence (${prediction.humanVotes?.outcome?.fence ?? 0})`} />
      </div>
    </article>
  );
}
