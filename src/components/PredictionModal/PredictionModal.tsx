"use client";
import type { Prediction } from "../../types/prediction";
import RelativeDaysText from "../RelativeDaysText/RelativeDaysText";
import { useEffect, useMemo, useState } from "react";
import { addComment } from "../../services/discussion-service";
import { toast } from "react-hot-toast";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import UserProfileModal from "../UserProfileModal/UserProfileModal";
import { Playfair_Display, JetBrains_Mono } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700", "900"] });
const jetmono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"] });

export default function PredictionModal({ prediction, onClose }: { prediction: Prediction; onClose: () => void }) {
  const calledIt = prediction.humanVotes?.outcome?.calledIt ?? 0;
  const botched = prediction.humanVotes?.outcome?.botched ?? 0;
  const fence = prediction.humanVotes?.outcome?.fence ?? 0;
  const totalVotes = calledIt + botched + fence;
  const pct = (v: number) => (totalVotes > 0 ? Math.round((v / totalVotes) * 100) : 0);
  const [comments, setComments] = useState<string[]>(useMemo(() => prediction.comments ?? [], [prediction.id]));
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [authorName, setAuthorName] = useState<string | null>(null);
  const [authorPhoto, setAuthorPhoto] = useState<string | null>(null);
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

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 flex items-start justify-center overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl border border-neutralBorder mt-10 overflow-hidden">
          <div className="h-0.5 bg-neutral-900" />
          <div className="px-5 py-4 border-b border-neutralBorder flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-neutral-500">
              {prediction.taxonomy?.domain && <span className={`${jetmono.className} uppercase tracking-[0.09em]`}>{prediction.taxonomy.domain}</span>}
              {prediction.taxonomy?.subcategory && <><span className="mx-1 text-neutral-300">›</span><span className={`${jetmono.className} uppercase tracking-[0.09em]`}>{prediction.taxonomy.subcategory}</span></>}
              {prediction.taxonomy?.topic && <><span className="mx-1 text-neutral-300">›</span><span className={`${jetmono.className} uppercase tracking-[0.09em]`}>{prediction.taxonomy.topic}</span></>}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="flex items-center gap-2 group" onClick={() => setProfileOpen(true)}>
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
              <div className={`${jetmono.className} inline-flex items-center gap-2 text-[0.9rem] font-medium text-neutral-700 tracking-wide bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2`}>
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
                <div className={`${jetmono.className} text-[0.6rem] uppercase tracking-[0.14em] text-neutral-400`}>AI assessment</div>
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
              </div>
              <div className="grid gap-1 text-sm text-neutral-700">
                <div className={`${jetmono.className} text-[0.6rem] uppercase tracking-[0.14em] text-neutral-400`}>Timeline</div>
                <div className="flex items-center justify-between">
                  <RelativeDaysText date={prediction.createdAt} variant="since" label="Created" />
                  <RelativeDaysText date={prediction.timebox} variant="deadline" label="Closes" pastLabel="Closed" fallback="Closes date TBA" />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <div className={`${jetmono.className} text-[0.6rem] uppercase tracking-[0.14em] text-neutral-400`}>Forecast convergence</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded bg-neutralBg overflow-hidden flex">
                  <div className="h-2 bg-green-500" style={{ width: `${pct(calledIt)}%` }} />
                  <div className="h-2 bg-red-400" style={{ width: `${pct(botched)}%` }} />
                  <div className="h-2 bg-blue-400" style={{ width: `${pct(fence)}%` }} />
                </div>
                <div className="text-xs text-neutral-600 whitespace-nowrap">{totalVotes} votes</div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={`${jetmono.className} px-2 py-1 rounded border border-neutralBorder text-green-700 bg-green-50`}>Called It ({calledIt})</span>
                <span className={`${jetmono.className} px-2 py-1 rounded border border-neutralBorder text-neutral-700 bg-neutral-50`}>Fence ({fence})</span>
                <span className={`${jetmono.className} px-2 py-1 rounded border border-neutralBorder text-red-700 bg-red-50`}>Botched ({botched})</span>
              </div>
            </div>

            <details className="rounded border border-neutralBorder">
              <summary className="px-3 py-2 cursor-pointer select-none text-sm">Discussion ({comments.length})</summary>
              <div className="px-3 py-2 text-sm text-neutral-700 grid gap-3">
                {comments.length === 0 && (
                  <div className="text-neutral-500 italic">Be the first to reason out loud.</div>
                )}
                {comments.map((c, i) => (
                  <div key={i} className="border-t border-neutralBorder pt-2">{c}</div>
                ))}
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
                          setComments((prev) => [...prev, text]);
                          setCommentText("");
                          await addComment(prediction.id, text);
                          toast.success("Comment posted");
                        } catch (err) {
                          // rollback on error
                          setComments((prev) => prev.filter((v, idx) => !(idx === prev.length - 1 && v === text)));
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
