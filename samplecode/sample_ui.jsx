import { useState } from "react";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');`;

const styles = `
  ${FONT_IMPORT}

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #080A10;
    --surface: #0F1118;
    --surface2: #161A26;
    --surface3: #1E2235;
    --border: rgba(255,255,255,0.07);
    --border-bright: rgba(255,255,255,0.14);
    --text: #E4E8F0;
    --muted: #5A6278;
    --faint: #2A2F45;
    --ai: #3B82F6;
    --ai-dim: rgba(59,130,246,0.12);
    --ai-glow: rgba(59,130,246,0.3);
    --human: #10B981;
    --human-dim: rgba(16,185,129,0.12);
    --pending: #F59E0B;
    --pending-dim: rgba(245,158,11,0.12);
    --resolved: #10B981;
    --botched: #EF4444;
    --botched-dim: rgba(239,68,68,0.12);
    --accent: #7C6AF7;
    --accent-dim: rgba(124,106,247,0.15);
  }

  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }

  .app {
    display: grid;
    grid-template-columns: 220px 1fr 280px;
    grid-template-rows: 56px 1fr;
    height: 100vh;
    overflow: hidden;
  }

  /* TOPBAR */
  .topbar {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    padding: 0 24px;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    gap: 32px;
    z-index: 10;
  }
  .logo {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 20px;
    letter-spacing: -0.5px;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .logo-mark {
    width: 24px; height: 24px;
    background: linear-gradient(135deg, var(--accent), var(--ai));
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; color: white; font-weight: 700;
  }
  .topbar-search {
    flex: 1;
    max-width: 400px;
    margin-left: auto;
  }
  .search-input {
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 7px 14px 7px 36px;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s;
  }
  .search-input:focus { border-color: var(--border-bright); }
  .search-wrap { position: relative; }
  .search-icon {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    color: var(--muted); font-size: 14px;
  }
  .topbar-right {
    display: flex; align-items: center; gap: 12px; margin-left: 24px;
  }
  .avatar {
    width: 30px; height: 30px; border-radius: 50%;
    background: linear-gradient(135deg, #7C6AF7, #3B82F6);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 600; color: white; cursor: pointer;
    font-family: 'Syne', sans-serif;
  }
  .btn-new {
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 7px;
    padding: 6px 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.15s;
    display: flex; align-items: center; gap: 6px;
  }
  .btn-new:hover { opacity: 0.85; transform: translateY(-1px); }

  /* SIDEBAR */
  .sidebar {
    background: var(--bg);
    border-right: 1px solid var(--border);
    padding: 20px 0;
    overflow-y: auto;
  }
  .nav-section-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.2px;
    color: var(--muted);
    padding: 0 16px 8px;
    text-transform: uppercase;
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 16px;
    cursor: pointer;
    border-radius: 0;
    font-size: 13.5px;
    color: var(--muted);
    transition: color 0.15s, background 0.15s;
    position: relative;
  }
  .nav-item:hover { color: var(--text); background: var(--surface); }
  .nav-item.active { color: var(--text); background: var(--surface2); }
  .nav-item.active::before {
    content: '';
    position: absolute; left: 0; top: 0; bottom: 0;
    width: 2px; background: var(--accent);
  }
  .nav-badge {
    margin-left: auto;
    background: var(--surface3);
    color: var(--muted);
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    font-family: 'Space Mono', monospace;
  }
  .nav-divider { height: 1px; background: var(--border); margin: 12px 16px; }

  .domain-list { padding: 0 0 12px; }
  .domain-item {
    display: flex; align-items: center; gap: 8px;
    padding: 7px 16px;
    font-size: 12.5px;
    color: var(--muted);
    cursor: pointer;
    transition: color 0.15s;
  }
  .domain-item:hover { color: var(--text); }
  .domain-dot {
    width: 7px; height: 7px; border-radius: 50%;
    flex-shrink: 0;
  }

  /* MAIN */
  .main {
    overflow-y: auto;
    padding: 0;
    background: var(--bg);
  }
  .feed-header {
    padding: 20px 24px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky; top: 0;
    background: var(--bg);
    z-index: 5;
    border-bottom: 1px solid var(--border);
    padding-bottom: 0;
  }
  .feed-tabs {
    display: flex; gap: 0;
  }
  .feed-tab {
    padding: 14px 18px;
    font-size: 13px;
    color: var(--muted);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.15s;
    font-weight: 500;
  }
  .feed-tab.active { color: var(--text); border-bottom-color: var(--accent); }
  .feed-controls {
    display: flex; gap: 8px; align-items: center;
    padding-bottom: 14px;
  }
  .filter-btn {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 5px 11px;
    color: var(--muted);
    font-size: 12px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.15s;
    display: flex; align-items: center; gap: 5px;
  }
  .filter-btn:hover { color: var(--text); border-color: var(--border-bright); }
  .filter-btn.active { color: var(--text); background: var(--surface3); border-color: var(--border-bright); }

  .feed-body { padding: 16px 24px; display: flex; flex-direction: column; gap: 10px; }

  /* PREDICTION CARD */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 18px 20px;
    transition: border-color 0.2s, transform 0.15s;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  .card:hover { border-color: var(--border-bright); transform: translateY(-1px); }
  .card-header {
    display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px;
  }
  .card-author-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    flex-shrink: 0;
    font-size: 11px; font-weight: 600; color: white;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif;
  }
  .card-meta { flex: 1; min-width: 0; }
  .card-author-name {
    font-size: 12.5px; font-weight: 500; color: var(--text);
    display: flex; align-items: center; gap: 8px;
  }
  .card-time { color: var(--muted); font-size: 11.5px; font-weight: 400; }
  .card-taxonomy {
    display: flex; gap: 5px; flex-wrap: wrap; margin-top: 5px;
  }
  .chip {
    background: var(--surface3);
    color: var(--muted);
    font-size: 10.5px;
    padding: 2px 8px;
    border-radius: 20px;
    border: 1px solid var(--border);
  }
  .card-summary {
    font-size: 15px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--text);
    margin-bottom: 12px;
    font-family: 'DM Sans', sans-serif;
  }
  .card-metric {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 14px;
    display: flex; align-items: center; gap: 12px;
  }
  .metric-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.8px; }
  .metric-value {
    font-family: 'Space Mono', monospace;
    font-size: 13px;
    color: var(--pending);
  }
  .metric-ref {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: var(--muted);
  }
  .metric-divider { width: 1px; height: 28px; background: var(--border); }
  .card-footer {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  }

  /* STATUS */
  .status-pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
    font-family: 'Space Mono', monospace;
  }
  .status-pending { background: var(--pending-dim); color: var(--pending); }
  .status-resolved { background: var(--human-dim); color: var(--resolved); }
  .status-botched { background: var(--botched-dim); color: var(--botched); }

  .status-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

  /* AI BADGE */
  .ai-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: var(--ai-dim);
    border: 1px solid rgba(59,130,246,0.2);
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 11px;
    color: var(--ai);
    font-family: 'Space Mono', monospace;
  }
  .ai-badge-label { font-size: 9px; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.5px; }

  .timebox {
    margin-left: auto;
    font-size: 11.5px;
    color: var(--muted);
    display: flex; align-items: center; gap: 4px;
  }

  /* VOTE SECTION */
  .vote-row {
    display: flex; align-items: center; gap: 6px;
    padding: 12px 20px;
    border-top: 1px solid var(--border);
    background: var(--surface);
    margin: 0 -1px -1px;
    border-radius: 0 0 12px 12px;
  }
  .vote-btn {
    display: flex; align-items: center; gap: 5px;
    padding: 5px 12px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
    color: var(--muted);
  }
  .vote-btn:hover { border-color: var(--border-bright); color: var(--text); }
  .vote-btn.called:hover, .vote-btn.called.active { background: var(--human-dim); border-color: var(--human); color: var(--human); }
  .vote-btn.botched:hover, .vote-btn.botched.active { background: var(--botched-dim); border-color: var(--botched); color: var(--botched); }
  .vote-btn.fence:hover, .vote-btn.fence.active { background: var(--pending-dim); border-color: var(--pending); color: var(--pending); }
  .vote-count {
    font-family: 'Space Mono', monospace;
    font-size: 10.5px;
  }
  .vote-bar { display: flex; height: 3px; border-radius: 2px; overflow: hidden; flex: 1; gap: 1px; margin-left: 8px; }
  .vote-seg { height: 100%; border-radius: 1px; transition: flex 0.3s ease; }

  /* RIGHT PANEL */
  .right-panel {
    background: var(--bg);
    border-left: 1px solid var(--border);
    padding: 20px 18px;
    overflow-y: auto;
    display: flex; flex-direction: column; gap: 24px;
  }
  .panel-section-title {
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: var(--muted);
    margin-bottom: 12px;
  }
  .stat-row {
    display: flex; justify-content: space-between; align-items: baseline;
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
  }
  .stat-row:last-child { border-bottom: none; }
  .stat-label { font-size: 12.5px; color: var(--muted); }
  .stat-value {
    font-family: 'Space Mono', monospace;
    font-size: 13px;
    color: var(--text);
  }
  .stat-value.up { color: var(--human); }
  .stat-value.warn { color: var(--pending); }

  .leaderboard-item {
    display: flex; align-items: center; gap: 10px; padding: 8px 0;
    border-bottom: 1px solid var(--border);
  }
  .leaderboard-item:last-child { border-bottom: none; }
  .lb-rank {
    font-family: 'Space Mono', monospace;
    font-size: 10px; color: var(--muted); width: 16px; text-align: right;
  }
  .lb-avatar {
    width: 26px; height: 26px; border-radius: 50%;
    font-size: 10px; font-weight: 600; color: white;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif;
    flex-shrink: 0;
  }
  .lb-name { font-size: 12.5px; color: var(--text); flex: 1; }
  .lb-score { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--human); }

  /* TRENDING */
  .trending-item {
    padding: 10px 0; border-bottom: 1px solid var(--border);
    cursor: pointer;
  }
  .trending-item:last-child { border-bottom: none; }
  .trending-summary { font-size: 12.5px; color: var(--text); line-height: 1.4; margin-bottom: 5px; }
  .trending-meta { display: flex; gap: 8px; align-items: center; }
  .trend-chip {
    font-size: 10px; padding: 1px 7px; border-radius: 10px;
    background: var(--surface2); color: var(--muted);
    border: 1px solid var(--border);
    font-family: 'Space Mono', monospace;
  }

  /* MODAL */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 100;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
  }
  .modal {
    background: var(--surface);
    border: 1px solid var(--border-bright);
    border-radius: 16px;
    width: 560px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 28px;
    position: relative;
  }
  .modal-title {
    font-family: 'Syne', sans-serif;
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 6px;
  }
  .modal-subtitle { font-size: 13px; color: var(--muted); margin-bottom: 24px; }
  .form-group { margin-bottom: 18px; }
  .form-label {
    display: block; font-size: 12px; font-weight: 500; color: var(--muted);
    text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 7px;
  }
  .form-input, .form-select {
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 14px;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
    appearance: none;
  }
  .form-input:focus, .form-select:focus { border-color: var(--accent); }
  .form-input::placeholder { color: var(--muted); }
  .char-count { text-align: right; font-size: 11px; color: var(--muted); margin-top: 5px; font-family: 'Space Mono', monospace; }
  .metric-row { display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; align-items: center; }
  .metric-op {
    background: var(--surface3); border: 1px solid var(--border);
    border-radius: 6px; padding: 9px 14px; color: var(--ai);
    font-family: 'Space Mono', monospace; font-size: 14px; text-align: center;
  }
  .ai-feedback-box {
    background: var(--ai-dim);
    border: 1px solid rgba(59,130,246,0.2);
    border-radius: 10px;
    padding: 14px;
    margin-bottom: 18px;
  }
  .ai-feedback-header {
    display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
    font-size: 11px; color: var(--ai); text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;
  }
  .ai-score-big {
    font-family: 'Space Mono', monospace;
    font-size: 28px; color: var(--ai); font-weight: 700;
    display: inline-block;
  }
  .ai-score-denom { font-size: 14px; color: var(--muted); }
  .ai-notes { font-size: 12.5px; color: var(--muted); line-height: 1.5; margin-top: 6px; }
  .ai-warn { color: var(--pending); font-size: 12px; display: flex; align-items: center; gap: 5px; margin-top: 5px; }

  .score-bar-wrap { height: 4px; background: var(--surface3); border-radius: 2px; margin-top: 8px; }
  .score-bar-fill { height: 100%; background: linear-gradient(90deg, var(--ai), var(--accent)); border-radius: 2px; transition: width 0.5s ease; }

  .modal-actions { display: flex; gap: 10px; justify-content: flex-end; padding-top: 4px; }
  .btn-ghost {
    background: transparent; border: 1px solid var(--border);
    border-radius: 7px; padding: 9px 18px;
    color: var(--muted); font-family: 'DM Sans', sans-serif;
    font-size: 13px; cursor: pointer; transition: all 0.15s;
  }
  .btn-ghost:hover { color: var(--text); border-color: var(--border-bright); }
  .btn-primary {
    background: var(--accent); border: none;
    border-radius: 7px; padding: 9px 22px;
    color: white; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s;
  }
  .btn-primary:hover { opacity: 0.88; }

  .progress-steps { display: flex; gap: 4px; margin-bottom: 24px; }
  .step { flex: 1; height: 3px; border-radius: 2px; background: var(--surface3); }
  .step.done { background: var(--accent); }
  .step.active { background: linear-gradient(90deg, var(--accent), var(--ai)); }

  .close-btn {
    position: absolute; top: 18px; right: 18px;
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 6px; width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--muted); font-size: 14px;
    transition: all 0.15s;
  }
  .close-btn:hover { color: var(--text); }

  .expanded-card {
    border-color: var(--accent) !important;
    box-shadow: 0 0 0 1px var(--accent);
  }

  .resolution-bar {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 14px;
    display: flex; align-items: center; gap: 16px;
    font-size: 12px;
  }
  .resolution-ai { color: var(--ai); font-family: 'Space Mono', monospace; font-size: 11px; }
  .resolution-human { color: var(--human); font-family: 'Space Mono', monospace; font-size: 11px; }
  .resolution-delta { color: var(--muted); font-size: 11px; }
  .res-divider { color: var(--faint); }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .card { animation: fadeIn 0.3s ease both; }
  .card:nth-child(1) { animation-delay: 0.05s; }
  .card:nth-child(2) { animation-delay: 0.1s; }
  .card:nth-child(3) { animation-delay: 0.15s; }
  .card:nth-child(4) { animation-delay: 0.2s; }
  .card:nth-child(5) { animation-delay: 0.25s; }
`;

