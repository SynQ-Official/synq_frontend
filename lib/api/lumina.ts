import { api } from "./client";
import type { Exercise, PatientTrack } from "./patient-types";

/** Lumina (docs/SYNQ_LUMINA_SPECIFICATION.md): today's contextual check-in wording and activities, feedback, journal synthesis. */
export type LuminaMetric = "mood" | "energy" | "focus" | "sleep";

export type LuminaToday = {
  mode: "NORMAL" | "SAFETY_YIELD";
  track: PatientTrack;
  ruleSetVersion: string;
  checkin: { prompts: Record<LuminaMetric, string>; intro: string; decisionId: string | null; fallback: boolean };
  activities: { exercise: Exercise; rationaleKey: string }[];
  activityDecisionId: string | null;
};

export type LuminaFeedbackInput = { subject: "ACTIVITY" | "CHECKIN"; subjectKey: string; usefulness: number; decisionId?: string };

export type SynthesisTrendStatus = "increasing" | "decreasing" | "no_significant_trend" | "insufficient_data";

export type JournalSynthesis =
  | { available: false; window: 7 | 30 }
  | {
      available: true;
      window: { start: string; end: string; days: number };
      status: "ok" | "insufficient_data";
      checkins: number;
      journal_days: number;
      trends: Record<"mood" | "energy" | "focus" | "sleep_hours", { status: SynthesisTrendStatus; n_obs: number; mean: number | null; change: number | null }>;
      signal_frequency: { signal: string; days: number; observed_days: number }[];
      recurring_signals: { signal: string; episodes: number; days: number }[];
      co_occurrences: { signals: string[]; co_occurrence_days: number; observed_days: number }[];
      uncertainty: "low" | "moderate" | "high";
      confidence: number;
    };

export const luminaApi = {
  today: (hour: number, signal?: AbortSignal): Promise<{ data: LuminaToday }> => api.get<{ data: LuminaToday }>("/me/lumina/today", { hour }, { signal }),
  feedback: (input: LuminaFeedbackInput): Promise<{ data: { id: string } }> => api.post<{ data: { id: string } }>("/me/lumina/feedback", input),
  synthesis: (window: 7 | 30, signal?: AbortSignal): Promise<{ data: JournalSynthesis }> =>
    api.get<{ data: JournalSynthesis }>("/me/lumina/journal-synthesis", { window }, { signal }),
};
