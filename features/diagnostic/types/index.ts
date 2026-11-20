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

/**
 * Mira's orientation as the patient app receives it. The per-track scores (`condition_scores`,
 * `orientation_percentages`) and `model_assessment` are kept server-side for the clinician handoff and are
 * never sent here.
 */
export type MiraAssessmentResult = {
  assessment_complete: boolean;
  recommended_pathway: string;
  match_strength: "LOW" | "MODERATE" | "HIGH";
  supporting_features: string[];
  contradictory_features: string[];
  /** Attention/restlessness described only inside high or low phases: reported, but not counted for ADHD. */
  overlapping_with_mood_episodes?: string[];
  other_signals: string[];
  missing_information: string[];
  /** Display name of each feature key above, in the session language (sent by Mira). */
  feature_labels?: Record<string, string>;
  safety: MiraSafety;
  recommended_test?: string | null;
  /** ADHD | BIPOLAR | PSYCHOSIS | AMBIGUOUS | OTHER | HEALTHY | UNSPECIFIED: an orientation label, not a diagnosis. */
  orientation_label?: string;
  /** Always null for the adaptive flow (no validated confidence score exists): `match_strength` is what to show. */
  confidence?: number | null;
  requires_clinician_review: boolean;
  orientation: string;
  disclaimer: string;
  language: Lang;
  /** v2 (26 questions) only: qualitative level per area. Never a probability; absent in v1 reports. */
  orientation_levels?: Partial<Record<MiraArea, MiraSignalLevel>>;
  /** v2: the areas that received the adaptive follow-up questions. */
  explored_in_depth?: MiraArea[];
  /** v2: the follow-up questions did not clearly confirm a single pattern. */
  orientation_uncertain?: boolean;
};

export const MIRA_AREAS = ["ADHD", "BIPOLAR", "PSYCHOSIS"] as const;
export type MiraArea = (typeof MIRA_AREAS)[number];
export const MIRA_SIGNAL_LEVELS = ["more_prominent", "moderate", "limited", "insufficient_information"] as const;
export type MiraSignalLevel = (typeof MIRA_SIGNAL_LEVELS)[number];

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
