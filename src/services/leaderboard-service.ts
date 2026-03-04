import { db } from "../lib/firebase-client";
import { doc, getDoc } from "firebase/firestore";

export type LeaderboardEntry = {
  uid: string;
  rank: number;
  score: number;
  displayName?: string | null;
  avatarUrl?: string | null;
  followersCount?: number;
};

export type LeaderboardDoc = {
  period: "daily" | "weekly" | "monthly" | "all-time";
  periodKey: string;
  generatedAt?: any;
  top: LeaderboardEntry[];
  totalUsers?: number;
};

export async function getLatestLeaderboard(period: "daily" | "weekly" | "monthly"): Promise<LeaderboardDoc | null> {
  const ref = doc(db, `leaderboards/${period}-latest`);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as LeaderboardDoc) : null;
}

export async function getAllTimeLeaderboard(): Promise<LeaderboardDoc | null> {
  const ref = doc(db, `leaderboards/all-time`);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as LeaderboardDoc) : null;
}
