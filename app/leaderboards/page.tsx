"use client";
import { useEffect, useState } from "react";
import { getLatestLeaderboard, getAllTimeLeaderboard, type LeaderboardDoc } from "../../src/services/leaderboard-service";

function LeaderboardTable({ data }: { data: LeaderboardDoc | null }) {
  if (!data) return <div className="text-sm text-neutral-500">No data yet.</div>;
  return (
    <div className="grid gap-3">
      <div className="text-sm text-neutral-600">Updated: {data.generatedAt ? "recently" : "-"}</div>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 pr-2">Rank</th>
            <th className="py-2 pr-2">User</th>
            <th className="py-2 pr-2">Reputation</th>
            <th className="py-2 pr-2">Followers</th>
          </tr>
        </thead>
        <tbody>
          {data.top.map((e) => (
            <tr key={e.uid} className="border-b last:border-b-0">
              <td className="py-2 pr-2 w-14">{e.rank}</td>
              <td className="py-2 pr-2 flex items-center gap-2">
                {e.avatarUrl ? <img src={e.avatarUrl} className="w-6 h-6 rounded-full border" /> : <div className="w-6 h-6 rounded-full border bg-neutral-100" />}
                <span className="truncate max-w-[180px]">{e.displayName || e.uid}</span>
              </td>
              <td className="py-2 pr-2">{e.score}</td>
              <td className="py-2 pr-2">{e.followersCount ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function LeaderboardsPage() {
  const [tab, setTab] = useState<"daily" | "weekly" | "monthly" | "all-time">("daily");
  const [daily, setDaily] = useState<LeaderboardDoc | null>(null);
  const [weekly, setWeekly] = useState<LeaderboardDoc | null>(null);
  const [monthly, setMonthly] = useState<LeaderboardDoc | null>(null);
  const [alltime, setAlltime] = useState<LeaderboardDoc | null>(null);

  useEffect(() => {
    getLatestLeaderboard("daily").then(setDaily).catch(() => {});
    getLatestLeaderboard("weekly").then(setWeekly).catch(() => {});
    getLatestLeaderboard("monthly").then(setMonthly).catch(() => {});
    getAllTimeLeaderboard().then(setAlltime).catch(() => {});
  }, []);

  const data = tab === "daily" ? daily : tab === "weekly" ? weekly : tab === "monthly" ? monthly : alltime;

  return (
    <main className="mx-auto max-w-3xl p-4 grid gap-4">
      <h1 className="text-xl font-semibold">Leaderboards</h1>
      <div className="flex gap-2">
        {(["daily", "weekly", "monthly", "all-time"] as const).map((p) => (
          <button key={p} className={`text-sm px-3 py-1 rounded-md border ${tab === p ? "bg-neutral-800 text-white border-neutral-800" : "bg-white"}`} onClick={() => setTab(p)}>
            {p === "all-time" ? "All-time" : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>
      <LeaderboardTable data={data} />
    </main>
  );
}
