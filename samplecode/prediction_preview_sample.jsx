import { useState } from "react";

const CARD_DATA = {
  title: "Iran to strike desalination plants",
  rationale: "The plants provide 60% of fresh water in the region, turning them into strategic targets to apply pressure.",
  resolution: "Desalination plants out of service ≥ 3",
  daysLeft: 27,
  author: "JP Ahonen",
  categories: ["Politics & Governance", "International Relations", "Conflicts & Wars"],
  scores: { b: 55, r: 94 },
  predictions: { count: 1, max: 10 },
};

export default function PredictionCard() {
  const [vote, setVote] = useState(null);
  const [hovered, setHovered] = useState(false);

  const confidence = Math.round(
    (CARD_DATA.scores.b / (CARD_DATA.scores.b + CARD_DATA.scores.r)) * 100
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f0ede8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;1,8..60,300;1,8..60,400&display=swap');

        .pred-card {
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease;
        }
        .pred-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 28px 64px rgba(0,0,0,0.11), 0 1px 3px rgba(0,0,0,0.06) !important;
        }
        .vote-btn {
          cursor: pointer;
          border: none;
          transition: all 0.16s cubic-bezier(0.34,1.56,0.64,1);
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.62rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .vote-btn:hover { transform: translateY(-2px) scale(1.05); }
        @keyframes barIn {
          from { width: 0; }
          to { width: var(--w); }
        }
        .bar-fill { animation: barIn 1.4s cubic-bezier(0.4,0,0.2,1) forwards; }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(5px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fade-up { animation: fadeUp 0.3s ease forwards; }
      `}</style>

      <div
        className="pred-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          maxWidth: 520,
          width: "100%",
          background: "#fff",
          borderRadius: 6,
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        {/* ── 1. THE CLAIM ─────────────────────────────── */}
        {/* Top accent — thin, not competing */}
        <div style={{ height: 2, background: "#1a1a1a" }} />

        <div style={{ padding: "28px 28px 0" }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 900,
            fontSize: "1.65rem",
            lineHeight: 1.18,
            color: "#0d0d0d",
            margin: 0,
            letterSpacing: "-0.02em",
          }}>
            {CARD_DATA.title}
          </h2>
        </div>

        {/* ── 2. THE RATIONALE ─────────────────────────── */}
        <div style={{ padding: "14px 28px 0" }}>
          <p style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "0.975rem",
            lineHeight: 1.72,
            color: "rgba(0,0,0,0.58)",
            margin: 0,
          }}>
            {CARD_DATA.rationale}
          </p>
        </div>

        {/* ── 3. RESOLUTION DEFINITION ─────────────────── */}
        <div style={{ padding: "16px 28px 0" }}>
          {/* Label sits above, unambiguously definitional */}
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.52rem",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: "rgba(0,0,0,0.28)",
            marginBottom: 5,
          }}>
            Resolves when
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.8rem",
            fontWeight: 500,
            color: "rgba(0,0,0,0.62)",
            letterSpacing: "0.02em",
            background: "#f8f8f6",
            border: "1px solid rgba(0,0,0,0.07)",
            borderRadius: 3,
            padding: "8px 14px",
            display: "inline-block",
          }}>
            {CARD_DATA.resolution}
          </div>
        </div>

        {/* ── 4. TIMEBOX ───────────────────────────────── */}
        <div style={{ padding: "14px 28px 0", display: "flex", alignItems: "center", gap: 8 }}>
          {/* Minimal hourglass-like progress bar */}
          <div style={{
            flex: 1,
            height: 2,
            background: "#ececec",
            borderRadius: 1,
            overflow: "hidden",
          }}>
            {/* 27 days remaining out of ~30 typical window → ~10% elapsed */}
            <div style={{
              width: "10%",
              height: "100%",
              background: "rgba(0,0,0,0.18)",
              borderRadius: 1,
            }} />
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.58rem",
            color: "rgba(0,0,0,0.3)",
            letterSpacing: "0.08em",
            whiteSpace: "nowrap",
          }}>
            {CARD_DATA.daysLeft} days left
          </span>
        </div>

        {/* ── DIVIDER ──────────────────────────────────── */}
        <div style={{ margin: "20px 28px 0", height: 1, background: "#f0f0f0" }} />

        {/* ── VOTE / CTA ───────────────────────────────── */}
        <div style={{ padding: "18px 28px 22px" }}>
          {!vote ? (
            <>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.55rem",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "rgba(0,0,0,0.25)",
                marginBottom: 10,
                textAlign: "center",
              }}>
                Your forecast
              </div>
              <div style={{ display: "flex", gap: 7 }}>
                {[
                  { key: "called",  label: "Called It",  bg: "#f0fdf4", border: "#86efac", color: "#15803d" },
                  { key: "fence",   label: "On Fence",   bg: "#fafafa", border: "#d1d5db", color: "#374151" },
                  { key: "botched", label: "Botched It", bg: "#fef2f2", border: "#fca5a5", color: "#b91c1c" },
                ].map(({ key, label, bg, border, color }) => (
                  <button
                    key={key}
                    className="vote-btn"
                    onClick={(e) => { e.stopPropagation(); setVote(key); }}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      background: bg,
                      border: `1px solid ${border}`,
                      color,
                      borderRadius: 3,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: "11px 0",
                  background: hovered ? "#0d0d0d" : "#fff",
                  border: "1px solid #0d0d0d",
                  color: hovered ? "#fff" : "#0d0d0d",
                  borderRadius: 3,
                  cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.62rem",
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  transition: "all 0.18s ease",
                }}
              >
                Join the discussion →
              </button>
            </>
          ) : (
            <div className="fade-up" style={{ textAlign: "center", padding: "6px 0" }}>
              <p style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.05rem",
                fontWeight: 700,
                color: vote === "called" ? "#15803d" : vote === "botched" ? "#b91c1c" : "#374151",
                margin: "0 0 4px",
              }}>
                {vote === "called" ? "You called it." : vote === "botched" ? "You flagged this." : "Watching from the fence."}
              </p>
              <p style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.55rem",
                color: "rgba(0,0,0,0.28)",
                margin: 0,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>
                Position recorded · Join the full discussion
              </p>
            </div>
          )}
        </div>

        {/* ── FOOTER METADATA ──────────────────────────── */}
        {/* Lowest contrast, smallest type — present but not competing */}
        <div style={{
          borderTop: "1px solid #f0f0f0",
          padding: "10px 28px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#fafafa",
        }}>
          {/* Category breadcrumb */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {CARD_DATA.categories.map((cat, i) => (
              <span key={cat} style={{ display: "flex", alignItems: "center" }}>
                {i > 0 && (
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.5rem",
                    color: "rgba(0,0,0,0.18)",
                    margin: "0 5px",
                  }}>›</span>
                )}
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: `${0.56 - i * 0.04}rem`,
                  color: `rgba(0,0,0,${0.38 - i * 0.1})`,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                }}>
                  {cat}
                </span>
              </span>
            ))}
          </div>

          {/* Author + scores */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.52rem",
              color: "rgba(0,0,0,0.28)",
              letterSpacing: "0.04em",
            }}>
              {CARD_DATA.author}
            </span>
            <div style={{ width: 1, height: 10, background: "#e0e0e0" }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.52rem",
              color: "rgba(0,0,0,0.28)",
            }}>
              B{CARD_DATA.scores.b} · R{CARD_DATA.scores.r} · {CARD_DATA.predictions.count}/{CARD_DATA.predictions.max}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}