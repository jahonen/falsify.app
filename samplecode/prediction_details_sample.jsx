import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";

// ── DATA ─────────────────────────────────────────────────────────────────────
const PREDICTION = {
  summary: "Iran to strike desalination plants",
  rationale: "The plants provide 60% of fresh water in the region, turning them into strategic targets to apply pressure.",
  metric: "Desalination plants out of service",
  operator: ">=",
  target: "3",
  status: "pending",
  timebox: "31 Mar 2026",
  createdAt: "4 Mar 2026",
  daysLeft: 27,
  totalDays: 27,
  author: "JP Ahonen",
  taxonomy: {
    domain: "Politics & Governance",
    subcategory: "International Relations",
    topic: "Conflicts & Wars",
  },
  aiAnalysis: {
    boldness: 55,
    relevance: 94,
    notes: [
      {
        dimension: "Boldness",
        score: 55,
        color: "#f97316",
        text: "The prediction involves a significant act of aggression with high regional stakes, but the short time horizon keeps it from being extremely bold.",
      },
      {
        dimension: "Relevance",
        score: 94,
        color: "#0d0d0d",
        text: "The metric is highly specific, measurable, and directly aligns with the predicted event.",
      },
    ],
  },
  humanVotes: { calledIt: 1, fence: 0, botched: 0 },
};

// 100% normalised stacked data
// fence% decays toward 0 by deadline; called/botched absorb it
// "Today" is the last observed point; everything after is projected
const CONVERGENCE_DATA = [
  { day: "Day 1",  pct_called: 28, pct_fence: 50, pct_botched: 22, projected: false },
  { day: "Day 4",  pct_called: 31, pct_fence: 44, pct_botched: 25, projected: false },
  { day: "Day 7",  pct_called: 34, pct_fence: 38, pct_botched: 28, projected: false },
  { day: "Day 10", pct_called: 37, pct_fence: 32, pct_botched: 31, projected: false },
  { day: "Today",  pct_called: 40, pct_fence: 26, pct_botched: 34, projected: false },
  { day: "Day 18", pct_called: 44, pct_fence: 16, pct_botched: 40, projected: true  },
  { day: "Day 21", pct_called: 47, pct_fence:  9, pct_botched: 44, projected: true  },
  { day: "Day 24", pct_called: 49, pct_fence:  4, pct_botched: 47, projected: true  },
  { day: "Close",  pct_called: 51, pct_fence:  1, pct_botched: 48, projected: true  },
];

// ── TOOLTIP ──────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const isProjected = CONVERGENCE_DATA.find(d => d.day === label)?.projected;
  return (
    <div style={{
      background: "#fff",
      border: "1px solid rgba(0,0,0,0.08)",
      borderRadius: 3,
      padding: "10px 14px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      minWidth: 140,
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.52rem",
        color: "rgba(0,0,0,0.3)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: 6,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}>
        {label}
        {isProjected && (
          <span style={{ color: "rgba(0,0,0,0.2)", fontStyle: "italic" }}>projected</span>
        )}
      </div>
      {[...payload].reverse().map(p => (
        <div key={p.name} style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.62rem",
          color: p.color,
          display: "flex",
          justifyContent: "space-between",
          gap: 20,
          lineHeight: 1.8,
        }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 600 }}>{p.value}%</span>
        </div>
      ))}
    </div>
  );
}

