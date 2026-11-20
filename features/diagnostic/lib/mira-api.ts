import { z } from "zod";
import { AGENT_TIMEOUT_MS, api } from "@/lib/api/client";
import { streamWithFallback } from "@/lib/api/stream";
import type { Schema } from "@/lib/api/schemas";
import type { Lang } from "@/lib/i18n/config";
import { MIRA_AREAS, MIRA_SIGNAL_LEVELS, type MiraAssessmentResult, type MiraAttemptState, type MiraChapter, type MiraSafety } from "../types";

/**
 * Mira — `/api/v1/mira/*` (MiraController), called straight from the browser with the patient token.
 * Going through the shared client gives every call `ensureSession`, the cross-tab refresh lock and the
 * single retry on 401. The streamed turn is in `lib/api/stream.ts` and reuses `miraTurnSchema` below.
 */

/** API code: the caller is a signed-in patient, who has already completed the orientation. */
export const ORIENTATION_COMPLETED = "ORIENTATION_COMPLETED";
/** API code: the care team set this patient's track, so Mira's orientation is closed (it is skipped, not failed). */
export const TRACK_ASSIGNED_BY_CLINICIAN = "TRACK_ASSIGNED_BY_CLINICIAN";
/** API code: the consent to the orientation is missing or withdrawn. Accepting it resumes the SAME orientation. */
export const ORIENTATION_CONSENT_REQUIRED = "ORIENTATION_CONSENT_REQUIRED";

const CHAPTERS = ["MORNING", "MIDDAY", "EVENING", "INNER_VOICE", "COMPLETE", "SAFETY"] as const satisfies readonly MiraChapter[];

const langSchema = z.enum(["en", "ar"]) satisfies Schema<Lang>;
/** The chapter is display-only: an unknown one is dropped instead of failing the whole turn. */
const chapterSchema = z.enum(CHAPTERS).optional().catch(undefined);
/** Absent or null lists read as empty. */
const list = <T>(item: Schema<T>) => z.array(item).nullish().transform((value): T[] => value ?? []);
const optionalText = z.string().nullish().transform((value) => value ?? undefined);

/** v2 signal level of one area; an unknown value is dropped. */
const level = z.enum(MIRA_SIGNAL_LEVELS).optional().catch(undefined);

const safetySchema: Schema<MiraSafety> = z.object({ level: z.enum(["routine", "urgent"]), flags: list(z.string()) });

export const miraResultSchema: Schema<MiraAssessmentResult> = z.object({
  assessment_complete: z.boolean().default(true),
  recommended_pathway: z.string().default(""),
  match_strength: z.preprocess((value) => (typeof value === "string" ? value.toUpperCase() : value), z.enum(["LOW", "MODERATE", "HIGH"])),
  supporting_features: list(z.string()),
  contradictory_features: list(z.string()),
  overlapping_with_mood_episodes: z.array(z.string()).optional(),
  other_signals: list(z.string()),
  missing_information: list(z.string()),
  feature_labels: z.record(z.string()).optional(),
  safety: safetySchema,
  recommended_test: z.string().nullish(),
  orientation_label: optionalText,
  confidence: z.number().nullish(),
  // Missing means unknown: the report then recommends a review rather than calling it optional.
  requires_clinician_review: z.boolean().default(true),
  orientation: z.string(),
  disclaimer: z.string().default(""),
  language: langSchema,
  // v2 only, display-only: an unknown area or level is dropped rather than failing the whole report.
  orientation_levels: z.object({ ADHD: level, BIPOLAR: level, PSYCHOSIS: level }).optional().catch(undefined),
  explored_in_depth: z.array(z.enum(MIRA_AREAS)).optional().catch(undefined),
  orientation_uncertain: z.boolean().optional().catch(undefined),
});

const optionSchema = z.object({ id: z.string(), label: z.string(), emoji: z.string().default(""), text: z.string() });
/** One selectable answer of a choice question; while options are shown typing is not accepted (backend input_enabled = false). */
export type MiraOption = z.infer<typeof optionSchema>;

const questionCount = { questions_answered: z.number().optional(), questions_total: z.number().optional() };