const PREDICTIONS = [
  {
    id: 1,
    author: "MK",
    authorName: "M. Kovacs",
    authorColor: "#7C6AF7",
    time: "2h ago",
    domain: "Economy",
    topic: "GDP",
    summary: "US nominal GDP will exceed $30 trillion by end of Q4 2025, driven by continued services sector expansion.",
    metric: "US GDP",
    operator: ">",
    target: "$30T",
    reference: "$27.4T (2024)",
    timebox: "Dec 31, 2025",
    status: "pending",
    aiScore: 7.2,
    vagueness: false,
    votes: { calledIt: 34, botched: 12, fence: 8 },
    expanded: false,
  },
  {
    id: 2,
    author: "SR",
    authorName: "S. Rahman",
    authorColor: "#F59E0B",
    time: "5h ago",
    domain: "Technology",
    topic: "AI Models",
    summary: "At least one frontier AI lab will publicly report emergent deceptive behavior in a production model before mid-2026.",
    metric: "Incident reports",
    operator: "≥",
    target: "1 case",
    reference: "0 verified (2024)",
    timebox: "Jun 30, 2026",
    status: "pending",
    aiScore: 4.8,
    vagueness: true,
    votes: { calledIt: 89, botched: 41, fence: 27 },
    expanded: false,
  },
  {
    id: 3,
    author: "JL",
    authorName: "J. Lindqvist",
    authorColor: "#10B981",
    time: "1d ago",
    domain: "Climate",
    topic: "Carbon Emissions",
    summary: "EU carbon price (ETS) will fall below €50/tonne for at least 30 consecutive trading days in 2025.",
    metric: "EU ETS price",
    operator: "<",
    target: "€50/t",
    reference: "€68/t (Jan 2025)",
    timebox: "Dec 31, 2025",
    status: "resolved",
    aiScore: 6.1,
    vagueness: false,
    votes: { calledIt: 12, botched: 58, fence: 9 },
    resolution: { ai: "Botched", human: "Botched (73%)", delta: "Aligned" },
    expanded: false,
  },
  {
    id: 4,
    author: "AP",
    authorName: "A. Petrov",
    authorColor: "#EF4444",
    time: "2d ago",
    domain: "Geopolitics",
    topic: "Eastern Europe",
    summary: "Ukraine and Russia will reach a formal ceasefire agreement recognized by at least the UN Security Council before Jan 2026.",
    metric: "UNSC resolution",
    operator: "=",
    target: "1 adopted",
    reference: "0 (current)",
    timebox: "Jan 1, 2026",
    status: "pending",
    aiScore: 2.9,
    vagueness: false,
    votes: { calledIt: 18, botched: 203, fence: 44 },
    expanded: false,
  },
  {
    id: 5,
    author: "EK",
    authorName: "E. Kim",
    authorColor: "#3B82F6",
    time: "3d ago",
    domain: "Finance",
    topic: "Crypto",
    summary: "Bitcoin market cap will surpass gold ETF AUM globally within 18 months of this prediction.",
    metric: "BTC mkt cap / Gold ETF AUM",
    operator: ">",
    target: "1.0x",
    reference: "0.31x (Mar 2025)",
    timebox: "Sep 1, 2026",
    status: "pending",
    aiScore: 3.4,
    vagueness: false,
    votes: { calledIt: 56, botched: 88, fence: 31 },
    expanded: false,
  },
];

