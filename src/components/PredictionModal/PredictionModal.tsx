"use client";
import type { Prediction } from "../../types/prediction";
import RelativeDaysText from "../RelativeDaysText/RelativeDaysText";
import { useEffect, useMemo, useState } from "react";
import { addComment } from "../../services/discussion-service";
import { toast } from "react-hot-toast";
import { collection, doc, getDoc, getFirestore, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import UserProfileModal from "../UserProfileModal/UserProfileModal";
import { Playfair_Display, JetBrains_Mono } from "next/font/google";
import ConvergenceChart from "../ConvergenceChart/ConvergenceChart";
import VoteButton, { type VoteVariant } from "../VoteButton/VoteButton";
import { castVote } from "../../services/vote-service";
import { getUserProfile, type UserProfile } from "../../services/profile-service";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700", "900"] });
const jetmono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"] });

export default function PredictionModal({ prediction, onClose }: { prediction: Prediction; onClose: () => void }) {
  const initialCalled = prediction.humanVotes?.outcome?.calledIt ?? 0;
  const initialBotched = prediction.humanVotes?.outcome?.botched ?? 0;
  const initialFence = prediction.humanVotes?.outcome?.fence ?? 0;
  const [calledCount, setCalledCount] = useState<number>(initialCalled);
  const [botchedCount, setBotchedCount] = useState<number>(initialBotched);
  const [fenceCount, setFenceCount] = useState<number>(initialFence);
  const totalVotes = calledCount + botchedCount + fenceCount;
  const pct = (v: number) => (totalVotes > 0 ? Math.round((v / totalVotes) * 100) : 0);
  type CommentItem = { id: string; userId: string; text: string; createdAt?: Date };
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile | null>>({});
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [authorName, setAuthorName] = useState<string | null>(null);
  const [authorPhoto, setAuthorPhoto] = useState<string | null>(null);
  const [profileUid, setProfileUid] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<VoteVariant | null>(null);
  const [voting, setVoting] = useState(false);

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
    const db = getFirestore();
    const qy = query(collection(db, "predictions", prediction.id, "comments"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(qy, (snap) => {
      const items: CommentItem[] = snap.docs.map((d) => {
        const x = d.data() as any;
        let created: Date | undefined = undefined;
        const c = x.createdAt as Timestamp | undefined;
        if (c && typeof c.toDate === "function") created = c.toDate();
        return { id: d.id, userId: x.userId as string, text: String(x.text || ""), createdAt: created };
      });
      setComments(items);
      // fetch missing profiles lazily
      const uids = Array.from(new Set(items.map((i) => i.userId))).filter((uid) => !(uid in profiles));
      if (uids.length > 0) {
        (async () => {
          const next: Record<string, UserProfile | null> = {};
          for (const uid of uids) {
            try {
              next[uid] = await getUserProfile(uid);
            } catch {
              next[uid] = null;
            }
          }
          setProfiles((prev) => ({ ...prev, ...next }));
        })();
      }
    });
    return () => unsub();
  }, [prediction.id, profiles]);

  useEffect(() => {
    let mounted = true;
    const auth = getAuth();
    const me = auth.currentUser;
    if (!me) return;
    const db = getFirestore();
    getDoc(doc(db, "predictions", prediction.id, "votes", me.uid)).then((v) => {
      if (!mounted) return;
      if (v.exists()) {
        const type = (v.data() as any).type as VoteVariant | undefined;
        if (type) setUserVote(type);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, [prediction.id]);

  async function handleVote(next: VoteVariant) {
    if (voting) return;
    setVoting(true);
    const prev = userVote;
    try {
      await castVote(prediction.id, next);
      // optimistic local counters
      if (prev === next) {
        // no-op idempotent
      } else {
        if (prev === "calledIt") setCalledCount((v) => Math.max(0, v - 1));
        if (prev === "botched") setBotchedCount((v) => Math.max(0, v - 1));
        if (prev === "fence") setFenceCount((v) => Math.max(0, v - 1));
        if (next === "calledIt") setCalledCount((v) => v + 1);
        if (next === "botched") setBotchedCount((v) => v + 1);
        if (next === "fence") setFenceCount((v) => v + 1);
        setUserVote(next);
      }
      toast.success("Vote recorded");
    } catch (e: any) {
      toast.error(e?.message || "Failed to vote");
    } finally {
      setVoting(false);
    }
  }

  const daysLeft = useMemo(() => {
    try {
      const now = Date.now();
      const end = prediction.timebox ? new Date(prediction.timebox as any).getTime() : now;
      return Math.max(0, Math.ceil((end - now) / 86400000));
    } catch {
      return null;
    }
  }, [prediction.timebox]);

  function fmtDate(val: any) {
    try {
      const d = new Date(val);
      return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return String(val ?? "");
    }
  }

  function fmtSince(d?: Date) {
    if (!d) return "just now";
    const ms = Date.now() - d.getTime();
    const s = Math.max(1, Math.floor(ms / 1000));
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    return `${days}d ago`;
  }

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 flex items-stretch md:items-start justify-center overflow-auto p-0 md:p-4" onClick={(e) => e.stopPropagation()}>
        <div className="w-full md:max-w-3xl bg-white md:rounded-lg md:shadow-xl border border-neutralBorder md:mt-10 h-full md:h-auto md:overflow-hidden overflow-y-auto">
          <div className="h-0.5 bg-neutral-900" />
          <div className="px-5 py-4 border-b border-neutralBorder flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-neutral-500">
              {prediction.taxonomy?.domain && <span className={`${jetmono.className} uppercase tracking-[0.09em]`}>{prediction.taxonomy.domain}</span>}
              {prediction.taxonomy?.subcategory && <><span className="mx-1 text-neutral-300">›</span><span className={`${jetmono.className} uppercase tracking-[0.09em]`}>{prediction.taxonomy.subcategory}</span></>}
              {prediction.taxonomy?.topic && <><span className="mx-1 text-neutral-300">›</span><span className={`${jetmono.className} uppercase tracking-[0.09em]`}>{prediction.taxonomy.topic}</span></>}
              {profileUid && (
        <UserProfileModal uid={profileUid} open={true} onClose={() => setProfileUid(null)} />
      )}
    </div>
            <div className="flex items-center gap-2">
              <button type="button" className="flex items-center gap-2 group" onClick={() => setProfileUid(prediction.authorId)}>
                {authorPhoto ? (
                  <img src={authorPhoto} alt={authorName ?? ""} className="w-6 h-6 rounded-full object-cover border" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-neutral-300 text-neutral-700 grid place-items-center text-xs">
                    {(authorName?.trim()?.[0] ?? "?").toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-neutral-700 group-hover:underline">{authorName || "Unknown"}</span>
              </button>
              <button className="text-sm px-2 py-1 rounded border border-neutralBorder hover:bg-neutralBg" onClick={onClose} aria-label="Close">✕</button>
            </div>
          </div>

          <div className="px-5 py-5 grid gap-4">
            <h2 className={`${playfair.className} text-[1.6rem] md:text-[1.9rem] font-extrabold leading-tight tracking-tight text-neutral-900`}>{prediction.summary}</h2>

            {prediction.rationale && (
              <p className="text-[1.05rem] leading-7 text-neutral-600 italic">{prediction.rationale}</p>
            )}

            <div className="grid gap-1 mt-1">
              <div className={`${jetmono.className} text-[0.6rem] uppercase tracking-[0.14em] text-neutral-400`}>Resolves when</div>
              <div className={`${jetmono.className} inline-flex items-center gap-2 text-[0.9rem] font-medium text-neutral-700 tracking-wide bg-neutral-50 border border-neutral-200 rounded-[3px] px-3 py-2`}>
                {Array.isArray(prediction.metrics) && prediction.metrics.length > 0 ? (
                  <>
                    {prediction.metrics.map((m, i) => (
                      <span key={i}>{m.metric} <span className="text-neutral-400">{m.operator}</span> <span className="font-semibold text-neutral-900">{m.target}</span>{i < prediction.metrics!.length - 1 ? " • " : ""}</span>
                    ))}
                  </>
                ) : (
                  <span>
                    {prediction.metric} <span className="text-neutral-400">ref</span> <span className="font-semibold text-neutral-900">{prediction.referenceValue}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-2">
              <span className={`${jetmono.className}`}>Opened {fmtDate(prediction.createdAt)}</span>
              <span className={`${jetmono.className}`}>Closes {fmtDate(prediction.timebox)}{typeof daysLeft === "number" ? ` · ${daysLeft}d left` : ""}</span>
            </div>
            <div className="h-0.5 bg-neutral-200 rounded" />

            <div className="grid md:grid-cols-2 gap-3">
              <div className="grid gap-1 text-sm text-neutral-700">
                <div className={`${jetmono.className} text-[0.6rem] uppercase tracking-[0.14em] text-neutral-400`}>Timeline</div>
                <div className="flex items-center justify-between">
                  <RelativeDaysText date={prediction.createdAt} variant="since" label="Created" />
                  <RelativeDaysText date={prediction.timebox} variant="deadline" label="Closes" pastLabel="Closed" fallback="Closes date TBA" />
                </div>
              </div>
              <div />
            </div>

            <div className="grid gap-2">
              <div className={`${jetmono.className} text-[0.6rem] uppercase tracking-[0.14em] text-neutral-400`}>Forecast convergence</div>
              <div className="flex items-center justify-between">
                <p className="text-[0.82rem] italic text-neutral-500 max-w-[320px] m-0">
                  The grey band is undecided forecasters. Watch it collapse as the deadline closes.
                </p>
                <div className="flex gap-4 items-end">
                  <div className="text-center"><div className={`${jetmono.className} text-[1.05rem] font-semibold text-green-700 leading-none`}>{calledCount}</div><div className={`${jetmono.className} text-[0.46rem] uppercase tracking-[0.1em] text-neutral-400 mt-1`}>Called</div></div>
                  <div className="text-center"><div className={`${jetmono.className} text-[1.05rem] font-semibold text-neutral-500 leading-none`}>{fenceCount}</div><div className={`${jetmono.className} text-[0.46rem] uppercase tracking-[0.1em] text-neutral-400 mt-1`}>Fence</div></div>
                  <div className="text-center"><div className={`${jetmono.className} text-[1.05rem] font-semibold text-red-700 leading-none`}>{botchedCount}</div><div className={`${jetmono.className} text-[0.46rem] uppercase tracking-[0.1em] text-neutral-400 mt-1`}>Botched</div></div>
                </div>
              </div>
              <div className="h-[180px]">
                <ConvergenceChart calledIt={calledCount} fence={fenceCount} botched={botchedCount} height={180} startAt={prediction.createdAt} endAt={prediction.timebox} />
              </div>
              <div className={`${jetmono.className} text-[0.46rem] uppercase tracking-[0.1em] text-neutral-300 text-right mt-1`}>
                Projected after today · based on historical convergence patterns
              </div>
            </div>

            <div className="grid gap-2 mt-2">
              <div className={`${jetmono.className} text-[0.6rem] uppercase tracking-[0.14em] text-neutral-400`}>Your forecast</div>
              <div className="flex flex-wrap gap-2">
                <VoteButton variant="calledIt" label="Called It" onClick={() => handleVote("calledIt")} disabled={voting} />
                <VoteButton variant="fence" label="Fence" onClick={() => handleVote("fence")} disabled={voting} />
                <VoteButton variant="botched" label="Botched" onClick={() => handleVote("botched")} disabled={voting} />
              </div>
              <div className="text-[0.82rem] italic text-neutral-500">Early positions carry more signal; you can always revise your call later.</div>
            </div>

            <div className="grid gap-2 mt-4">
              <div className="flex items-center justify-between">
                <div className={`${jetmono.className} text-[0.6rem] uppercase tracking-[0.14em] text-neutral-400`}>AI assessment</div>
                {prediction.aiAnalysis?.fallbackUsed && (
                  <div className={`${jetmono.className} text-[0.58rem] uppercase tracking-[0.12em] text-neutral-500 border border-neutral-200 rounded-[3px] px-2 py-0.5`}>Model fallback used</div>
                )}
              </div>
              <div className="grid gap-2 text-sm text-neutral-700">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <div className={`${jetmono.className} text-[0.62rem] uppercase tracking-[0.06em] text-neutral-600`}>Boldness</div>
                    <div className="flex-1 h-[3px] bg-neutral-200 rounded">
                      <div className="h-[3px] bg-orange-500 rounded" style={{ width: `${prediction.aiAnalysis?.boldness ?? 0}%` }} />
                    </div>
                    <div className={`${jetmono.className} text-[0.72rem] font-semibold text-orange-600 min-w-[26px] text-right`}>{prediction.aiAnalysis?.boldness ?? "–"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
                    <div className={`${jetmono.className} text-[0.62rem] uppercase tracking-[0.06em] text-neutral-600`}>Relevance</div>
                    <div className="flex-1 h-[3px] bg-neutral-200 rounded">
                      <div className="h-[3px] bg-neutral-900 rounded" style={{ width: `${prediction.aiAnalysis?.relevance ?? 0}%` }} />
                    </div>
                    <div className={`${jetmono.className} text-[0.72rem] font-semibold text-neutral-900 min-w-[26px] text-right`}>{prediction.aiAnalysis?.relevance ?? "–"}</div>
                  </div>
                </div>
                {Array.isArray(prediction.aiAnalysis?.notes) && prediction.aiAnalysis!.notes.length > 0 && (
                  <ul className="list-disc pl-5 text-neutral-700">
                    {prediction.aiAnalysis!.notes.map((n, i) => (
                      <li key={i} className="text-[0.95rem] leading-6">{n}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <details className="rounded border border-neutralBorder">
              <summary className="px-3 py-2 cursor-pointer select-none text-sm">Discussion ({comments.length})</summary>
              <div className="px-3 py-2 text-sm text-neutral-700 grid gap-3">
                {comments.length === 0 && (
                  <div className="text-neutral-500 italic">Be the first to reason out loud.</div>
                )}
                <ul className="grid gap-3">
                  {comments.map((c) => {
                    const p = profiles[c.userId] || null;
                    const isOP = c.userId === prediction.authorId;
                    return (
                      <li key={c.id} className="border-t border-neutralBorder pt-2">
                        <div className="flex items-start gap-2">
                          <button type="button" onClick={() => setProfileUid(c.userId)} className="shrink-0">
                            {p?.photoURL ? (
                              <img src={p.photoURL} alt="avatar" className="w-7 h-7 rounded-full border object-cover" />
                            ) : (
                              <div className="w-7 h-7 rounded-full border bg-neutral-100 grid place-items-center text-neutral-600 text-[0.8rem]">
                                {(p?.displayName || "?").charAt(0).toUpperCase()}
                              </div>
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => setProfileUid(c.userId)} className="font-medium text-neutral-800 truncate hover:underline">
                                {p?.displayName || "Unknown"}
                              </button>
                              {isOP && <span className={`${jetmono.className} text-[0.58rem] uppercase tracking-[0.12em] text-neutral-600 border border-neutral-200 rounded-[3px] px-1.5 py-0.5`}>OP</span>}
                              <span className="text-neutral-400 text-xs">• {fmtSince(c.createdAt)}</span>
                            </div>
                            <div className="text-neutral-800 leading-6 whitespace-pre-wrap break-words">{c.text}</div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="border-t border-neutralBorder pt-3 grid gap-2">
                  <label className="text-xs text-neutral-500" htmlFor="new-comment">Add a comment</label>
                  <div className="flex items-center gap-2">
                    <input
                      id="new-comment"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a falsifiable objection..."
                      className="flex-1 px-3 py-2 rounded border border-neutralBorder focus:outline-none focus:ring-2 focus:ring-neutralBorder/50"
                    />
                    <button
                      className="text-sm px-3 py-2 rounded border border-neutralBorder hover:bg-neutralBg disabled:opacity-60"
                      disabled={posting || !commentText.trim()}
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!commentText.trim()) return;
                        setPosting(true);
                        const text = commentText.trim();
                        try {
                          setCommentText("");
                          await addComment(prediction.id, text);
                          toast.success("Comment posted");
                        } catch (err) {
                          toast.error("Failed to post comment");
                        } finally {
                          setPosting(false);
                        }
                      }}
                    >Post</button>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
