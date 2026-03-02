"use client";
import type { Prediction } from "../../types/prediction";
import RelativeDaysText from "../RelativeDaysText/RelativeDaysText";
import { useMemo, useState } from "react";
import { addComment } from "../../services/discussion-service";
import { toast } from "react-hot-toast";

export default function PredictionModal({ prediction, onClose }: { prediction: Prediction; onClose: () => void }) {
  const calledIt = prediction.humanVotes?.outcome?.calledIt ?? 0;
  const botched = prediction.humanVotes?.outcome?.botched ?? 0;
  const fence = prediction.humanVotes?.outcome?.fence ?? 0;
  const totalVotes = calledIt + botched + fence;
  const pct = (v: number) => (totalVotes > 0 ? Math.round((v / totalVotes) * 100) : 0);
  const [comments, setComments] = useState<string[]>(useMemo(() => prediction.comments ?? [], [prediction.id]));
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 flex items-start justify-center overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl border border-neutralBorder mt-10">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutralBorder">
            <div className="flex items-center gap-2 text-sm text-neutral-700">
              {prediction.taxonomy?.domain && <span className="px-2 py-0.5 rounded border border-neutralBorder bg-neutralBg">{prediction.taxonomy.domain}</span>}
              {prediction.taxonomy?.subcategory && <span className="px-2 py-0.5 rounded border border-neutralBorder bg-neutralBg">{prediction.taxonomy.subcategory}</span>}
              {prediction.taxonomy?.topic && <span className="px-2 py-0.5 rounded border border-neutralBorder bg-neutralBg">{prediction.taxonomy.topic}</span>}
            </div>
            <button className="text-sm px-2 py-1 rounded border border-neutralBorder hover:bg-neutralBg" onClick={onClose} aria-label="Close">✕</button>
          </div>

          <div className="px-4 py-4 grid gap-4">
            <h2 className="text-lg font-semibold">{prediction.summary}</h2>

            {Array.isArray(prediction.metrics) && prediction.metrics.length > 0 ? (
              <div className="grid gap-1 text-sm text-neutral-700">
                {prediction.metrics.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="font-medium">{m.metric}</span>
                    <span className="px-1.5 py-0.5 rounded border border-neutralBorder bg-neutralBg">{m.operator}</span>
                    <span className="font-medium">{m.target}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-700">{prediction.metric} • Ref: {prediction.referenceValue}</p>
            )}

            {prediction.rationale && (
              <div className="grid gap-1">
                <div className="text-xs text-neutral-500">Rationale</div>
                <p className="text-sm text-neutral-700 border-l-2 border-neutralBorder pl-3">{prediction.rationale}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-3">
              <div className="grid gap-1 text-sm text-neutral-700">
                <div className="text-xs text-neutral-500">AI Analysis</div>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded border border-neutralBorder bg-neutralBg">Boldness {prediction.aiAnalysis?.boldness ?? "–"}</span>
                  <span className="px-1.5 py-0.5 rounded border border-neutralBorder bg-neutralBg">Relevance {prediction.aiAnalysis?.relevance ?? "–"}</span>
                </div>
              </div>
              <div className="grid gap-1 text-sm text-neutral-700">
                <div className="text-xs text-neutral-500">Timeline</div>
                <div className="flex items-center justify-between">
                  <RelativeDaysText date={prediction.createdAt} variant="since" label="Created" />
                  <RelativeDaysText date={prediction.timebox} variant="deadline" label="Closes" pastLabel="Closed" fallback="Closes date TBA" />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="text-xs text-neutral-500">Verdict</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded bg-neutralBg overflow-hidden flex">
                  <div className="h-2 bg-green-500" style={{ width: `${pct(calledIt)}%` }} />
                  <div className="h-2 bg-red-400" style={{ width: `${pct(botched)}%` }} />
                  <div className="h-2 bg-blue-400" style={{ width: `${pct(fence)}%` }} />
                </div>
                <div className="text-xs text-neutral-600 whitespace-nowrap">{totalVotes} votes</div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-1 rounded border border-neutralBorder">Called It ({calledIt})</span>
                <span className="px-2 py-1 rounded border border-neutralBorder">Botched ({botched})</span>
                <span className="px-2 py-1 rounded border border-neutralBorder">Fence ({fence})</span>
              </div>
            </div>

            <details className="rounded border border-neutralBorder">
              <summary className="px-3 py-2 cursor-pointer select-none text-sm">Discussion ({comments.length})</summary>
              <div className="px-3 py-2 text-sm text-neutral-700 grid gap-3">
                {comments.length === 0 && <div className="text-neutral-500">No comments yet.</div>}
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
