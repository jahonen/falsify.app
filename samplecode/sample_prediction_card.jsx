import { useState } from "react";

const PREDICTION = {
  id: "pred_001",
  author: "epistemix",
  authorAvatar: "E",
  taxonomy: "Macroeconomics",
  summary: "The Fed will pivot to rate cuts before inflation hits the 2% target, sacrificing credibility for liquidity.",
  rationale:
    "Historical precedent shows central banks capitulate to equity market pressure. The 2024 election cycle creates political surface area that makes a premature cut more likely than the Fed's stated patience.",
  timebox: { start: "Jan 2025", end: "Dec 2025" },
  boldness: 78,
  relevance: 91,
  metrics: [
    { id: 1, label: "Fed Funds Rate", operator: "<=", threshold: "4.50%", unit: "by Q3 2025" },
    { id: 2, label: "Core PCE at time of cut", operator: ">", threshold: "2.4%", unit: "YoY" },
    { id: 3, label: "S&P 500 drawdown trigger", operator: ">=", threshold: "12%", unit: "from ATH" },
  ],
  votes: { calledIt: 412, botched: 188, fence: 97 },
  comments: [
    {
      id: 1,
      author: "epistemix",
      isOP: true,
      body: "Updating: PCE came in at 2.6% for Feb. Metric 2 still active. No cut yet but swaps are pricing one in June.",
      time: "3 days ago",
    },
    {
      id: 2,
      author: "null_hypo",
      isOP: false,
      body: "The 12% drawdown threshold is doing a lot of work here. You're basically predicting a Fed put at a specific strike. Testable but the causal chain is underspecified.",
      time: "5 days ago",
    },
    {
      id: 3,
      author: "rate_witch",
      isOP: false,
      body: "Voted Called It. Powell's language at the last presser was textbook pre-pivot softening.",
      time: "1 week ago",
    },
    {
      id: 4,
      author: "bayes_or_bust",
      isOP: false,
      body: "Where's the falsification condition? You need a clause: if they cut AND PCE is below 2.4%, this prediction is wrong. As written it's almost unfalsifiable.",
      time: "1 week ago",
    },
  ],
};

const TAXONOMY_COLORS = {
  Macroeconomics: "#f0c040",
  Technology: "#40c0f0",
  Geopolitics: "#f06060",
  Science: "#60f0a0",
  Culture: "#c060f0",
};

const MiniVoteBar = ({ calledIt, botched, fence }) => {
  const total = calledIt + botched + fence;
  const pct = (v) => Math.round((v / total) * 100);
  return (
    <div style={{ display: "flex", height: "4px", borderRadius: "2px", overflow: "hidden", gap: "1px" }}>
      <div style={{ width: `${pct(calledIt)}%`, background: "#34d399" }} />
      <div style={{ width: `${pct(botched)}%`, background: "#f87171" }} />
      <div style={{ width: `${pct(fence)}%`, background: "#60a5fa" }} />
    </div>
  );
};

const ScoreMeter = ({ label, value, color }) => {
  const segments = 10;
  const filled = Math.round((value / 100) * segments);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#6b7280", textTransform: "uppercase" }}>
          {label}
        </span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "18px", fontWeight: 700, color }}>{value}</span>
      </div>
      <div style={{ display: "flex", gap: "3px" }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: "6px", borderRadius: "2px",
            background: i < filled ? color : "#1e2533",
            transition: "background 0.3s",
            boxShadow: i < filled ? `0 0 6px ${color}60` : "none",
          }} />
        ))}
      </div>
    </div>
  );
};

const MetricRow = ({ metric }) => (
  <div style={{
    display: "grid", gridTemplateColumns: "1fr auto auto 1fr", alignItems: "center",
    gap: "10px", padding: "10px 14px", background: "#0d1117",
    borderRadius: "6px", border: "1px solid #1e2533",
  }}>
    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#9ca3af" }}>{metric.label}</span>
    <span style={{
      fontFamily: "'DM Mono', monospace", fontSize: "14px", fontWeight: 700, color: "#f0c040",
      background: "#f0c04012", padding: "2px 8px", borderRadius: "4px", border: "1px solid #f0c04030",
    }}>{metric.operator}</span>
    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "14px", fontWeight: 700, color: "#e2e8f0" }}>{metric.threshold}</span>
    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#4b5563", textAlign: "right" }}>{metric.unit}</span>
  </div>
);

