"use client";
import { useEffect, useMemo, useState } from "react";
import type { Prediction } from "../../types/prediction";
import { Playfair_Display, JetBrains_Mono } from "next/font/google";
import { trackEvent } from "../../lib/analytics";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700", "900"] });
const jetmono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"] });

export default function ShareModal({ open, onClose, prediction }: { open: boolean; onClose: () => void; prediction: Prediction }) {
  const [origin, setOrigin] = useState<string>("");
  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (open) {
      trackEvent("share_opened", { predictionId: prediction.id });
    }
  }, [open, prediction.id]);

  const url = useMemo(() => {
    const base = origin || "https://falsify.app";
    return `${base}/p/${encodeURIComponent(prediction.id)}`;
  }, [origin, prediction.id]);

  const shareText = useMemo(() => {
    const rationale = prediction.rationale ? ` — ${prediction.rationale}` : "";
    return `${prediction.summary}${rationale}`.slice(0, 240);
  }, [prediction.summary, prediction.rationale]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 flex items-center justify-center p-3" onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-lg bg-white rounded-lg shadow-xl border border-neutralBorder overflow-hidden">
          <div className="h-0.5 bg-neutral-900" />
          <div className="px-4 py-3 border-b border-neutralBorder flex items-center justify-between">
            <div className={`${jetmono.className} text-[0.62rem] uppercase tracking-[0.14em] text-neutral-500`}>Share prediction</div>
            <button className="text-sm px-2 py-1 rounded border border-neutralBorder hover:bg-neutralBg" onClick={onClose} aria-label="Close">✕</button>
          </div>

          <div className="p-4 grid gap-4">
            <div className="grid gap-2">
              <div className={`${jetmono.className} text-[0.6rem] uppercase tracking-[0.12em] text-neutral-400`}>Preview</div>
              <div className="border border-neutral-200 rounded-md p-3 bg-neutral-50">
                <div className={`${playfair.className} text-[1.2rem] font-extrabold text-neutral-900`}>{prediction.summary}</div>
                {prediction.rationale && (
                  <div className="text-neutral-600 italic mt-1 text-sm line-clamp-2">{prediction.rationale}</div>
                )}
                <div className="mt-2 text-[0.62rem] text-neutral-500 flex items-center gap-2">
                  {prediction.taxonomy?.domain && <span className={`${jetmono.className} uppercase tracking-[0.08em]`}>{prediction.taxonomy.domain}</span>}
                  {prediction.taxonomy?.subcategory && <><span className="text-neutral-300">›</span><span className={`${jetmono.className} uppercase tracking-[0.08em]`}>{prediction.taxonomy.subcategory}</span></>}
                  {prediction.taxonomy?.topic && <><span className="text-neutral-300">›</span><span className={`${jetmono.className} uppercase tracking-[0.08em]`}>{prediction.taxonomy.topic}</span></>}
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <div className={`${jetmono.className} text-[0.6rem] uppercase tracking-[0.12em] text-neutral-400`}>Share link</div>
              <div className="flex items-center gap-2">
                <input className="flex-1 px-3 py-2 rounded border border-neutralBorder text-sm" value={url} readOnly onFocus={(e) => e.currentTarget.select()} />
                <button
                  className="text-sm px-3 py-2 rounded border border-neutralBorder hover:bg-neutralBg"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(url);
                      trackEvent("share_link_copied", { predictionId: prediction.id });
                      // best-effort toast if react-hot-toast present globally, otherwise ignore
                      try { (window as any).toast?.success?.("Link copied"); } catch {}
                    } catch {}
                  }}
                >Copy</button>
              </div>
            </div>

            <div className="grid gap-2">
              <div className={`${jetmono.className} text-[0.6rem] uppercase tracking-[0.12em] text-neutral-400`}>Share to</div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="text-sm px-3 py-2 rounded border border-neutralBorder hover:bg-neutralBg"
                  onClick={() => {
                    const u = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
                    trackEvent("share_clicked", { provider: "twitter", predictionId: prediction.id });
                    window.open(u, "_blank", "noopener,noreferrer");
                  }}
                >X / Twitter</button>
                <button
                  className="text-sm px-3 py-2 rounded border border-neutralBorder hover:bg-neutralBg"
                  onClick={() => {
                    const u = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                    trackEvent("share_clicked", { provider: "facebook", predictionId: prediction.id });
                    window.open(u, "_blank", "noopener,noreferrer");
                  }}
                >Facebook</button>
                <button
                  className="text-sm px-3 py-2 rounded border border-neutralBorder hover:bg-neutralBg"
                  onClick={() => {
                    const u = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(prediction.summary)}&summary=${encodeURIComponent(shareText)}`;
                    trackEvent("share_clicked", { provider: "linkedin", predictionId: prediction.id });
                    window.open(u, "_blank", "noopener,noreferrer");
                  }}
                >LinkedIn</button>
                {typeof navigator !== "undefined" && (navigator as any).share && (
                  <button
                    className="text-sm px-3 py-2 rounded border border-neutralBorder hover:bg-neutralBg"
                    onClick={() => {
                      trackEvent("share_native", { predictionId: prediction.id });
                      (navigator as any).share({ title: prediction.summary, text: shareText, url }).catch(() => {});
                    }}
                  >Share…</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
