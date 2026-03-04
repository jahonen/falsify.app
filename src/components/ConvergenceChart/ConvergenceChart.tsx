"use client";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";
import React from "react";

export type ConvergencePoint = {
  label: string;
  called: number; // 0..100
  fence: number;  // 0..100
  botched: number; // 0..100
  projected?: boolean;
};

function fmtShort(d: any) {
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return String(d ?? "");
  }
}

export function buildNaiveSeries(
  calledIt: number,
  fence: number,
  botched: number,
  startAt?: any,
  endAt?: any
): ConvergencePoint[] {
  const total = Math.max(1, calledIt + fence + botched);
  const now = {
    label: "Today",
    called: Math.round((calledIt / total) * 100),
    fence: Math.round((fence / total) * 100),
    botched: Math.round((botched / total) * 100),
    projected: false,
  } as ConvergencePoint;
  // Simple projection to close: reduce fence toward 2%, distribute remaining to called/botched by ratio
  const targetFence = 2;
  const fenceDrop = Math.max(0, now.fence - targetFence);
  const calledShare = now.called / Math.max(1, now.called + now.botched);
  const closePoint: ConvergencePoint = {
    label: endAt ? fmtShort(endAt) : "Close",
    called: Math.round(now.called + fenceDrop * calledShare),
    fence: targetFence,
    botched: Math.round(now.botched + fenceDrop * (1 - calledShare)),
    projected: true,
  };

  // A created point: typically a wider fence band at creation.
  const createdPoint: ConvergencePoint = {
    label: startAt ? fmtShort(startAt) : "Created",
    called: Math.max(0, now.called - 5),
    fence: Math.min(90, now.fence + 10),
    botched: Math.max(0, now.botched - 5),
    projected: false,
  };

  const series = [createdPoint, now, closePoint].map((p) => {
    const s = p.called + p.fence + p.botched;
    if (s !== 100) {
      // normalize to 100
      const k = 100 / s;
      return { ...p, called: Math.round(p.called * k), fence: Math.round(p.fence * k), botched: Math.round(p.botched * k) };
    }
    return p;
  });
  return series;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const proj = (payload[0]?.payload as any)?.projected;
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 4, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", minWidth: 140 }}>
      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "rgba(0,0,0,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
        {label}
        {proj && <span style={{ color: "rgba(0,0,0,0.3)", fontStyle: "italic", textTransform: "none", letterSpacing: 0 }}>projected</span>}
      </div>
      {[...payload].reverse().map((p: any) => (
        <div key={p.name} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: p.color, display: "flex", justifyContent: "space-between", gap: 20, lineHeight: 1.8 }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 600 }}>{Math.round(p.value)}%</span>
        </div>
      ))}
    </div>
  );
}

export default function ConvergenceChart({
  calledIt,
  fence,
  botched,
  history,
  height = 200,
  startAt,
  endAt,
}: {
  calledIt: number;
  fence: number;
  botched: number;
  history?: ConvergencePoint[];
  height?: number;
  startAt?: any;
  endAt?: any;
}) {
  const data = (history && history.length > 0 ? history : buildNaiveSeries(calledIt, fence, botched, startAt, endAt)).map((d) => ({
    day: d.label,
    pct_called: d.called,
    pct_fence: d.fence,
    pct_botched: d.botched,
    projected: d.projected,
  }));

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} stackOffset="expand" margin={{ top: 4, right: 0, left: -18, bottom: 0 }}>
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
          <XAxis dataKey="day" tick={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fill: 'rgba(0,0,0,0.28)', letterSpacing: '0.04em' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v: number) => `${Math.round(v)}%`} tick={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fill: 'rgba(0,0,0,0.28)' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x="Today" stroke="rgba(0,0,0,0.18)" strokeDasharray="3 3" label={{ value: "today", position: "insideTopRight", style: { fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fill: 'rgba(0,0,0,0.28)', letterSpacing: '0.06em' } }} />

          <Area type="monotone" dataKey="pct_called" name="Called" stackId="1" stroke="#16a34a" strokeWidth={1.5} fill="url(#gC)" />
          <Area type="monotone" dataKey="pct_fence" name="Fence" stackId="1" stroke="#9ca3af" strokeWidth={1} strokeDasharray="4 2" fill="url(#gF)" />
          <Area type="monotone" dataKey="pct_botched" name="Botched" stackId="1" stroke="#dc2626" strokeWidth={1.5} fill="url(#gB)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
