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

export interface Prediction {
  id: string;
  authorId: string;
  summary: string;
  metric: string;
  referenceValue: string;
  timebox: string;
  taxonomy: Taxonomy;
  status: PredictionStatus;
  aiScore: AIScore;
  humanVotes: HumanVotes;
  comments: string[];
  createdAt: Date;
  resolvedAt?: Date;
}
