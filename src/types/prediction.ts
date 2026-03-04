export type PredictionStatus = "pending" | "resolved" | "disputed";

export interface Taxonomy {
  domain: string;
  subcategory: string;
  topic: string;
}

export interface AIScore {
  plausibility: number;
  vaguenessFlag: boolean;
  notes: string[];
}

export interface HumanVotes {
  outcome: { calledIt: number; botched: number; fence: number };
  quality: { high: number; low: number };
}

export interface Metric {
  metric: string;
  operator: ">" | ">=" | "<" | "<=" | "=";
  target: string;
}

export interface AIAnalysis {
  boldness: number;
  relevance: number;
  notes?: string[];
  fallbackUsed?: boolean;
}

export interface Prediction {
  id: string;
  authorId: string;
  summary: string;
  // Legacy flat fields (kept for backward compatibility in UI)
  metric: string;
  referenceValue: string;
  // New fields
  metrics?: Metric[];
  rationale?: string;
  aiAnalysis?: AIAnalysis;
  timebox: string;
  taxonomy: Taxonomy;
  status: PredictionStatus;
  aiScore: AIScore;
  humanVotes: HumanVotes;
  comments: string[];
  createdAt: Date;
  resolvedAt?: Date;
}
