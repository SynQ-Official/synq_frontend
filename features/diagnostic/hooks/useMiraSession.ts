"use client";

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { sleep } from "@/lib/async";
import { ApiError } from "@/lib/api/client";
import { copy, LANGUAGE_STORAGE_KEY, normalizeLanguage, type Lang } from "@/lib/i18n/config";
import { miraApi, ORIENTATION_COMPLETED, ORIENTATION_CONSENT_REQUIRED, TRACK_ASSIGNED_BY_CLINICIAN, type MiraStart } from "../lib/mira-api";
import { typingDelay } from "../lib/pacing";
import { assistantMessage, countOf, lastProgress, restoredMessages, uid } from "../lib/transcript";
import type { MiraAttemptState } from "../types";
import { lockConversation, resetConversation, type ConversationRefs, type ConversationSetters, type MiraConversation } from "./useMiraConversation";

type Context = { set: ConversationSetters; refs: ConversationRefs };
type SessionOptions = { storageKey: string | null; lang: Lang; reconnectError: string; onConsentRequired: () => void };

/**
 * The visitor's language preference at session start. During hydration the language
 * context briefly reports the server (cookie) value, which can differ from the stored
 * preference; auto-starting then would open the conversation in the wrong language.
 */
function preferredLanguage(fallback: Lang): Lang {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored ? normalizeLanguage(stored) : fallback;
  } catch {
    return fallback;
  }
}

/** Where the open orientation is: this browser's pointer, else the account's resumable one (another device). */
async function findSession(storageKey: string | null): Promise<string | null> {
  const stored = storageKey ? window.localStorage.getItem(storageKey) : null;
  if (stored) return stored;
  const resumable = await miraApi.attempts().then((state) => state.resumableSessionId, () => null);
  if (resumable && storageKey) window.localStorage.setItem(storageKey, resumable);
  return resumable;
}

/** The agent's live state of an open session. With a transcript but no agent session it stays readable, sending off. */
async function resumeLive({ set }: Context, sessionId: string, hasTranscript: boolean, fallbackProgress: number, reconnectError: string): Promise<void> {
  const live = await miraApi.get(sessionId).catch((error: unknown) => {
    if (!hasTranscript) throw error;
    return null;
  });
  if (!live) {
    set.setSessionReady(false);
    set.setError(reconnectError);
    return;
  }
  set.setProgress(live.chapter_progress ?? fallbackProgress);
  set.setQuestions(countOf(live));
  if (live.safety) set.setSafety(live.safety);
  set.setOptions(live.options);
  if (!hasTranscript && live.assistant_message && live.assessment_complete === false) {
    set.setMessages([assistantMessage(live.assistant_message, live.chapter, { id: uid("mira-resync") })]);
  }
  if (live.complete && live.result) set.setResult(live.result);
  set.setSessionReady(true);
}

/** Rebuilds the FULL transcript from the database, then checks the agent can continue. Throws when it cannot. */
async function restoreSession(ctx: Context, sessionId: string, reconnectError: string): Promise<void> {
  const { set, refs } = ctx;
  refs.session.current = sessionId;
  const history = await miraApi.history(sessionId);
  set.setSessionId(sessionId);
  refs.language.current = history.language;
  set.setSessionLanguage(history.language);
  const restored = restoredMessages(history);
  if (restored.length > 0) set.setMessages(restored);
  const progress = lastProgress(history);
  set.setProgress(history.completed ? 1 : progress);
  if (history.completed && history.result) {
    // Completed sessions never drop the visitor back into the chat flow.
    set.setResult(history.result);
    set.setSessionReady(true);
    return;
  }
  await resumeLive(ctx, sessionId, restored.length > 0, progress, reconnectError);
}

function openSession({ set, refs }: Context, data: MiraStart, storageKey: string | null): void {
  refs.session.current = data.session_id;
  refs.language.current = data.language;
  set.setSessionLanguage(data.language);
  set.setSessionReady(true);
  if (storageKey) window.localStorage.setItem(storageKey, data.session_id);
  set.setSessionId(data.session_id);
  set.setProgress(0);
  set.setQuestions(countOf(data));
  set.setOptions(data.options ?? []);
  set.setMessages((prev) => [...prev, assistantMessage(data.assistant_message, data.chapter)]);
}

const refusalOf = (error: unknown): string | undefined => (error instanceof ApiError ? error.code : undefined);

