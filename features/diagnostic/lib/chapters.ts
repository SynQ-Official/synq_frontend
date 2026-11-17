import type { MiraChapter } from "../types";

/** The four visible chapters of the guided journey, in order. */
export const CHAPTER_SEQUENCE: MiraChapter[] = ["MORNING", "MIDDAY", "EVENING", "INNER_VOICE"];

/** Mira's session length: 16 questions (5 per track, chosen by the agent among 20 topics each, + 1 general); the agent reports the live total as `questions_total`. */
export const ESTIMATED_QUESTIONS = 16;

/**
 * Present the four-chapter journey by mapping global progress (0..1) onto the sequence.
 *
 * Mira's agent keeps its own `chapter` fixed at "MORNING" for the whole conversation
 * (verified in vitamind_agent), and we must not change its reasoning. So the sidebar's
 * active chapter is derived here — pure display wiring, never sent back to the agent.
 */
export function deriveChapter(
  progress: number,
  opts: { complete?: boolean; urgent?: boolean } = {},
): MiraChapter {
  if (opts.urgent) return "SAFETY";
  if (opts.complete || progress >= 1) return "COMPLETE";
  const clamped = Math.max(0, Math.min(0.999, Number.isFinite(progress) ? progress : 0));
  const index = Math.min(CHAPTER_SEQUENCE.length - 1, Math.floor(clamped * CHAPTER_SEQUENCE.length));
  return CHAPTER_SEQUENCE[index];
}

/** Chapter a question belongs to, given how many answers the visitor had given before it. */
export function chapterAtTurn(answersBefore: number): MiraChapter {
  return deriveChapter(answersBefore / ESTIMATED_QUESTIONS);
}

/** What the agent reports: questions resolved and the live total (16, up to 19 with clarifications). */
export type QuestionCount = { answered: number; total: number };

/**
 * Answers given so far and the question currently being asked (1-based).
 * Uses the agent's own count when known; the progress-based estimate only covers a restore without a live session.
 */
export function questionPosition(progress: number, questions?: QuestionCount | null) {
  const total = Math.max(1, questions?.total ?? ESTIMATED_QUESTIONS);
  const answered = Math.max(0, Math.min(total, questions ? questions.answered : Math.round(progress * total)));
  return {
    answered,
    current: Math.min(total, answered + 1),
    total,
    remaining: Math.max(0, total - answered),
  };
}
