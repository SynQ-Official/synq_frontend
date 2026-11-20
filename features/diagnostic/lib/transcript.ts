import type { MiraChapter, MiraMessage } from "../types";
import type { QuestionCount } from "./chapters";
import type { MiraHistory } from "./mira-api";

/** "A)  Often" lines: Mira lists a choice question's answers in its text; here they are the buttons, so not repeated. */
const OPTION_LINE = /^[ \t]*(?:[A-E]|[أبجد]|هـ)\)[^\n]*\n?/gm;

export const withoutOptionLines = (content: string): string => content.replace(OPTION_LINE, "").trimEnd();

export function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** The agent's own question count, when the response carries it. */
export function countOf(data: { questions_answered?: number; questions_total?: number }): QuestionCount | null {
  return typeof data.questions_answered === "number" && typeof data.questions_total === "number"
    ? { answered: data.questions_answered, total: data.questions_total }
    : null;
}

export function assistantMessage(content: string, chapter?: MiraChapter, extra: Partial<MiraMessage> = {}): MiraMessage {
  return { id: uid("mira"), role: "assistant", content: withoutOptionLines(content), chapter, createdAt: new Date().toISOString(), ...extra };
}

export function userMessage(id: string, content: string, chapter: MiraChapter): MiraMessage {
  return { id, role: "user", content, chapter, createdAt: new Date().toISOString() };
}

/** The durable transcript as chat messages (Mira's listed answers removed, they were buttons). */
export function restoredMessages(history: MiraHistory): MiraMessage[] {
  return history.messages.map((m) => ({
    id: uid("hist"),
    role: m.role,
    content: m.role === "assistant" ? withoutOptionLines(m.content) : m.content,
    chapter: m.chapter,
    createdAt: m.createdAt,
  }));
}

/** The last progress the transcript recorded (0 before any). */
export function lastProgress(history: MiraHistory): number {
  return history.messages.reduce((acc, m) => (typeof m.chapterProgress === "number" ? m.chapterProgress : acc), 0);
}