const LEADERBOARD = [
  { rank: 1, initials: "MK", color: "#7C6AF7", name: "M. Kovacs", score: "94.2" },
  { rank: 2, initials: "SR", color: "#10B981", name: "S. Rahman", score: "91.7" },
  { rank: 3, initials: "JL", color: "#F59E0B", name: "J. Lindqvist", score: "88.0" },
  { rank: 4, initials: "YO", color: "#EF4444", name: "Y. Okonkwo", score: "85.5" },
  { rank: 5, initials: "AT", color: "#3B82F6", name: "A. Tomás", score: "82.1" },
];

const DOMAINS = [
  { name: "Economy", color: "#F59E0B", count: 124 },
  { name: "Technology", color: "#3B82F6", count: 98 },
  { name: "Climate", color: "#10B981", count: 71 },
  { name: "Geopolitics", color: "#EF4444", count: 63 },
  { name: "Finance", color: "#7C6AF7", count: 55 },
  { name: "Health", color: "#06B6D4", count: 41 },
];

function getAIColor(score) {
  if (score >= 7) return "#10B981";
  if (score >= 5) return "#F59E0B";
  return "#EF4444";
}

function VoteBar({ calledIt, botched, fence }) {
  const total = calledIt + botched + fence;
  const ci = Math.round((calledIt / total) * 100);
  const b = Math.round((botched / total) * 100);
  const f = 100 - ci - b;
  return (
    <div className="vote-bar">
      <div className="vote-seg" style={{ flex: ci, background: "var(--human)", opacity: 0.7 }} />
      <div className="vote-seg" style={{ flex: b, background: "var(--botched)", opacity: 0.7 }} />
      <div className="vote-seg" style={{ flex: f, background: "var(--pending)", opacity: 0.7 }} />
    </div>
  );
}

