import type { PatientCopy } from "@/lib/i18n/patient";
import type { LuminaMetric } from "@/lib/api/lumina";

/**
 * Lumina copy resolution. The server sends wording ids only (never text); the words live here in English and Arabic.
 * An id the app does not know falls back to the standard question, so a newer engine can never show a raw id.
 */
export function promptTitle(copy: PatientCopy, metric: LuminaMetric, promptId: string | undefined): string {
  const contextual = promptId ? (copy.lumina.prompts as Record<string, string>)[promptId] : undefined;
  return contextual ?? copy.checkin.q[metric].title;
}

export function introText(copy: PatientCopy, introId: string | undefined): string | null {
  return introId ? (copy.lumina.intro as Record<string, string>)[introId] ?? null : null;
}

export function rationaleText(copy: PatientCopy, key: string): string {
  return (copy.lumina.rationale as Record<string, string>)[key] ?? copy.lumina.rationale.track_fit;
}

/** The feedback key for a check-in: the wording set the patient actually answered. */
export function checkinSubjectKey(prompts: Record<LuminaMetric, string> | undefined): string {
  if (!prompts) return "checkin.default";
  return (["mood", "energy", "focus", "sleep"] as const).map((m) => prompts[m]).join("|");
}

export function signalLabel(copy: PatientCopy, signal: string): string {
  return (copy.journal.labels.signals as Record<string, string>)[signal] ?? signal.replace(/_/g, " ");
}

/**
 * The patient app's own exercise ranking (RecommendedExercises) knows nothing about safety, so it may only appear when
 * the server has said NORMAL. Fail closed: while Lumina is loading or has failed (mode unknown) it stays hidden, and
 * under SAFETY_YIELD nothing recommends an activity below the calm SOS card.
 */
export function showLegacyExercises(mode: "NORMAL" | "SAFETY_YIELD" | undefined): boolean {
  return mode === "NORMAL";
}
