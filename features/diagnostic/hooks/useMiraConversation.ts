"use client";

import { useMemo, useRef, useState } from "react";
import type { Lang } from "@/lib/i18n/config";
import type { QuestionCount } from "../lib/chapters";
import type { MiraOption } from "../lib/mira-api";
import type { MiraAssessmentResult, MiraMessage, MiraSafety } from "../types";

/** What the visitor sees Mira doing while a reply is on its way. */
export type MiraPhase = "reading" | "reflecting" | "typing";

const ROUTINE: MiraSafety = { level: "routine", flags: [] };

/**
 * The state of one Mira conversation, shared by the session, turn and consent hooks. `set` and `refs` keep one
 * identity for the life of the component, so callbacks that use them never go stale.
 */
export function useMiraConversation(locked: boolean) {
  const [messages, setMessages] = useState<MiraMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionLanguage, setSessionLanguage] = useState<Lang | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [questions, setQuestions] = useState<QuestionCount | null>(null);
  const [safety, setSafety] = useState<MiraSafety>(ROUTINE);
  const [options, setOptions] = useState<MiraOption[]>([]);
  const [result, setResult] = useState<MiraAssessmentResult | null>(null);
  /** The result just arrived with the last answer (not restored from history): worth a proper finishing beat. */
  const [finishedLive, setFinishedLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Patients who already completed their orientation: no session is started or continued.
  const [completed, setCompleted] = useState(locked);
  const [phase, setPhase] = useState<MiraPhase | null>(null);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const session = useRef<string | null>(null);
  const language = useRef<Lang | null>(null);
  const lockedRef = useRef(locked);
  const set = useMemo(
    () => ({ setMessages, setSessionId, setSessionLanguage, setSessionReady, setProgress, setQuestions, setSafety, setOptions, setResult, setFinishedLive, setError, setCompleted, setPhase, setIsBotTyping }),
    [],
  );
  const refs = useMemo(() => ({ session, language, locked: lockedRef }), []);
  return { messages, sessionId, sessionLanguage, sessionReady, progress, questions, safety, options, result, finishedLive, error, completed, phase, isBotTyping, set, refs };
}

export type MiraConversation = ReturnType<typeof useMiraConversation>;
export type ConversationSetters = MiraConversation["set"];
export type ConversationRefs = MiraConversation["refs"];

/** Back to an empty conversation: a restart, or a stored session that could not be restored. */
export function resetConversation(set: ConversationSetters, refs: ConversationRefs): void {
  refs.session.current = null;
  refs.language.current = null;
  set.setMessages([]);
  set.setSessionId(null);
  set.setSessionLanguage(null);
  set.setSessionReady(false);
  set.setProgress(0);
  set.setQuestions(null);
  set.setSafety(ROUTINE);
  set.setOptions([]);
  set.setResult(null);
  set.setFinishedLive(false);
  set.setError(null);
}

/** The account has already completed its orientation: the chat locks for good. */
export function lockConversation(set: ConversationSetters, refs: ConversationRefs): void {
  refs.locked.current = true;
  set.setCompleted(true);
}