/** The answer to one turn, from `POST …/message` or the `final` event of `…/message/stream`. */
export const miraTurnSchema = z.object({
  assistant_message: z.string(),
  chapter: chapterSchema,
  chapter_progress: z.number(),
  ...questionCount,
  // v1 (16 questions): OPEN…FINAL; v2 (26): EXPLORATION, CONTEXT, PRECISION. Display-only: an unknown phase is dropped, never fails the turn.
  phase: z
    .enum(["OPEN", "SITUATIONS", "CHOICES", "FINAL", "EXPLORATION", "CONTEXT", "PRECISION", "DONE"])
    .optional()
    .catch(undefined),
  input_enabled: z.boolean().optional(),
  /** `invalid`: nothing to read (spaces, symbols, repeated or random keys). Not counted; the question stays. */
  input_status: z.enum(["ok", "invalid"]).optional(),
  counted: z.boolean().optional(),
  assessment_complete: z.boolean(),
  safety: safetySchema,
  result: miraResultSchema.nullish(),
  language: langSchema,
  options: list(optionSchema),
});
export type MiraTurn = z.infer<typeof miraTurnSchema>;

/** The live engine state of an open session (its fields come from the engine, so most are optional). */
const liveSessionSchema = z.object({
  chapter: chapterSchema,
  chapter_progress: z.number().optional(),
  ...questionCount,
  assessment_complete: z.boolean().optional(),
  complete: z.boolean().optional(),
  safety: safetySchema.optional(),
  result: miraResultSchema.nullish(),
  assistant_message: z.string().nullish(),
  options: list(optionSchema),
});
export type MiraLiveSession = z.infer<typeof liveSessionSchema>;

/** The durable transcript and status, rebuilt from the database. */
const historySchema = z.object({
  session_id: z.string(),
  status: z.string(),
  language: langSchema,
  result: miraResultSchema.nullish(),
  completed: z.boolean(),
  completedAt: z.string().nullish(),
  reportedAt: z.string().nullish(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
      chapter: chapterSchema,
      chapterProgress: z.number().nullish(),
      createdAt: z.string(),
    }),
  ),
});
export type MiraHistory = z.infer<typeof historySchema>;

export type MiraStart = {
  session_id: string;
  chapter?: MiraChapter;
  assistant_message: string;
  options?: MiraOption[];
  language: Lang;
  attempt?: MiraAttemptState;
  questions_answered?: number;
  questions_total?: number;
};

export type MiraAttempts = MiraAttemptState & { resumableSessionId: string | null };
export type MiraFinalized = { success: boolean; reportedAt: string; attempt: MiraAttemptState };

const session = (sessionId: string) => `/mira/session/${encodeURIComponent(sessionId)}`;
/** Every call that waits on the engine gets the agent budget. */
const agent = { timeoutMs: AGENT_TIMEOUT_MS };

export const miraApi: {
  start: (language: Lang) => Promise<MiraStart>;
  attempts: () => Promise<MiraAttempts>;
  get: (sessionId: string) => Promise<MiraLiveSession>;
  history: (sessionId: string) => Promise<MiraHistory>;
  message: (sessionId: string, text: string, language: Lang) => Promise<MiraTurn>;
  reply: (sessionId: string, text: string, language: Lang, live: { signal: AbortSignal; onDelta: (text: string) => void }) => Promise<MiraTurn>;
  finalize: (sessionId: string) => Promise<MiraFinalized>;
  remove: (sessionId: string) => Promise<{ success: boolean }>;
} = {
  start: (language: Lang): Promise<MiraStart> => api.post<MiraStart>("/mira/session", { language }, agent),
  attempts: (): Promise<MiraAttempts> => api.get<MiraAttempts>("/mira/attempts"),
  get: (sessionId: string): Promise<MiraLiveSession> => api.get(session(sessionId), undefined, { ...agent, schema: liveSessionSchema }),
  history: (sessionId: string): Promise<MiraHistory> => api.get(`${session(sessionId)}/history`, undefined, { schema: historySchema }),
  message: (sessionId: string, text: string, language: Lang): Promise<MiraTurn> =>
    api.post(`${session(sessionId)}/message`, { text, language }, { ...agent, schema: miraTurnSchema }),
  /**
   * One turn, streamed: text arrives through `onDelta` and the promise resolves with the validated final body. If the
   * stream cannot open (SSE must never pass through a Next proxy), the synchronous endpoint answers instead.
   */
  reply: (sessionId: string, text: string, language: Lang, live: { signal: AbortSignal; onDelta: (text: string) => void }): Promise<MiraTurn> =>
    streamWithFallback<MiraTurn>({
      path: `${session(sessionId)}/message/stream`,
      body: { text, language },
      schema: miraTurnSchema,
      signal: live.signal,
      onDelta: live.onDelta,
      sync: () => miraApi.message(sessionId, text, language),
    }),
  /** "Download report": stamps the session. Idempotent. */
  finalize: (sessionId: string): Promise<MiraFinalized> => api.post<MiraFinalized>(`${session(sessionId)}/finalize`, undefined, agent),
  remove: (sessionId: string): Promise<{ success: boolean }> => api.delete<{ success: boolean }>(session(sessionId)),
};
