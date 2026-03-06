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
  // Lifecycle v1 (optional for backward compat)
  termReachedAt?: Date;
  aiResolution?: AIResolution;
  authorResolution?: AuthorResolution;
  outcome?: "calledIt" | "botched" | "fence";
  resolutionSource?: "author" | "auto-consensus" | "moderation";
  // Segmented aggregates (optional for UI v1)
  humanVotesPre?: HumanVotes;
  humanVotesPost?: HumanVotes;
  comments: string[];
  createdAt: Date;
  resolvedAt?: Date;
}

export interface AIResolutionMetric {
  name: string;
  assessment: "met" | "unmet" | "unknown";
  confidence?: number;
  note?: string;
}

export interface AIResolution {
  suggestion: "calledIt" | "botched" | "unknown";
  confidence: number;
  metricResults?: AIResolutionMetric[];
  notes?: string[];
}

export interface AuthorResolution {
  outcome: "calledIt" | "botched" | "fence";
  rationale?: string;
  evidenceUrl?: string;
  decidedBy: string; // uid
  decidedAt: Date;
}
