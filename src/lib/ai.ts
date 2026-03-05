import { getAuth } from "firebase/auth";
import { emulatorMode } from "./firebase-client";
import type { AIScore } from "../types/prediction";

export type AiScoreInput = {
  summary: string;
  metric: string;
  operator: string;
  target: string;
  referenceValue?: string;
  timeboxISO?: string;
  taxonomy?: { domain?: string; subcategory?: string; topic?: string };
};

export async function aiScore(input: AiScoreInput): Promise<AIScore> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const token = await user.getIdToken();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-falsify";
  const region = "us-central1";
  const url = emulatorMode
    ? `http://localhost:5001/${projectId}/${region}/aiScore`
    : `https://${region}-${projectId}.cloudfunctions.net/aiScore`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw new Error(`aiScore failed: ${res.status}`);
  const data = (await res.json()) as AIScore;
  return data;
}

export type MetricInput = { metric: string; operator: string; target: string };
export type AiAnalyzeInput = {
  summary: string;
  metrics: MetricInput[];
  rationale?: string;
  timeboxISO?: string;
  taxonomy?: { domain?: string; subcategory?: string; topic?: string };
};

export type AIAnalysis = { boldness: number; relevance: number; notes?: string[]; fallbackUsed?: boolean };

export async function aiAnalyze(input: AiAnalyzeInput): Promise<AIAnalysis> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const token = await user.getIdToken();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-falsify";
  const region = "us-central1";
  const url = emulatorMode
    ? `http://localhost:5001/${projectId}/${region}/aiAnalyze`
    : `https://${region}-${projectId}.cloudfunctions.net/aiAnalyze`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw new Error(`aiAnalyze failed: ${res.status}`);
  const data = (await res.json()) as AIAnalysis;
  return data;
}
