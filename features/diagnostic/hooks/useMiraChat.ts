"use client";

import { useCallback } from "react";
import { useSessionUserId } from "@/hooks/useSessionState";
import { copy, type Lang } from "@/lib/i18n/config";
import { deriveChapter } from "../lib/chapters";
import { useMiraConsent } from "./useMiraConsent";
import { useMiraConversation } from "./useMiraConversation";
import { useMiraSession } from "./useMiraSession";
import { useMiraTurn } from "./useMiraTurn";

export type { MiraOption } from "../lib/mira-api";
export { ORIENTATION_COMPLETED, ORIENTATION_CONSENT_REQUIRED } from "../lib/mira-api";
export type { MiraPhase } from "./useMiraConversation";

/**
 * useMiraChat — ACTIVE diagnostic hook, assembled from focused parts:
 *  - `useMiraConversation`  the shared state (transcript, progress, safety, result…);
 *  - `useMiraSession`       start, restore (refresh, return, another device), restart, finalize;
 *  - `useMiraTurn`          one exchange at a time: streamed or paced reply, Stop, Try again;
 *  - `useMiraConsent`       the consent screen, which resumes the SAME orientation once accepted.
 * Everything goes to Nest `MiraController` (/api/v1/mira/*) through `miraApi`. Mira's reasoning is never touched;
 * the chapter shown is derived from progress here.
 */
export function useMiraChat(chatId?: string | null, lang: Lang = "en", { locked = false }: { locked?: boolean } = {}) {
  const sendError = copy[lang].diagnostic.errors.send;
  // Scoped by account AND conversation: the pointer to an open session is never readable by another user, even
  // through a shared/back-navigated `?chatId=`. No user, no key (nothing personal is stored).
  const userId = useSessionUserId();
  const storageKey = chatId && userId ? `vitamind-mira-session:${userId}:${chatId}` : null;
  const conv = useMiraConversation(locked);
  const consent = useMiraConsent();
  // The agent keeps its own chapter at MORNING: the one shown follows progress.
  const chapter = deriveChapter(conv.progress, { complete: Boolean(conv.result), urgent: conv.safety.level === "urgent" });
  const session = useMiraSession(conv, { storageKey, lang, reconnectError: copy[lang].diagnostic.errors.reconnect, onConsentRequired: consent.require });
  const turn = useMiraTurn(conv, { chapter, sendError, onConsentRequired: consent.require });
  const { accept } = consent;
  const { resume, reconnect } = session;
  const acceptConsent = useCallback(() => accept(resume), [accept, resume]);
  const { retry: resend } = turn;
  // Nothing unanswered to send again: the failure was the session itself (start or restore), so reconnect it.
  const retry = useCallback(() => {
    if (!resend()) reconnect();
  }, [resend, reconnect]);

  return {
    ...turn,
    retry,
    sessionId: conv.sessionId,
    /** The session is open and can take a message (false while starting, or after a failed restore). */
    sessionReady: conv.sessionReady,
    sessionLanguage: conv.sessionLanguage ?? lang,
    chapter,
    progress: conv.progress,
    /** The agent's count (answered / total: 26 in v2, 16 in v1 sessions); null until known. */
    questions: conv.questions,
    isBotTyping: conv.isBotTyping,
    isStarting: session.isStarting,
    isFinalizing: session.isFinalizing,
    /** Current pacing beat while Mira prepares a reply (null when idle). */
    phase: conv.phase,
    error: conv.error,
    safety: conv.safety,
    /** Answers to tap for the current situation; empty when typing is the only way to reply. */
    options: conv.options,
    result: conv.result,
    finishedLive: conv.finishedLive,
    attempt: session.attempt,
    consentRequired: consent.required,
    consentBusy: consent.busy,
    consentError: consent.failed,
    acceptConsent,
    /** Signed-in patient: orientation already completed, the chat is locked. */
    completed: conv.completed,
    assessmentComplete: Boolean(conv.result),
    finalize: session.finalize,
    restart: session.restart,
  };
}

/** Everything the orientation screens read from the conversation. */
export type MiraChat = ReturnType<typeof useMiraChat>;
