import { collection, getDocs, getFirestore, limit as fsLimit, orderBy, query, startAfter, where, DocumentData, QueryConstraint, addDoc, serverTimestamp, Timestamp, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import type { Prediction, Metric, AIResolution, AuthorResolution, HumanVotes } from "../types/prediction";
import type { AIScore } from "../types/prediction";
import type { AIAnalysis } from "../types/prediction";

export type FeedParams = {
  pageSize?: number;
  domain?: string | null;
  status?: "pending" | "resolved" | "disputed" | null;
  cursor?: DocumentData | null;
};

export type FeedResult = {
  items: Prediction[];
  nextCursor: DocumentData | null;
};

export async function listPredictions(params: FeedParams = {}): Promise<FeedResult> {
  const db = getFirestore();
  const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
  if (params.domain) {
    constraints.push(where("taxonomy.domain", "==", params.domain));
  }
  if (params.status) {
    constraints.push(where("status", "==", params.status));
  }
  constraints.push(fsLimit(params.pageSize ?? 10));
  if (params.cursor) constraints.push(startAfter(params.cursor));

  const q = query(collection(db, "predictions"), ...constraints);
  const snap = await getDocs(q);
  const items: Prediction[] = snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      authorId: data.authorId ?? "",
      summary: data.summary ?? "",
      metric: data.metric ?? "",
      referenceValue: data.referenceValue ?? "",
      metrics: (Array.isArray(data.metrics) ? data.metrics : undefined) as Metric[] | undefined,
      rationale: data.rationale ?? "",
      timebox: (data.timebox?.toDate?.()?.toISOString?.() ?? data.timebox ?? new Date().toISOString()) as string,
      taxonomy: data.taxonomy ?? { domain: "", subcategory: "", topic: "" },
      status: data.status ?? "pending",
      aiScore: data.aiScore ?? { plausibility: 5, vaguenessFlag: false, notes: [] },
      aiAnalysis: data.aiAnalysis ?? undefined,
      humanVotes: (data.humanVotes ?? { outcome: { calledIt: 0, botched: 0, fence: 0 }, quality: { high: 0, low: 0 } }) as HumanVotes,
      humanVotesPre: data.humanVotesPre as HumanVotes | undefined,
      humanVotesPost: data.humanVotesPost as HumanVotes | undefined,
      comments: data.comments ?? [],
      createdAt: (data.createdAt?.toDate?.() ?? new Date()) as Date,
      termReachedAt: data.termReachedAt ? (data.termReachedAt.toDate?.() ?? new Date(data.termReachedAt)) : undefined,
      aiResolution: (data.aiResolution as AIResolution | undefined),
      authorResolution: data.authorResolution ? ({
        ...data.authorResolution,
        decidedAt: (data.authorResolution.decidedAt?.toDate?.() ?? new Date(data.authorResolution.decidedAt))
      } as AuthorResolution) : undefined,
      outcome: data.outcome as any,
      resolutionSource: data.resolutionSource as any,
      resolvedAt: data.resolvedAt ? (data.resolvedAt.toDate?.() ?? undefined) : undefined
    } as Prediction;
  });
  const nextCursor = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
  return { items, nextCursor };
}

export type CreatePredictionInput = {
  authorId: string;
  summary: string;
  metric: string;
  operator: ">" | ">=" | "<" | "<=" | "=";
  target: string;
  referenceValue?: string;
  timeboxISO: string;
  taxonomy: { domain: string; subcategory: string; topic: string };
  aiScore?: AIScore;
  metrics?: Metric[];
  rationale?: string;
  aiAnalysis?: AIAnalysis;
};

