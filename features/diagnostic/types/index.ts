import type { Lang } from "@/lib/i18n/config";

export type MiraChapter = "MORNING" | "MIDDAY" | "EVENING" | "INNER_VOICE" | "COMPLETE" | "SAFETY";

export type MiraSafety = {
  level: "routine" | "urgent";
  flags: string[];
};

export type MiraAttemptState = {
  consumed: number;
  max: number;
  remaining: number;
  isLastAttempt: boolean;
  blocked: boolean;
};

export type MiraAssessmentResult = {
  assessment_complete: boolean;
  recommended_pathway: string;
  match_strength: "LOW" | "MODERATE" | "HIGH";
  condition_scores: Record<string, number>;
  supporting_features: string[];
  contradictory_features: string[];
  /** Attention/restlessness described only inside high or low phases: reported, but not counted for ADHD. */
  overlapping_with_mood_episodes?: string[];
  other_signals: string[];
  missing_information: string[];
  /** Display name of each feature key above, in the session language (sent by Mira). */
  feature_labels?: Record<string, string>;
  /** Orientation percentage per area, 0-100 (ADHD / BIPOLAR / PSYCHOSIS). */
  orientation_percentages?: Record<string, number>;
  safety: MiraSafety;
  recommended_test?: string | null;
  requires_clinician_review: boolean;
  orientation: string;
  disclaimer: string;
  language: Lang;
};

export type MiraMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  chapter?: MiraChapter;
  createdAt: string;
  /** The reply is still being written: text grows as it arrives. */
  streaming?: boolean;
  /** An unfinished reply that was kept (stopped by the visitor, or cut short by the connection). */
  partial?: "stopped" | "interrupted";
  /** Stable React key: a streamed reply keeps it from its first word to its final form. */
  renderKey?: string;
  /** Mira could not read the visitor's message as an answer: it did not count and the question stays open. */
  notice?: "unreadable";
  /** The visitor's message that Mira did not count. */
  notCounted?: boolean;
};

export type ChatOption = {
  id: string;
  label: string;
  labelEn?: string;
  labelFr?: string;
  labelDerja?: string;
  labelAr?: string;
  value: string;
  score: number;
  questionId?: string;
  testId?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  options?: ChatOption[];
  createdAt: string;
};

export type ConnectionStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

export type AssessmentResult = {
  score: number;
  max: number;
  prediction: string;
  positive_items?: number;
};

export type ChatReport = {
  primary: string;
  confidence: string;
  summary: string;
  signals: string[];
  recommendation: string;
  reportText?: string;
  assessments: {
    asrs: AssessmentResult;
    bipolar: AssessmentResult;
    psychosis: AssessmentResult;
  };
  rawScores?: Record<string, number>;
};
