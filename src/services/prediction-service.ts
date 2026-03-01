import { collection, getDocs, getFirestore, limit as fsLimit, orderBy, query, startAfter, where, DocumentData, QueryConstraint, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import type { Prediction } from "../types/prediction";

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
      timebox: (data.timebox?.toDate?.()?.toISOString?.() ?? data.timebox ?? new Date().toISOString()) as string,
      taxonomy: data.taxonomy ?? { domain: "", subcategory: "", topic: "" },
      status: data.status ?? "pending",
      aiScore: data.aiScore ?? { plausibility: 5, vaguenessFlag: false, notes: [] },
      humanVotes: data.humanVotes ?? { outcome: { calledIt: 0, botched: 0, fence: 0 }, quality: { high: 0, low: 0 } },
      comments: data.comments ?? [],
      createdAt: (data.createdAt?.toDate?.() ?? new Date()) as Date,
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
};

export async function createPrediction(input: CreatePredictionInput): Promise<string> {
  const db = getFirestore();
  if (!input.summary || !input.metric || !input.operator || !input.target || !input.timeboxISO || !input.taxonomy?.domain) {
    throw new Error("Missing required fields");
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
    timebox: Timestamp.fromDate(timeboxDate),
    taxonomy: input.taxonomy,
    status: "pending",
    aiScore: { plausibility: 0, vaguenessFlag: false, notes: [] },
    humanVotes: { outcome: { calledIt: 0, botched: 0, fence: 0 }, quality: { high: 0, low: 0 } },
    comments: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}
