import type { MiraChapter } from "../types";

/** The four visible chapters of the guided journey, in order. */
export const CHAPTER_SEQUENCE: MiraChapter[] = ["MORNING", "MIDDAY", "EVENING", "INNER_VOICE"];

/** Mira's session length: 26 questions (18 exploration, 2 context, 6 adaptive); a session started before v2 has 16. The agent reports the live total as `questions_total`, which always wins. */
export const ESTIMATED_QUESTIONS = 26;

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

/** What the agent reports: questions resolved and the session's total (26 in v2, 16 in v1 sessions). */
export type QuestionCount = { answered: number; total: number };

/**
 * Answers given so far and the question currently being asked (1-based).
 * Uses the agent's own count when known; the progress-based estimate only covers a restore without a live session.
 * `known` is false in that case: the total is then an estimate, and the screens never print it as a fact (the agent's
 * own greeting states the real count, which differs for a v1 session).
 */
export function questionPosition(progress: number, questions?: QuestionCount | null) {
  const total = Math.max(1, questions?.total ?? ESTIMATED_QUESTIONS);
  const answered = Math.max(0, Math.min(total, questions ? questions.answered : Math.round(progress * total)));
  return {
    known: Boolean(questions),
    answered,
    current: Math.min(total, answered + 1),
    total,
    remaining: Math.max(0, total - answered),
  };
}