// ── SCORE BAR ─────────────────────────────────────────────────────────────────
function ScoreBar({ score, color }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      flex: 1,
    }}>
      <div style={{
        flex: 1,
        height: 3,
        background: "#ececec",
        borderRadius: 2,
        overflow: "hidden",
      }}>
        <div style={{
          width: `${score}%`,
          height: "100%",
          background: color,
          borderRadius: 2,
          transition: "width 1s ease",
        }} />
      </div>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.72rem",
        fontWeight: 600,
        color,
        minWidth: 26,
        textAlign: "right",
      }}>{score}</span>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function PredictionDetail() {
  const [vote, setVote] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: "#f0ede8", padding: "2rem 1rem" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=JetBrains+Mono:wght@400;500&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;1,8..60,300;1,8..60,400&display=swap');
        * { box-sizing: border-box; }
        .vote-btn {
          cursor: pointer; border: none;
          transition: all 0.16s cubic-bezier(0.34,1.56,0.64,1);
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.62rem; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
        }
        .vote-btn:hover { transform: translateY(-2px) scale(1.04); }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .card { animation: fadeUp 0.35s ease both; }
        .card:nth-child(2) { animation-delay: 0.05s; }
        .card:nth-child(3) { animation-delay: 0.10s; }
        .card:nth-child(4) { animation-delay: 0.15s; }
        .card:nth-child(5) { animation-delay: 0.20s; }
      `}</style>

      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        {/* BACK */}
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: "0.55rem",
          textTransform: "uppercase", letterSpacing: "0.12em",
          color: "rgba(0,0,0,0.3)", marginBottom: 20,
          cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
        }}>← Predictions</div>

        {/* ── 1. CLAIM ──────────────────────────────────────────────────────── */}
        <div className="card" style={card()}>
          <div style={{ height: 2, background: "#0d0d0d" }} />
          <div style={{ padding: "28px 28px 24px" }}>

            {/* Taxonomy */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
              {[PREDICTION.taxonomy.domain, PREDICTION.taxonomy.subcategory, PREDICTION.taxonomy.topic].map((t, i) => (
                <span key={t} style={{ display: "flex", alignItems: "center" }}>
                  {i > 0 && <span style={{ fontFamily: "mono", fontSize: "0.5rem", color: "rgba(0,0,0,0.18)", margin: "0 6px" }}>›</span>}
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: `${0.56 - i * 0.04}rem`,
                    color: `rgba(0,0,0,${0.42 - i * 0.1})`,
                    textTransform: "uppercase", letterSpacing: "0.09em",
                  }}>{t}</span>
                </span>
              ))}
            </div>

            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 900, fontSize: "1.85rem", lineHeight: 1.16,
              color: "#0d0d0d", margin: "0 0 16px", letterSpacing: "-0.02em",
            }}>{PREDICTION.summary}</h1>

            <p style={{
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontStyle: "italic", fontWeight: 400,
              fontSize: "1rem", lineHeight: 1.72,
              color: "rgba(0,0,0,0.56)", margin: "0 0 22px",
            }}>{PREDICTION.rationale}</p>

            {/* Resolution */}
            <div style={{ marginBottom: 22 }}>
              <div style={metaLabel()}>Resolves when</div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "#f8f8f6", border: "1px solid rgba(0,0,0,0.07)",
                borderRadius: 3, padding: "8px 14px",
              }}>
                <span style={monoMd({ color: "rgba(0,0,0,0.6)" })}>{PREDICTION.metric}</span>
                <span style={monoMd({ color: "rgba(0,0,0,0.28)" })}>{PREDICTION.operator}</span>
                <span style={monoMd({ color: "#0d0d0d", fontWeight: 600 })}>{PREDICTION.target}</span>
              </div>
            </div>

            {/* Timebox */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={metaLabel(true)}>Opened {PREDICTION.createdAt}</span>
                <span style={metaLabel(true)}>Closes {PREDICTION.timebox} · {PREDICTION.daysLeft}d left</span>
              </div>
              <div style={{ height: 3, background: "#ececec", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: "2%", height: "100%", background: "#0d0d0d", opacity: 0.2, borderRadius: 2 }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. YOUR FORECAST ─────────────────────────────────────────────── */}
        <div className="card" style={card()}>
          <div style={{ padding: "22px 28px 24px" }}>
            <div style={metaLabel()}>Your forecast</div>
            <div style={{ height: 14 }} />
            {!vote ? (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  {[
                    { key: "called",  label: "Called It",  bg: "#f0fdf4", border: "#86efac", color: "#15803d" },
                    { key: "fence",   label: "On Fence",   bg: "#fafafa", border: "#d1d5db", color: "#374151" },
                    { key: "botched", label: "Botched It", bg: "#fef2f2", border: "#fca5a5", color: "#b91c1c" },
                  ].map(({ key, label, bg, border, color }) => (
                    <button key={key} className="vote-btn"
                      onClick={() => setVote(key)}
                      style={{ flex: 1, padding: "13px 0", background: bg, border: `1px solid ${border}`, color, borderRadius: 3 }}>
                      {label}
                    </button>
                  ))}
                </div>
                <p style={{
                  fontFamily: "'Source Serif 4', Georgia, serif",
                  fontStyle: "italic", fontSize: "0.82rem",
                  color: "rgba(0,0,0,0.34)", lineHeight: 1.55,
                  borderLeft: "2px solid #ececec", paddingLeft: 12, margin: 0,
                }}>
                  As the deadline approaches, undecided forecasters tend to commit. Your early position carries more signal now.
                </p>
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{
                    fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700,
                    color: vote === "called" ? "#15803d" : vote === "botched" ? "#b91c1c" : "#374151",
                    marginBottom: 4,
                  }}>
                    {vote === "called" ? "You called it." : vote === "botched" ? "You flagged this." : "Watching from the fence."}
                  </div>
                  <div style={metaLabel(true)}>Position recorded</div>
                </div>
                <button onClick={() => setVote(null)} style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem",
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  background: "none", border: "1px solid rgba(0,0,0,0.12)",
                  borderRadius: 3, padding: "6px 12px",
                  color: "rgba(0,0,0,0.35)", cursor: "pointer",
                }}>Change</button>
              </div>
            )}
          </div>
        </div>

        {/* ── 3. CONVERGENCE CHART ─────────────────────────────────────────── */}
        <div className="card" style={card()}>
          <div style={{ padding: "22px 28px 24px" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <div style={metaLabel()}>Forecast convergence</div>
                <div style={{ height: 6 }} />
                <p style={{
                  fontFamily: "'Source Serif 4', Georgia, serif",
                  fontStyle: "italic", fontSize: "0.82rem",
                  color: "rgba(0,0,0,0.38)", lineHeight: 1.55,
                  margin: 0, maxWidth: 320,
                }}>
                  The grey band is undecided forecasters. Watch it collapse as the deadline closes.
                </p>
              </div>

              {/* Live totals */}
              <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                {[
                  { label: "Called",  val: PREDICTION.humanVotes.calledIt, color: "#15803d" },
                  { label: "Fence",   val: PREDICTION.humanVotes.fence,    color: "#9ca3af" },
                  { label: "Botched", val: PREDICTION.humanVotes.botched,  color: "#b91c1c" },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.15rem", fontWeight: 600, color, lineHeight: 1 }}>{val}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.46rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(0,0,0,0.26)", marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stacked normalised chart */}
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CONVERGENCE_DATA} stackOffset="expand"
                  margin={{ top: 4, right: 0, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#16a34a" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity={0.08} />
                    </linearGradient>
                    <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9ca3af" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#9ca3af" stopOpacity={0.08} />
                    </linearGradient>
                    <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#dc2626" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day"
                    tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fill: "rgba(0,0,0,0.28)", letterSpacing: "0.04em" }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis tickFormatter={v => `${Math.round(v * 100)}%`}
                    tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fill: "rgba(0,0,0,0.28)" }}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />

                  {/* Today marker */}
                  <ReferenceLine x="Today" stroke="rgba(0,0,0,0.18)" strokeDasharray="3 3"
                    label={{
                      value: "today",
                      position: "insideTopRight",
                      style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fill: "rgba(0,0,0,0.28)", letterSpacing: "0.06em" },
                    }}
                  />

                  {/* Bottom: Called It (green) */}
                  <Area type="monotone" dataKey="pct_called" name="Called it"
                    stackId="1" stroke="#16a34a" strokeWidth={1.5}
                    fill="url(#gC)" />
                  {/* Middle: Fence (gray — the collapsing band) */}
                  <Area type="monotone" dataKey="pct_fence" name="Fence"
                    stackId="1" stroke="#9ca3af" strokeWidth={1}
                    strokeDasharray="4 2" fill="url(#gF)" />
                  {/* Top: Botched (red) */}
                  <Area type="monotone" dataKey="pct_botched" name="Botched"
                    stackId="1" stroke="#dc2626" strokeWidth={1.5}
                    fill="url(#gB)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: "0.46rem",
              textTransform: "uppercase", letterSpacing: "0.1em",
              color: "rgba(0,0,0,0.2)", textAlign: "right", marginTop: 8,
            }}>
              Projected after today · based on historical convergence patterns
            </div>
          </div>
        </div>

        {/* ── 4. AI ASSESSMENT ─────────────────────────────────────────────── */}
        <div className="card" style={card()}>
          <div style={{ padding: "22px 28px 26px" }}>
            <div style={metaLabel()}>AI assessment</div>
            <div style={{ height: 18 }} />

            {PREDICTION.aiAnalysis.notes.map((note, i) => (
              <div key={note.dimension} style={{
                marginBottom: i < PREDICTION.aiAnalysis.notes.length - 1 ? 20 : 0,
              }}>
                {/* Dimension header with inline score bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: note.color, flexShrink: 0,
                  }} />
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.62rem", fontWeight: 500,
                    color: "rgba(0,0,0,0.55)", letterSpacing: "0.06em",
                    textTransform: "uppercase", flexShrink: 0,
                    minWidth: 80,
                  }}>{note.dimension}</span>
                  <ScoreBar score={note.score} color={note.color} />
                </div>

                {/* Note text — always visible */}
                <p style={{
                  fontFamily: "'Source Serif 4', Georgia, serif",
                  fontSize: "0.9rem", lineHeight: 1.68,
                  color: "rgba(0,0,0,0.54)", margin: 0,
                  paddingLeft: 19,
                  borderLeft: `2px solid ${note.color}22`,
                }}>
                  {note.text}
                </p>

                {i < PREDICTION.aiAnalysis.notes.length - 1 && (
                  <div style={{ height: 1, background: "#f0f0f0", margin: "20px 0 0" }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── 5. DISCUSSION ────────────────────────────────────────────────── */}
        <div className="card" style={card()}>
          <div style={{ padding: "22px 28px 24px" }}>
            <div style={metaLabel()}>Discussion · 0 comments</div>
            <div style={{ height: 14 }} />
            <div style={{
              borderRadius: 3, border: "1px solid rgba(0,0,0,0.07)",
              padding: "16px 18px", background: "#fafafa",
              display: "flex", alignItems: "center", justifyContent: "center", minHeight: 72,
            }}>
              <span style={{
                fontFamily: "'Source Serif 4', serif",
                fontStyle: "italic", fontSize: "0.85rem",
                color: "rgba(0,0,0,0.28)",
              }}>
                Be the first to reason out loud.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px", marginTop: 2 }}>
          <span style={metaLabel(true)}>By {PREDICTION.author} · {PREDICTION.createdAt}</span>
          <span style={metaLabel(true)}>Status: {PREDICTION.status}</span>
        </div>

      </div>
    </div>
  );
}

// ── STYLE HELPERS ─────────────────────────────────────────────────────────────
function card() {
  return {
    background: "#fff",
    borderRadius: 6,
    border: "1px solid rgba(0,0,0,0.07)",
    overflow: "hidden",
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
    marginBottom: 10,
  };
}
function metaLabel(inline = false) {
  return {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.52rem",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: "rgba(0,0,0,0.28)",
    display: inline ? "inline" : "block",
  };
}
function monoMd(extra = {}) {
  return {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.8rem",
    letterSpacing: "0.02em",
    ...extra,
  };
}