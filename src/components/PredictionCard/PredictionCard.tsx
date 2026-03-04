import styles from "./PredictionCard.module.scss";
import AIBadge from "../AIBadge/AIBadge";
import VoteButton from "../VoteButton/VoteButton";
import type { Prediction } from "../../types/prediction";
import { useEffect, useState } from "react";
import { castVote } from "../../services/vote-service";
import { doc, getDoc, getFirestore } from "firebase/firestore";
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
  const [timePct, setTimePct] = useState<number>(0);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

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

  useEffect(() => {
    try {
      const now = Date.now();
      const start = prediction.createdAt ? new Date(prediction.createdAt).getTime() : now;
      const end = prediction.timebox ? new Date(prediction.timebox as any).getTime() : now;
      if (end > start) {
        const pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
        setTimePct(pct);
        const days = Math.max(0, Math.ceil((end - now) / 86400000));
        setDaysLeft(days);
      } else {
        setTimePct(0);
        setDaysLeft(0);
      }
    } catch {
      setTimePct(0);
      setDaysLeft(null);
    }
  }, [prediction.createdAt, prediction.timebox]);

  return (
    <article className={`${styles.card} bg-white rounded-lg shadow-subtle p-0`}>
      <div className={styles.topAccent} />
      <div className="p-4 grid gap-3">
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
            <p className="text-sm text-neutral-600 italic">{prediction.rationale}</p>
          ) : null}
          <div className="mt-1 grid gap-1">
            <div className="text-[0.6rem] uppercase tracking-[0.14em] text-neutral-400">Resolves when</div>
            <div className="inline-block text-[0.8rem] font-medium text-neutral-700 tracking-wide bg-neutral-50 border border-neutral-200 rounded px-3 py-2">
              {Array.isArray(prediction.metrics) && prediction.metrics.length > 0 ? (
                <>
                  {prediction.metrics.map((m, i) => (
                    <span key={i}>
                      {m.metric} {m.operator} {m.target}{i < prediction.metrics!.length - 1 ? " • " : ""}
                    </span>
                  ))}
                </>
              ) : (
                <span>
                  {prediction.metric} • Ref: {prediction.referenceValue}
                </span>
              )}
            </div>
          </div>
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

      <div className="flex items-center gap-2">
        <div className={`${styles.timebarTrack} flex-1`}>
          <div className={styles.timebarFill} style={{ width: `${timePct}%` }} />
        </div>
        <span className="text-[0.6rem] text-neutral-400 tracking-[0.08em] whitespace-nowrap">{daysLeft != null ? `${daysLeft} days left` : ""}</span>
      </div>

      <div className={styles.divider} />

      <div className="text-[0.55rem] uppercase tracking-[0.14em] text-neutral-400 text-center">Your forecast</div>

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
      <button type="button" className="w-full mt-1 px-3 py-2 rounded border border-neutral-900 text-neutral-900 text-[0.62rem] font-medium tracking-[0.12em] uppercase hover:bg-neutral-900 hover:text-white transition-colors">
        Join the discussion →
      </button>

      </div>
      <footer className="border-t bg-neutral-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          {prediction.taxonomy?.domain && (
            <span className="text-[0.56rem] uppercase tracking-[0.07em] text-neutral-500">{prediction.taxonomy.domain}</span>
          )}
          {prediction.taxonomy?.subcategory && (
            <>
              <span className="mx-1 text-[0.5rem] text-neutral-400">›</span>
              <span className="text-[0.52rem] uppercase tracking-[0.07em] text-neutral-400">{prediction.taxonomy.subcategory}</span>
            </>
          )}
          {prediction.taxonomy?.topic && (
            <>
              <span className="mx-1 text-[0.5rem] text-neutral-300">›</span>
              <span className="text-[0.48rem] uppercase tracking-[0.07em] text-neutral-300">{prediction.taxonomy.topic}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="flex items-center gap-2 group" onClick={() => setProfileOpen(true)}>
            {authorPhoto ? (
              <img src={authorPhoto} alt={authorName ?? ""} className="w-5 h-5 rounded-full object-cover border" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-neutral-300 text-neutral-700 grid place-items-center text-[0.6rem]">
                {(authorName?.trim()?.[0] ?? "?").toUpperCase()}
              </div>
            )}
            <span className="text-[0.52rem] text-neutral-400">{authorName || "Unknown"}</span>
          </button>
          {prediction.aiAnalysis ? (
            <>
              <div className="w-px h-2.5 bg-neutral-200" />
              <span className="text-[0.52rem] text-neutral-400">B{prediction.aiAnalysis.boldness} · R{prediction.aiAnalysis.relevance}</span>
            </>
          ) : null}
        </div>
      </footer>
      {profileOpen && (
        <UserProfileModal uid={prediction.authorId} open={profileOpen} onClose={() => setProfileOpen(false)} />
      )}
    </article>
  );
}