function PredictionCard({ p, onVote, onExpand, isExpanded }) {
  const total = p.votes.calledIt + p.votes.botched + p.votes.fence;
  return (
    <div className={`card ${isExpanded ? "expanded-card" : ""}`} onClick={() => onExpand(p.id)}>
      <div className="card-header">
        <div className="card-author-avatar" style={{ background: p.authorColor }}>{p.author}</div>
        <div className="card-meta">
          <div className="card-author-name">
            {p.authorName}
            <span className="card-time">{p.time}</span>
          </div>
          <div className="card-taxonomy">
            <span className="chip">{p.domain}</span>
            <span className="chip">{p.topic}</span>
          </div>
        </div>
        <span className={`status-pill status-${p.status === "resolved" ? (p.resolution?.ai === "Botched" ? "botched" : "resolved") : "pending"}`}>
          <span className="status-dot" />
          {p.status === "resolved" ? (p.resolution?.ai === "Botched" ? "Botched" : "Called It") : "Pending"}
        </span>
      </div>

      <div className="card-summary">{p.summary}</div>

      <div className="card-metric">
        <div>
          <div className="metric-label">Metric</div>
          <div className="metric-value">{p.metric} {p.operator} {p.target}</div>
        </div>
        <div className="metric-divider" />
        <div>
          <div className="metric-label">Reference</div>
          <div className="metric-ref">{p.reference}</div>
        </div>
        <div className="metric-divider" />
        <div>
          <div className="metric-label">Timebox</div>
          <div className="metric-ref">{p.timebox}</div>
        </div>
      </div>

      <div className="card-footer">
        <div className="ai-badge" style={{ borderColor: `${getAIColor(p.aiScore)}40`, background: `${getAIColor(p.aiScore)}15`, color: getAIColor(p.aiScore) }}>
          <span className="ai-badge-label">AI</span>
          {p.aiScore}/10
        </div>
        {p.vagueness && (
          <div className="ai-badge" style={{ borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.1)", color: "var(--pending)" }}>
            ⚠ Vague metric
          </div>
        )}
        <span className="timebox">
          <span style={{ fontSize: 12 }}>◷</span>
          {p.timebox}
        </span>
      </div>

      {isExpanded && p.resolution && (
        <div className="resolution-bar" style={{ marginTop: 12 }}>
          <div className="resolution-ai">AI: {p.resolution.ai}</div>
          <span className="res-divider">|</span>
          <div className="resolution-human">Users: {p.resolution.human}</div>
          <span className="res-divider">|</span>
          <div className="resolution-delta">{p.resolution.delta}</div>
        </div>
      )}

      <div className="vote-row" onClick={e => e.stopPropagation()}>
        <button className="vote-btn called" onClick={() => onVote(p.id, "calledIt")}>
          ✓ <span className="vote-count">{p.votes.calledIt}</span>
        </button>
        <button className="vote-btn botched" onClick={() => onVote(p.id, "botched")}>
          ✗ <span className="vote-count">{p.votes.botched}</span>
        </button>
        <button className="vote-btn fence" onClick={() => onVote(p.id, "fence")}>
          ~ <span className="vote-count">{p.votes.fence}</span>
        </button>
        <VoteBar {...p.votes} />
        <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "'Space Mono', monospace", marginLeft: 4 }}>{total}</span>
      </div>
    </div>
  );
}