/** Starting a new session: Mira's first message, paced, or the reason it could not start. */
function useMiraStart(
  { set, refs }: MiraConversation,
  { storageKey, lang, onConsentRequired }: SessionOptions,
  setAttempt: (attempt: MiraAttemptState) => void,
  startedRef: MutableRefObject<boolean>,
) {
  const [isStarting, setIsStarting] = useState(false);
  const start = useCallback(async (requestedLanguage: Lang = lang) => {
    if (startedRef.current || isStarting || refs.locked.current) return;
    startedRef.current = true;
    setIsStarting(true);
    set.setIsBotTyping(true);
    set.setPhase("reflecting");
    set.setError(null);
    const sentAt = performance.now();
    try {
      const data = await miraApi.start(requestedLanguage);
      set.setPhase("typing");
      await sleep(typingDelay(data.assistant_message, performance.now() - sentAt));
      openSession({ set, refs }, data, storageKey);
      if (data.attempt) setAttempt(data.attempt);
    } catch (err) {
      // Done, or skipped because the care team set the track: either way Mira is closed for good, not a failure to retry.
      if (refusalOf(err) === ORIENTATION_COMPLETED || refusalOf(err) === TRACK_ASSIGNED_BY_CLINICIAN) return lockConversation(set, refs);
      startedRef.current = false;
      if (refusalOf(err) === ORIENTATION_CONSENT_REQUIRED) return onConsentRequired();
      set.setError(copy[requestedLanguage].diagnostic.errors.start);
    } finally {
      setIsStarting(false);
      set.setIsBotTyping(false);
      set.setPhase(null);
    }
  }, [isStarting, lang, onConsentRequired, refs, set, setAttempt, startedRef, storageKey]);
  return { start, isStarting };
}

/** "Download report": stamps the session (one attempt). Idempotent; best-effort from the client, the DB stamp counts. */
function useMiraFinalize(refs: ConversationRefs) {
  const [attempt, setAttempt] = useState<MiraAttemptState | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const finalize = useCallback(async (): Promise<MiraAttemptState | null> => {
    const sid = refs.session.current;
    if (!sid) return null;
    setIsFinalizing(true);
    try {
      const { attempt: stamped } = await miraApi.finalize(sid);
      setAttempt(stamped);
      return stamped;
    } catch {
      return null;
    } finally {
      setIsFinalizing(false);
    }
  }, [refs]);
  return { attempt, setAttempt, isFinalizing, finalize };
}

/**
 * The orientation session: restored once per storage key (refresh, return, another device), otherwise started;
 * restarted on a language switch; resumed after the consent is accepted; finalized for the report.
 */
export function useMiraSession(conv: MiraConversation, options: SessionOptions) {
  const { set, refs } = conv;
  const { storageKey, lang, reconnectError } = options;
  const { attempt, setAttempt, isFinalizing, finalize } = useMiraFinalize(refs);
  // A session is being started or restored: nothing starts a second one meanwhile.
  const startedRef = useRef(false);
  const { start, isStarting } = useMiraStart(conv, options, setAttempt, startedRef);
  const [restoreTick, setRestoreTick] = useState(0);
  const restoredKeyRef = useRef<string | null>(null);
  // Read at restore time only: a language switch must not re-run the restore effect.
  const langRef = useRef(lang);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  useEffect(() => {
    // Once per storage key: a failed start must never re-run this and fire POST /mira/session in a loop (until 429).
    if (refs.locked.current || restoredKeyRef.current === (storageKey ?? "")) return;
    restoredKeyRef.current = storageKey ?? "";
    void (async () => {
      const sessionId = await findSession(storageKey);
      if (!sessionId) return void window.setTimeout(() => void start(preferredLanguage(langRef.current)), 0);
      startedRef.current = true;
      try {
        await restoreSession({ set, refs }, sessionId, reconnectError);
      } catch {
        if (storageKey) window.localStorage.removeItem(storageKey);
        resetConversation(set, refs);
        startedRef.current = false;
        void start();
      }
    })();
  }, [refs, restoreTick, reconnectError, set, start, storageKey]);

  const restart = useCallback((nextLanguage?: Lang) => {
    if (refs.locked.current) return;
    startedRef.current = false;
    resetConversation(set, refs);
    if (storageKey) window.localStorage.removeItem(storageKey);
    void start(nextLanguage);
  }, [refs, set, start, storageKey]);

  /** After the consent is accepted: an open session simply goes on, otherwise the stored or account one is restored. */
  const resume = useCallback(() => {
    if (refs.session.current) return set.setError(null);
    restoredKeyRef.current = null;
    startedRef.current = false;
    setRestoreTick((n) => n + 1);
  }, [refs, set]);

  /** The session could not start or be restored: clear the error and run the same restore-or-start again (a locked chat is refused by that effect). */
  const reconnect = useCallback(() => {
    set.setError(null);
    restoredKeyRef.current = null;
    startedRef.current = false;
    setRestoreTick((n) => n + 1);
  }, [set]);

  return { start, restart, resume, reconnect, finalize, isStarting, isFinalizing, attempt };
}