const VoteBar = ({ calledIt, botched, fence }) => {
  const total = calledIt + botched + fence;
  const pct = (v) => Math.round((v / total) * 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", height: "8px", borderRadius: "4px", overflow: "hidden", gap: "2px" }}>
        <div style={{ width: `${pct(calledIt)}%`, background: "#34d399", transition: "width 0.6s ease" }} />
        <div style={{ width: `${pct(botched)}%`, background: "#f87171", transition: "width 0.6s ease" }} />
        <div style={{ width: `${pct(fence)}%`, background: "#60a5fa", transition: "width 0.6s ease" }} />
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        {[
          { label: "Called It", count: calledIt, color: "#34d399", bg: "#34d39915", border: "#34d39940", emoji: "🎯" },
          { label: "Botched", count: botched, color: "#f87171", bg: "#f8717115", border: "#f8717140", emoji: "💀" },
          { label: "On the Fence", count: fence, color: "#60a5fa", bg: "#60a5fa15", border: "#60a5fa40", emoji: "🤷" },
        ].map(({ label, count, color, bg, border, emoji }) => (
          <button key={label} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
            padding: "10px 6px", background: bg, border: `1px solid ${border}`,
            borderRadius: "8px", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 20px ${border}`; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <span style={{ fontSize: "16px" }}>{emoji}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "16px", fontWeight: 700, color }}>{count}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const Comment = ({ comment }) => (
  <div style={{ display: "flex", gap: "12px", padding: "14px 0", borderBottom: "1px solid #1e2533" }}>
    <div style={{ flexShrink: 0 }}>
      <div style={{
        width: "32px", height: "32px", borderRadius: "50%",
        background: comment.isOP ? "#f0c04020" : "#1e2533",
        border: comment.isOP ? "1.5px solid #f0c040" : "1.5px solid #374151",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Mono', monospace", fontSize: "12px", fontWeight: 700,
        color: comment.isOP ? "#f0c040" : "#6b7280",
      }}>
        {comment.author[0].toUpperCase()}
      </div>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", fontWeight: 700, color: comment.isOP ? "#f0c040" : "#9ca3af" }}>
          {comment.author}
        </span>
        {comment.isOP && (
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.12em",
            color: "#f0c040", background: "#f0c04015", border: "1px solid #f0c04040",
            borderRadius: "3px", padding: "1px 6px",
          }}>OP</span>
        )}
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#374151", marginLeft: "auto" }}>{comment.time}</span>
      </div>
      <p style={{ margin: 0, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "13px", lineHeight: 1.6, color: "#9ca3af" }}>
        {comment.body}
      </p>
    </div>
  </div>
);

function Divider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#4b5563", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: "1px", background: "#1e2533" }} />
    </div>
  );
}

export default function PredictionCard() {
  const [p] = useState(PREDICTION);
  const [expanded, setExpanded] = useState(false);
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const taxColor = TAXONOMY_COLORS[p.taxonomy] || "#9ca3af";
  const total = p.votes.calledIt + p.votes.botched + p.votes.fence;
  const leadingVote = p.votes.calledIt > p.votes.botched ? "Called It" : "Botched";
  const leadingPct = Math.round((Math.max(p.votes.calledIt, p.votes.botched) / total) * 100);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=IBM+Plex+Serif:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { background: #080c12; margin: 0; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; padding: 60px 16px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes expandIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes accordionDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        .pred-outer { animation: fadeUp 0.45s ease both; }
        .expanded-body { animation: expandIn 0.3s ease both; }
        .discussion-body { animation: accordionDown 0.25s ease both; }
      `}</style>

      <div className="pred-outer" style={{ width: "100%", maxWidth: "640px", fontFamily: "'IBM Plex Sans', sans-serif" }}>

        {!expanded ? (
          /* ── COLLAPSED ── */
          <div
            onClick={() => setExpanded(true)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              background: "#10151e",
              border: `1px solid ${hovered ? "#2e3a4e" : "#1e2533"}`,
              borderRadius: "12px",
              overflow: "hidden",
              cursor: "pointer",
              boxShadow: hovered
                ? "0 12px 48px rgba(0,0,0,0.5), 0 0 0 1px #ffffff06 inset"
                : "0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px #ffffff04 inset",
              transform: hovered ? "translateY(-2px)" : "none",
              transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
            }}
          >
            {/* Top strip */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 16px", background: "#0d1117", borderBottom: "1px solid #1e2533",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em",
                  textTransform: "uppercase", color: taxColor, background: `${taxColor}15`,
                  border: `1px solid ${taxColor}40`, borderRadius: "4px", padding: "2px 7px",
                }}>{p.taxonomy}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#374151" }}>·</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#4b5563" }}>
                  {p.timebox.start} → {p.timebox.end}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d39980" }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.12em", color: "#34d399", textTransform: "uppercase" }}>
                  Falsifiable
                </span>
              </div>
            </div>

            <div style={{ padding: "18px 20px 16px" }}>
              <p style={{
                margin: "0 0 14px", fontFamily: "'IBM Plex Serif', serif",
                fontSize: "16px", fontWeight: 600, lineHeight: 1.4,
                color: "#e2e8f0", letterSpacing: "-0.01em",
              }}>{p.summary}</p>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  background: "#f8717115", border: "1px solid #f8717140",
                  borderRadius: "20px", padding: "4px 10px",
                }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#f87171", textTransform: "uppercase" }}>Bold</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", fontWeight: 700, color: "#f87171" }}>{p.boldness}</span>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  background: "#60a5fa15", border: "1px solid #60a5fa40",
                  borderRadius: "20px", padding: "4px 10px",
                }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#60a5fa", textTransform: "uppercase" }}>Rel</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", fontWeight: 700, color: "#60a5fa" }}>{p.relevance}</span>
                </div>
                <div style={{ flex: 1 }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#4b5563" }}>
                  {leadingPct}% {leadingVote} · {total} votes
                </span>
              </div>

              <MiniVoteBar {...p.votes} />

              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "6px", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #1e2533",
              }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#374151" }}>
                  {p.metrics.length} conditions · {p.comments.length} comments
                </span>
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: "11px",
                  color: hovered ? taxColor : "#374151",
                  transition: "color 0.2s",
                }}>▾</span>
              </div>
            </div>
          </div>

        ) : (
          /* ── EXPANDED ── */
          <div
            className="expanded-body"
            style={{
              background: "#10151e",
              border: "1px solid #1e2533",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px #ffffff08 inset",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 20px", background: "#0d1117", borderBottom: "1px solid #1e2533",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em",
                  textTransform: "uppercase", color: taxColor, background: `${taxColor}15`,
                  border: `1px solid ${taxColor}40`, borderRadius: "4px", padding: "3px 8px",
                }}>{p.taxonomy}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#374151" }}>·</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#4b5563" }}>
                  {p.timebox.start} → {p.timebox.end}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: "#f0c04020", border: "1.5px solid #f0c04060",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'DM Mono', monospace", fontSize: "11px", fontWeight: 700, color: "#f0c040",
                  }}>{p.authorAvatar}</div>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#6b7280" }}>@{p.author}</span>
                </div>
                <button
                  onClick={() => { setExpanded(false); setDiscussionOpen(false); }}
                  style={{
                    background: "transparent", border: "1px solid #1e2533", borderRadius: "4px",
                    padding: "3px 8px", cursor: "pointer", color: "#374151",
                    fontFamily: "'DM Mono', monospace", fontSize: "10px",
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#374151"; e.currentTarget.style.color = "#9ca3af"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e2533"; e.currentTarget.style.color = "#374151"; }}
                >▴ collapse</button>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "24px 24px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#34d399", boxShadow: "0 0 10px #34d39980" }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.16em", color: "#34d399", textTransform: "uppercase" }}>
                  Falsifiable · {p.metrics.length} testable conditions
                </span>
              </div>

              <h2 style={{
                margin: "0 0 18px", fontFamily: "'IBM Plex Serif', serif",
                fontSize: "20px", fontWeight: 600, lineHeight: 1.35,
                color: "#e2e8f0", letterSpacing: "-0.01em",
              }}>{p.summary}</h2>

              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px",
                padding: "16px", background: "#0d1117",
                borderRadius: "8px", border: "1px solid #1e2533", marginBottom: "20px",
              }}>
                <ScoreMeter label="Boldness" value={p.boldness} color="#f87171" />
                <ScoreMeter label="Relevance" value={p.relevance} color="#60a5fa" />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <Divider label="Falsification Criteria" />
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {p.metrics.map((m) => <MetricRow key={m.id} metric={m} />)}
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <Divider label="Rationale" />
                <p style={{
                  margin: 0, fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: "14px", lineHeight: 1.7, color: "#6b7280", fontStyle: "italic",
                  borderLeft: "2px solid #1e2533", paddingLeft: "14px",
                }}>{p.rationale}</p>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <Divider label="Verdict" />
                <VoteBar {...p.votes} />
              </div>
            </div>

            {/* Discussion accordion trigger */}
            <button
              onClick={() => setDiscussionOpen(!discussionOpen)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 24px", background: "transparent", border: "none",
                borderTop: "1px solid #1e2533", cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#0d1117"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#4b5563" }}>
                  Discussion
                </span>
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: "9px",
                  color: "#34d399", background: "#34d39915", border: "1px solid #34d39940",
                  borderRadius: "10px", padding: "1px 7px",
                }}>{p.comments.length}</span>
              </div>
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#374151",
                display: "inline-block",
                transform: discussionOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.25s ease",
              }}>▾</span>
            </button>

            {/* Discussion body */}
            {discussionOpen && (
              <div className="discussion-body" style={{ padding: "0 24px 24px" }}>
                {p.comments.map((c) => <Comment key={c.id} comment={c} />)}
                <div style={{
                  marginTop: "16px", padding: "12px",
                  background: "#0d1117", border: "1px solid #1e2533",
                  borderRadius: "8px", display: "flex", gap: "10px", alignItems: "center",
                }}>
                  <input
                    placeholder="Add a falsifiable objection..."
                    style={{
                      flex: 1, background: "transparent", border: "none", outline: "none",
                      fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "13px", color: "#9ca3af",
                    }}
                  />
                  <button style={{
                    fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.1em",
                    textTransform: "uppercase", color: "#f0c040", background: "#f0c04015",
                    border: "1px solid #f0c04040", borderRadius: "4px", padding: "6px 12px",
                    cursor: "pointer", flexShrink: 0,
                  }}>Post</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}