function NewPredictionModal({ onClose }) {
  const [step] = useState(1);
  const [summary, setSummary] = useState("");
  const [metric, setMetric] = useState("");
  const [target, setTarget] = useState("");
  const [aiScore] = useState(6.4);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>
        <div className="progress-steps">
          <div className="step done" />
          <div className="step active" />
          <div className="step" />
        </div>
        <div className="modal-title">New Prediction</div>
        <div className="modal-subtitle">State a falsifiable claim with measurable criteria.</div>

        <div className="form-group">
          <label className="form-label">Summary</label>
          <input
            className="form-input"
            placeholder="e.g. Global EV sales will exceed ICE sales by 2030..."
            value={summary}
            onChange={e => setSummary(e.target.value)}
            maxLength={140}
          />
          <div className="char-count">{summary.length}/140</div>
        </div>

        <div className="form-group">
          <label className="form-label">Metric</label>
          <div className="metric-row">
            <input
              className="form-input"
              placeholder="Indicator (e.g. EV share %)"
              value={metric}
              onChange={e => setMetric(e.target.value)}
            />
            <div className="metric-op">{">"}</div>
            <input
              className="form-input"
              placeholder="Target value"
              value={target}
              onChange={e => setTarget(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="form-group">
          <div>
            <label className="form-label">Domain</label>
            <select className="form-select">
              <option>Economy</option>
              <option>Technology</option>
              <option>Climate</option>
              <option>Geopolitics</option>
              <option>Finance</option>
              <option>Health</option>
            </select>
          </div>
          <div>
            <label className="form-label">Timebox</label>
            <input type="date" className="form-input" min="2025-03-02" />
          </div>
        </div>

        <div className="ai-feedback-box">
          <div className="ai-feedback-header">
            <span style={{ fontSize: 14 }}>◈</span>
            AI Evaluation
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span className="ai-score-big" style={{ color: getAIColor(aiScore) }}>{aiScore}</span>
            <span className="ai-score-denom">/10 plausibility</span>
          </div>
          <div className="score-bar-wrap">
            <div className="score-bar-fill" style={{ width: `${aiScore * 10}%` }} />
          </div>
          <div className="ai-notes">Based on IEA 2024 projections and historical EV adoption curves. Target is ambitious but within modeling range.</div>
          <div className="ai-warn">⚠ Specify a data source for the metric to reduce vagueness score.</div>
        </div>

        <div className="modal-actions">
          <button className="btn-ghost">Save Draft</button>
          <button className="btn-primary">Publish Prediction →</button>
        </div>
      </div>
    </div>
  );
}

export default function FalsifyApp() {
  const [predictions, setPredictions] = useState(PREDICTIONS);
  const [activeTab, setActiveTab] = useState("trending");
  const [expandedId, setExpandedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeNav, setActiveNav] = useState("feed");

  const handleVote = (predId, type) => {
    setPredictions(preds => preds.map(p => {
      if (p.id !== predId) return p;
      return { ...p, votes: { ...p.votes, [type]: p.votes[type] + 1 } };
    }));
  };

  const handleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* TOPBAR */}
        <div className="topbar">
          <div className="logo">
            <div className="logo-mark">F</div>
            Falsify
          </div>
          <div className="topbar-search">
            <div className="search-wrap">
              <span className="search-icon">⌕</span>
              <input className="search-input" placeholder="Search predictions, topics, users..." />
            </div>
          </div>
          <div className="topbar-right">
            <button className="btn-new" onClick={() => setShowModal(true)}>
              + New Prediction
            </button>
            <div className="avatar">JK</div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="sidebar">
          <div style={{ marginBottom: 16 }}>
            {[
              { id: "feed", icon: "⊞", label: "Feed", badge: null },
              { id: "mine", icon: "◎", label: "My Predictions", badge: "12" },
              { id: "voted", icon: "✓", label: "Voted On", badge: "48" },
              { id: "watchlist", icon: "◈", label: "Watchlist", badge: "7" },
            ].map(item => (
              <div
                key={item.id}
                className={`nav-item ${activeNav === item.id ? "active" : ""}`}
                onClick={() => setActiveNav(item.id)}
              >
                <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{item.icon}</span>
                {item.label}
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </div>
            ))}
          </div>

          <div className="nav-divider" />

          <div style={{ padding: "0 0 8px" }}>
            <div className="nav-section-label">Domains</div>
            {DOMAINS.map(d => (
              <div key={d.name} className="domain-item">
                <div className="domain-dot" style={{ background: d.color }} />
                {d.name}
                <span style={{ marginLeft: "auto", fontSize: 10, fontFamily: "'Space Mono', monospace", color: "var(--muted)" }}>{d.count}</span>
              </div>
            ))}
          </div>

          <div className="nav-divider" />

          <div style={{ padding: "0" }}>
            {[
              { id: "analytics", icon: "▦", label: "Analytics" },
              { id: "settings", icon: "◎", label: "Settings" },
            ].map(item => (
              <div key={item.id} className="nav-item" onClick={() => setActiveNav(item.id)}>
                <span style={{ fontSize: 13, width: 18, textAlign: "center" }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* MAIN FEED */}
        <div className="main">
          <div className="feed-header">
            <div className="feed-tabs">
              {["trending", "recent", "closing soon", "resolved"].map(tab => (
                <div
                  key={tab}
                  className={`feed-tab ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                  style={{ textTransform: "capitalize" }}
                >
                  {tab}
                </div>
              ))}
            </div>
            <div className="feed-controls">
              {["All", "Economy", "Tech", "Climate"].map(f => (
                <button key={f} className={`filter-btn ${f === "All" ? "active" : ""}`}>{f}</button>
              ))}
            </div>
          </div>

          <div className="feed-body">
            {predictions.map(p => (
              <PredictionCard
                key={p.id}
                p={p}
                onVote={handleVote}
                onExpand={handleExpand}
                isExpanded={expandedId === p.id}
              />
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          <div>
            <div className="panel-section-title">Platform Stats</div>
            {[
              { label: "Active Predictions", value: "1,842", style: "" },
              { label: "Resolved Today", value: "+14", style: "up" },
              { label: "Avg AI Score", value: "5.8/10", style: "" },
              { label: "Disputed", value: "23", style: "warn" },
              { label: "AI/Human Aligned", value: "78%", style: "up" },
            ].map(s => (
              <div key={s.label} className="stat-row">
                <span className="stat-label">{s.label}</span>
                <span className={`stat-value ${s.style}`}>{s.value}</span>
              </div>
            ))}
          </div>

          <div>
            <div className="panel-section-title">Top Forecasters</div>
            {LEADERBOARD.map(l => (
              <div key={l.rank} className="leaderboard-item">
                <span className="lb-rank">#{l.rank}</span>
                <div className="lb-avatar" style={{ background: l.color }}>{l.initials}</div>
                <span className="lb-name">{l.name}</span>
                <span className="lb-score">{l.score}</span>
              </div>
            ))}
          </div>

          <div>
            <div className="panel-section-title">Closing Soon</div>
            {predictions.filter(p => p.status === "pending").slice(0, 3).map(p => (
              <div key={p.id} className="trending-item">
                <div className="trending-summary">{p.summary.substring(0, 72)}...</div>
                <div className="trending-meta">
                  <span className="trend-chip">{p.domain}</span>
                  <span className="trend-chip" style={{ color: "var(--pending)", borderColor: "rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.08)" }}>{p.timebox}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showModal && <NewPredictionModal onClose={() => setShowModal(false)} />}
      </div>
    </>
  );
}