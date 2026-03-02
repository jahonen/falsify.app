import styles from "./PredictionCard.module.scss";
import AIBadge from "../AIBadge/AIBadge";
import TaxonomyChip from "../TaxonomyChip/TaxonomyChip";
import VoteButton from "../VoteButton/VoteButton";
import type { Prediction } from "../../types/prediction";
import { useEffect, useState } from "react";
import { castVote } from "../../services/vote-service";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import RelativeDaysText from "../RelativeDaysText/RelativeDaysText";
import UserProfileModal from "../UserProfileModal/UserProfileModal";
import { toast } from "react-hot-toast";

export interface PredictionCardProps {
  prediction: Prediction;
}

function statusColor(status: Prediction["status"]): string {
  if (status === "pending") return "bg-statusPending";
  if (status === "resolved") return "bg-statusResolved";
  return "bg-statusDisputed";
}

export default function PredictionCard({ prediction }: PredictionCardProps) {
  const statusCls = statusColor(prediction.status);
  const [authorName, setAuthorName] = useState<string | null>(null);
  const [authorPhoto, setAuthorPhoto] = useState<string | null>(null);
  const [voteCounts, setVoteCounts] = useState({
    calledIt: prediction.humanVotes?.outcome?.calledIt ?? 0,
    botched: prediction.humanVotes?.outcome?.botched ?? 0,
    fence: prediction.humanVotes?.outcome?.fence ?? 0,
  });
  const [voting, setVoting] = useState<null | "calledIt" | "botched" | "fence">(null);
  const [profileOpen, setProfileOpen] = useState(false);

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
          {Array.isArray(prediction.metrics) && prediction.metrics.length > 0 ? (
            <p className="text-sm text-neutral-600">
              {prediction.metrics.map((m, i) => (
                <span key={i}>
                  {m.metric} {m.operator} {m.target}{i < prediction.metrics!.length - 1 ? " • " : ""}
                </span>
              ))}
            </p>
          ) : (
            <p className="text-sm text-neutral-600">{prediction.metric} • Ref: {prediction.referenceValue}</p>
          )}
          {prediction.rationale ? (
            <p className="text-sm text-neutral-600">{prediction.rationale}</p>
          ) : null}
          <button type="button" className="flex items-center gap-2 mt-1 group" onClick={() => setProfileOpen(true)}>
            {authorPhoto ? (
              <img src={authorPhoto} alt={authorName ?? ""} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-neutral-300 text-neutral-700 grid place-items-center text-xs">
                {(authorName?.trim()?.[0] ?? "?").toUpperCase()}
              </div>
            )}
            <span className="text-sm text-neutral-700 group-hover:underline">{authorName || "Unknown"}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <AIBadge score={prediction.aiScore?.plausibility ?? 5} />
          {prediction.aiAnalysis ? (
            <div className="flex items-center gap-1 text-xs text-neutral-700">
              <span className="px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200">B {prediction.aiAnalysis.boldness}</span>
              <span className="px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200">R {prediction.aiAnalysis.relevance}</span>
            </div>
          ) : null}
          <span className={`px-2 py-1 rounded-full text-xs text-white ${statusCls}`}>{prediction.status}</span>
        </div>
      </header>

      <div className="flex items-center gap-2 flex-wrap">
        {prediction.taxonomy?.domain && <TaxonomyChip label={prediction.taxonomy.domain} />}
        {prediction.taxonomy?.subcategory && <TaxonomyChip label={prediction.taxonomy.subcategory} />}
        {prediction.taxonomy?.topic && <TaxonomyChip label={prediction.taxonomy.topic} />}
      </div>

      <div className="flex items-center justify-between text-sm text-neutral-700">
        <RelativeDaysText date={prediction.createdAt} variant="since" label="Created" />
        <RelativeDaysText date={prediction.timebox} variant="deadline" label="Closes" pastLabel="Closed" fallback="Closes date TBA" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <VoteButton
          variant="calledIt"
          label={`Called It (${voteCounts.calledIt})`}
          disabled={!!voting}
          onClick={async () => {
            try {
              setVoting("calledIt");
              setVoteCounts((c) => ({ ...c, calledIt: c.calledIt + 1 }));
              await castVote(prediction.id, "calledIt");
              toast.success("Vote recorded: Called It");
            } catch (e) {
              setVoteCounts((c) => ({ ...c, calledIt: Math.max(0, c.calledIt - 1) }));
              toast.error("Failed to record vote");
            } finally {
              setVoting(null);
            }
          }}
        />
        <VoteButton
          variant="botched"
          label={`Botched (${voteCounts.botched})`}
          disabled={!!voting}
          onClick={async () => {
            try {
              setVoting("botched");
              setVoteCounts((c) => ({ ...c, botched: c.botched + 1 }));
              await castVote(prediction.id, "botched");
              toast.success("Vote recorded: Botched");
            } catch (e) {
              setVoteCounts((c) => ({ ...c, botched: Math.max(0, c.botched - 1) }));
              toast.error("Failed to record vote");
            } finally {
              setVoting(null);
            }
          }}
        />
        <VoteButton
          variant="fence"
          label={`Fence (${voteCounts.fence})`}
          disabled={!!voting}
          onClick={async () => {
            try {
              setVoting("fence");
              setVoteCounts((c) => ({ ...c, fence: c.fence + 1 }));
              await castVote(prediction.id, "fence");
              toast.success("Vote recorded: Fence");
            } catch (e) {
              setVoteCounts((c) => ({ ...c, fence: Math.max(0, c.fence - 1) }));
              toast.error("Failed to record vote");
            } finally {
              setVoting(null);
            }
          }}
        />
      </div>
      {profileOpen && (
        <UserProfileModal uid={prediction.authorId} open={profileOpen} onClose={() => setProfileOpen(false)} />
      )}
    </article>
  );
}