export async function createPrediction(input: CreatePredictionInput): Promise<string> {
  const db = getFirestore();
  const hasMulti = Array.isArray(input.metrics) && input.metrics.length >= 1;
  if (!input.summary || !input.timeboxISO || !input.taxonomy?.domain) {
    throw new Error("Missing required fields");
  }
  if (!hasMulti) {
    if (!input.metric || !input.operator || !input.target) {
      throw new Error("Missing metric/operator/target");
    }
  }
  const timeboxDate = new Date(input.timeboxISO);
  if (isNaN(timeboxDate.getTime())) throw new Error("Invalid timebox date");
  const docRef = await addDoc(collection(db, "predictions"), {
    authorId: input.authorId,
    summary: input.summary,
    metric: input.metric,
    operator: input.operator,
    target: input.target,
    referenceValue: input.referenceValue ?? "",
    metrics: hasMulti ? input.metrics : undefined,
    rationale: input.rationale ?? "",
    timebox: Timestamp.fromDate(timeboxDate),
    taxonomy: input.taxonomy,
    status: "pending",
    aiScore: input.aiScore ?? { plausibility: 0, vaguenessFlag: false, notes: [] },
    aiAnalysis: input.aiAnalysis ?? undefined,
    humanVotes: { outcome: { calledIt: 0, botched: 0, fence: 0 }, quality: { high: 0, low: 0 } },
    comments: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

// Fetch a single prediction by ID for deep links (/p/[id])
export async function getPredictionById(id: string): Promise<Prediction | null> {
  try {
    const db = getFirestore();
    const ref = doc(db, "predictions", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    return {
      id,
      authorId: data.authorId ?? "",
      summary: data.summary ?? "",
      metric: data.metric ?? "",
      referenceValue: data.referenceValue ?? "",
      metrics: (Array.isArray(data.metrics) ? data.metrics : undefined),
      rationale: data.rationale ?? "",
      timebox: (data.timebox?.toDate?.()?.toISOString?.() ?? data.timebox ?? new Date().toISOString()) as string,
      taxonomy: data.taxonomy ?? { domain: "", subcategory: "", topic: "" },
      status: data.status ?? "pending",
      aiScore: data.aiScore ?? { plausibility: 5, vaguenessFlag: false, notes: [] },
      aiAnalysis: data.aiAnalysis ?? undefined,
      humanVotes: (data.humanVotes ?? { outcome: { calledIt: 0, botched: 0, fence: 0 }, quality: { high: 0, low: 0 } }) as HumanVotes,
      humanVotesPre: data.humanVotesPre as HumanVotes | undefined,
      humanVotesPost: data.humanVotesPost as HumanVotes | undefined,
      comments: data.comments ?? [],
      createdAt: (data.createdAt?.toDate?.() ?? new Date()) as Date,
      termReachedAt: data.termReachedAt ? (data.termReachedAt.toDate?.() ?? new Date(data.termReachedAt)) : undefined,
      aiResolution: (data.aiResolution as AIResolution | undefined),
      authorResolution: data.authorResolution ? ({
        ...data.authorResolution,
        decidedAt: (data.authorResolution.decidedAt?.toDate?.() ?? new Date(data.authorResolution.decidedAt))
      } as AuthorResolution) : undefined,
      outcome: data.outcome as any,
      resolutionSource: data.resolutionSource as any,
      resolvedAt: data.resolvedAt ? (data.resolvedAt.toDate?.() ?? undefined) : undefined
    } as Prediction;
  } catch {
    return null;
  }
}

// Author accepts the AI suggestion as final outcome
export async function acceptAiSuggestion(predictionId: string): Promise<void> {
  const db = getFirestore();
  const ref = doc(db, "predictions", predictionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Prediction not found");
  const data = snap.data() as any;
  const ai = data.aiResolution as AIResolution | undefined;
  if (!ai) throw new Error("AI suggestion not available yet");
  const outcome = ai.suggestion === "calledIt" ? "calledIt" : ai.suggestion === "botched" ? "botched" : "fence";
  const auth = getAuth();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Sign in required");
  const authorResolution: AuthorResolution = {
    outcome,
    decidedBy: uid,
    decidedAt: new Date()
  };
  await setDoc(ref, {
    authorResolution: {
      ...authorResolution,
      decidedAt: serverTimestamp()
    },
    outcome,
    resolutionSource: "author",
    status: "resolved",
    resolvedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

// Author sets an explicit outcome (override)
export async function setOutcome(predictionId: string, outcome: "calledIt" | "botched" | "fence", rationale?: string, evidenceUrl?: string): Promise<void> {
  const db = getFirestore();
  const ref = doc(db, "predictions", predictionId);
  const auth = getAuth();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Sign in required");
  const authorResolution: AuthorResolution = {
    outcome,
    rationale,
    evidenceUrl,
    decidedBy: uid,
    decidedAt: new Date()
  };
  await setDoc(ref, {
    authorResolution: {
      ...authorResolution,
      decidedAt: serverTimestamp()
    },
    outcome,
    resolutionSource: "author",
    status: "resolved",
    resolvedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}
