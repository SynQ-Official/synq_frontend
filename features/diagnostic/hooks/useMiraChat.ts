"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { streamWithFallback } from "@/lib/api/stream";
import { profileApi } from "@/lib/api/patient";
import { CONSENT_VERSION } from "@/lib/patient/consent";
import { useTurnStream } from "@/hooks/patient/useTurnStream";
import { useSessionUserId } from "@/hooks/useSessionState";
import { classifyTurnFailure, type TurnFailureKind } from "@/lib/patient/turn-errors";
import { copy, LANGUAGE_STORAGE_KEY, normalizeLanguage, type Lang } from "@/lib/i18n/config";
import type { MiraAssessmentResult, MiraAttemptState, MiraChapter, MiraMessage, MiraSafety } from "../types";
import { deriveChapter, type QuestionCount } from "../lib/chapters";
import { fingerprintHeaders } from "../lib/fingerprint";

/** One selectable answer of a choice question; while options are shown typing is not accepted (backend input_enabled = false). */
export type MiraOption = { id: string; label: string; emoji: string; text: string };

type StartResponse = {
  session_id: string;
  chapter: MiraChapter;
  assistant_message: string;
  options?: MiraOption[];
  language: Lang;
  attempt?: MiraAttemptState;
  questions_answered?: number;
  questions_total?: number;
};

type SendResponse = {
  assistant_message: string;
  chapter: MiraChapter;
  chapter_progress: number;
  /** Questions resolved so far, out of `questions_total` (16, more only when Mira asks a clarification). An unreadable message does not move it. */
  questions_answered?: number;
  questions_total?: number;
  phase?: "OPEN" | "SITUATIONS" | "CHOICES" | "FINAL" | "DONE";
  input_enabled?: boolean;
  /** `invalid`: nothing to read (spaces, symbols, repeated or random keys). Not counted; the question stays. */
  input_status?: "ok" | "invalid";
  invalid_reason?: "empty" | "symbols" | "repeated" | "mashing";
  counted?: boolean;
  assessment_complete: boolean;
  safety: MiraSafety;
  result?: MiraAssessmentResult | null;
  language: Lang;
  options?: MiraOption[];
};

type SessionResponse = {
  session_id: string;
  chapter: MiraChapter;
  chapter_progress: number;
  assessment_complete: boolean;
  complete: boolean;
  safety: MiraSafety;
  result: MiraAssessmentResult | null;
  assistant_message: string | null;
  language: Lang;
  options?: MiraOption[];
  questions_answered?: number;
  questions_total?: number;
};

/** "A)  Often" lines: Mira lists a choice question's answers in its text; here they are the buttons, so not repeated. */
const OPTION_LINE = /^[ \t]*(?:[A-E]|[أبجد]|هـ)\)[^\n]*\n?/gm;
const withoutOptionLines = (content: string) => content.replace(OPTION_LINE, "").trimEnd();

/** The agent's own question count, when the response carries it. */
function countOf(data: { questions_answered?: number; questions_total?: number }): QuestionCount | null {
  return typeof data.questions_answered === "number" && typeof data.questions_total === "number"
    ? { answered: data.questions_answered, total: data.questions_total }
    : null;
}

type HistoryResponse = {
  session_id: string;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED" | "EXPIRED" | "BLOCKED";
  language: Lang;
  result: MiraAssessmentResult | null;
  completed: boolean;
  reportedAt: string | null;
  messages: Array<{ role: "user" | "assistant"; content: string; chapter?: MiraChapter | null; chapterProgress?: number | null; createdAt: string }>;
};

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

/** What the visitor sees Mira doing while a reply is on its way. */
export type MiraPhase = "reading" | "reflecting" | "typing";

const READING_MS = 650;
const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/**
 * Human-paced reply: a short "typing" beat scaled to the reply's length. When the
 * service was already slow, the visitor has waited enough — only a brief beat remains.
 */
function typingDelay(text: string, waitedMs: number) {
  const natural = Math.min(2600, Math.max(900, 450 + text.length * 11));
  return waitedMs > 2500 ? Math.min(natural, 600) : Math.max(350, natural - waitedMs * 0.5);
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** All Mira proxy calls carry the client fingerprint so anti-abuse can key on it. */
function fpInit(init: RequestInit = {}): RequestInit {
  return { ...init, headers: { ...(init.headers as Record<string, string>), ...fingerprintHeaders() } };
}

/**
 * useMiraChat — ACTIVE diagnostic hook.
 *
 * REST-only to the Next proxy `/api/mira` (start | message | finalize + history/attempts),
 * which forwards to Nest `MiraController` (/api/v1/mira/*), which forwards to the official Mira AI service.
 * Mira's reasoning is never touched; chapter display is derived from progress here.
 */
/** API code: the caller is a signed-in patient, who has already completed the orientation. */
export const ORIENTATION_COMPLETED = "ORIENTATION_COMPLETED";
/** API code: the consent to the orientation is missing or withdrawn. Accepting it resumes the SAME orientation. */
export const ORIENTATION_CONSENT_REQUIRED = "ORIENTATION_CONSENT_REQUIRED";

export function useMiraChat(chatId?: string | null, lang: Lang = "en", { locked = false }: { locked?: boolean } = {}) {
  const errors = copy[lang].diagnostic.errors;
  // Scoped by account AND conversation: the pointer to an open session is never readable by another user, even
  // through a shared/back-navigated `?chatId=`. No user, no key (nothing personal is stored).
  const userId = useSessionUserId();
  const storageKey = chatId && userId ? `vitamind-mira-session:${userId}:${chatId}` : null;
  const [messages, setMessages] = useState<MiraMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [questions, setQuestions] = useState<QuestionCount | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [safety, setSafety] = useState<MiraSafety>({ level: "routine", flags: [] });
  const [options, setOptions] = useState<MiraOption[]>([]);
  const [result, setResult] = useState<MiraAssessmentResult | null>(null);
  /** The result just arrived with the tenth answer (not restored from history): worth a proper finishing beat. */
  const [finishedLive, setFinishedLive] = useState(false);
  const [sessionLanguage, setSessionLanguage] = useState<Lang | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [attempt, setAttempt] = useState<MiraAttemptState | null>(null);
  const [blocked, setBlocked] = useState(false);
  /** The consent is missing or withdrawn: show the consent screen; accepting it picks the orientation up where it stopped. */
  const [consentRequired, setConsentRequired] = useState(false);
  const [consentBusy, setConsentBusy] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [restoreTick, setRestoreTick] = useState(0);
  // Patients have already completed their orientation: no session is started or continued.
  const [completed, setCompleted] = useState(locked);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [phase, setPhase] = useState<MiraPhase | null>(null);
  /** Why the last reply did not complete, in calm terms; emergency resources when the API sent them. */
  const [failure, setFailure] = useState<TurnFailureKind | null>(null);
  const [support, setSupport] = useState<string[] | null>(null);
  const { text: streamText, begin: beginStream, finish: finishStream, stop: stopStream, snapshot: streamSnapshot } = useTurnStream();
  const [writing, setWriting] = useState<{ key: string; startedAt: string } | null>(null);
  /** The visitor's last message that got no reply, so a gentle retry can send it again. */
  const unanswered = useRef<{ localId: string; text: string } | null>(null);

  const sessionRef = useRef<string | null>(null);
  const sessionLanguageRef = useRef<Lang | null>(null);
  const startedRef = useRef(false);
  const lockedRef = useRef(locked);
  const restoredKeyRef = useRef<string | null>(null);
  // Read at restore time only: a language switch must not re-run the restore effect.
  const langRef = useRef(lang);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  // Chapter shown in the UI is derived from progress (the agent keeps its own at MORNING).
  const chapter = deriveChapter(progress, { complete: Boolean(result), urgent: safety.level === "urgent" });

  const pushAssistant = useCallback((content: string, msgChapter?: MiraChapter) => {
    setMessages((prev) => [
      ...prev,
      { id: uid("mira"), role: "assistant", content: withoutOptionLines(content), chapter: msgChapter, createdAt: new Date().toISOString() },
    ]);
  }, []);

  const start = useCallback(async (requestedLanguage: Lang = lang) => {
    if (startedRef.current || isStarting || lockedRef.current) return;
    startedRef.current = true;
    setIsStarting(true);
    setIsBotTyping(true);
    setPhase("reflecting");
    setError(null);
    const sentAt = performance.now();
    try {
      const response = await fetch("/api/mira", fpInit({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", language: requestedLanguage }),
      }));
      const data = (await response.json()) as StartResponse & { error?: string; code?: string; attempt?: MiraAttemptState };
      if (response.ok) {
        setPhase("typing");
        await sleep(typingDelay(data.assistant_message ?? "", performance.now() - sentAt));
      }
      if (!response.ok) {
        if (data.code === ORIENTATION_COMPLETED) {
          lockedRef.current = true;
          setCompleted(true);
          return;
        }
        if (data.code === ORIENTATION_CONSENT_REQUIRED) {
          startedRef.current = false;
          setConsentRequired(true);
          return;
        }
        if (data.code === "ATTEMPTS_EXHAUSTED") {
          setBlocked(true);
          if (data.attempt) setAttempt(data.attempt);
          startedRef.current = true; // stay blocked; don't auto-retry
          return;
        }
        throw new Error(data.error || copy[requestedLanguage].diagnostic.errors.start);
      }
      sessionRef.current = data.session_id;
      sessionLanguageRef.current = data.language;
      setSessionLanguage(data.language);
      setSessionReady(true);
      setBlocked(false);
      if (data.attempt) setAttempt(data.attempt);
      if (storageKey) window.localStorage.setItem(storageKey, data.session_id);
      setSessionId(data.session_id);
      setProgress(0);
      setQuestions(countOf(data));
      setOptions(data.options ?? []);
      pushAssistant(data.assistant_message, data.chapter);
    } catch (err) {
      startedRef.current = false;
      setError(err instanceof Error ? err.message : copy[requestedLanguage].diagnostic.errors.start);
    } finally {
      setIsStarting(false);
      setIsBotTyping(false);
      setPhase(null);
    }
  }, [isStarting, lang, pushAssistant, storageKey]);

  // Restore an existing session (refresh / return): rebuild the FULL transcript from the
  // database, not just the last message, and route completed sessions to their report.
  useEffect(() => {
    if (lockedRef.current) return;
    // Once per storage key. `start` changes identity whenever isStarting flips, so without this guard a
    // failed start re-ran this effect and fired POST /mira/session again in a tight loop (until HTTP 429).
    // A retry after a failure is the visitor's explicit action (start/retry), never automatic.
    if (restoredKeyRef.current === (storageKey ?? "")) return;
    restoredKeyRef.current = storageKey ?? "";
    const browserSessionId = storageKey ? window.localStorage.getItem(storageKey) : null;

    (async () => {
      let storedSessionId = browserSessionId;
      if (!storedSessionId) {
        // An orientation started on another device or browser is resumed, never restarted from zero.
        try {
          const attemptsRes = await fetch("/api/mira?resource=attempts", fpInit({ cache: "no-store" }));
          const attempts = attemptsRes.ok ? ((await attemptsRes.json()) as { resumableSessionId?: string | null }) : null;
          storedSessionId = attempts?.resumableSessionId ?? null;
        } catch {
          storedSessionId = null;
        }
        if (storedSessionId && storageKey) window.localStorage.setItem(storageKey, storedSessionId);
      }
      if (!storedSessionId) {
        window.setTimeout(() => void start(preferredLanguage(langRef.current)), 0);
        return;
      }
      sessionRef.current = storedSessionId;
      startedRef.current = true;
      try {
        // 1) Durable transcript + status from Postgres (works even if the agent forgot the session).
        const historyRes = await fetch(`/api/mira?resource=history&sessionId=${encodeURIComponent(storedSessionId)}`, fpInit({ cache: "no-store" }));
        const history = (await historyRes.json()) as HistoryResponse & { error?: string };
        if (!historyRes.ok) throw new Error(history.error || "session expired");
        setSessionId(storedSessionId);

        sessionLanguageRef.current = history.language;
        setSessionLanguage(history.language);

        const restored: MiraMessage[] = history.messages.map((m) => ({
          id: uid("hist"),
          role: m.role,
          content: m.role === "assistant" ? withoutOptionLines(m.content) : m.content,
          chapter: (m.chapter as MiraChapter) ?? undefined,
          createdAt: m.createdAt,
        }));
        if (restored.length > 0) setMessages(restored);
        const lastProgress = history.messages.reduce((acc, m) => (typeof m.chapterProgress === "number" ? m.chapterProgress : acc), 0);
        setProgress(history.completed ? 1 : lastProgress);

        if (history.completed && history.result) {
          // Completed sessions never drop the visitor back into the chat flow.
          setResult(history.result);
          setSessionReady(true);
          return;
        }

        // 2) Confirm the agent can still resume this ACTIVE session (live safety/progress).
        const liveRes = await fetch(`/api/mira?sessionId=${encodeURIComponent(storedSessionId)}`, fpInit({ cache: "no-store" }));
        const live = (await liveRes.json()) as SessionResponse & { error?: string };
        if (liveRes.ok) {
          setProgress(live.chapter_progress);
          setQuestions(countOf(live));
          setSafety(live.safety);
          setOptions(live.options ?? []);
          if (restored.length === 0 && live.assistant_message && live.assessment_complete === false) {
            setMessages([{ id: uid("mira-resync"), role: "assistant", content: withoutOptionLines(live.assistant_message), chapter: live.chapter, createdAt: new Date().toISOString() }]);
          }
          if (live.complete && live.result) setResult(live.result);
          setSessionReady(true);
        } else if (restored.length > 0) {
          // Agent lost the session but we still have the transcript: show it, disable sending.
          setSessionReady(false);
          setError(errors.send);
        } else {
          throw new Error(live.error || "session expired");
        }
      } catch {
        if (storageKey) window.localStorage.removeItem(storageKey);
        sessionRef.current = null;
        sessionLanguageRef.current = null;
        setSessionLanguage(null);
        setSessionReady(false);
        setSessionId(null);
        setMessages([]);
        startedRef.current = false;
        void start();
      }
    })();
  }, [start, storageKey, errors.send, restoreTick]);

  const displayMessages = useMemo<MiraMessage[]>(
    () =>
      writing && streamText
        ? [...messages, { id: writing.key, renderKey: writing.key, role: "assistant", content: streamText, createdAt: writing.startedAt, streaming: true }]
        : messages,
    [messages, writing, streamText],
  );

  const sendMessage = useCallback(
    async (content: string, options: { resendOf?: string } = {}) => {
      const text = content.trim();
      const sid = sessionRef.current;
      const requestLanguage = sessionLanguageRef.current;
      if (!text || !sid || !requestLanguage || !sessionReady || isSending || result || lockedRef.current) return;
      setIsSending(true);
      setIsBotTyping(true);
      setPhase("reading");
      setError(null);
      setFailure(null);
      setSupport(null);
      const localId = uid("local");
      const key = `stream:${localId}`;
      // A retry replaces the unanswered attempt (and its unfinished reply) instead of stacking a second copy.
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== options.resendOf && m.renderKey !== `stream:${options.resendOf}`),
        { id: localId, role: "user", content: text, chapter, createdAt: new Date().toISOString() },
      ]);
      unanswered.current = { localId, text };
      const sentAt = performance.now();
      const reflectTimer = window.setTimeout(() => setPhase("reflecting"), READING_MS);
      const live = beginStream();
      let streamed = false;
      try {
        // The stream goes straight to the API (SSE must never pass through the Next proxy); if it cannot open,
        // the proxied synchronous endpoint answers and the reply simply arrives whole.
        const data = await streamWithFallback<SendResponse>({
          path: `/mira/session/${encodeURIComponent(sid)}/message/stream`,
          body: { text, language: requestLanguage },
          headers: fingerprintHeaders(),
          // Authenticated: an expired access token is refreshed and retried instead of failing the turn with a 401.
          signal: live.signal,
          onDelta: (delta) => {
            if (!streamed) {
              streamed = true;
              window.clearTimeout(reflectTimer);
              setPhase("typing");
              setWriting({ key, startedAt: new Date().toISOString() });
            }
            live.onDelta(delta);
          },
          sync: async () => {
            const response = await fetch("/api/mira", fpInit({
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "message", sessionId: sid, text, language: requestLanguage }),
            }));
            const body = (await response.json().catch(() => ({}))) as SendResponse & { error?: string; code?: string };
            if (!response.ok) throw new ApiError(body.error || body.assistant_message || errors.send, response.status, body.code, body);
            return body;
          },
        });
        if (!streamed) {
          // The reply came whole: read for a beat, then "type" for a length-proportional beat, as before.
          const waited = performance.now() - sentAt;
          if (waited < READING_MS) await sleep(READING_MS - waited);
          window.clearTimeout(reflectTimer);
          setPhase("typing");
          await sleep(typingDelay(data.assistant_message, performance.now() - sentAt));
        }
        unanswered.current = null;
        setProgress(data.chapter_progress);
        setQuestions((prev) => countOf(data) ?? prev);
        setSafety(data.safety);
        setOptions(data.options ?? []);
        // Nothing to read: Mira kept the question open and did not count it. Say so on both sides of the exchange.
        const unreadable = data.input_status === "invalid";
        // The final body is the source of truth; a streamed reply keeps its key so it never remounts.
        setMessages((prev) => [
          ...(unreadable ? prev.map((m) => (m.id === localId ? { ...m, notCounted: true } : m)) : prev),
          {
            id: uid("mira"),
            role: "assistant",
            content: withoutOptionLines(data.assistant_message),
            chapter: data.chapter,
            createdAt: new Date().toISOString(),
            renderKey: streamed ? key : undefined,
            notice: unreadable ? "unreadable" : undefined,
          },
        ]);
        if (data.assessment_complete && data.result) {
          setFinishedLive(true);
          setResult(data.result);
        }
      } catch (err) {
        const stopped = live.signal.aborted;
        const problem = classifyTurnFailure(err);
        if (err instanceof ApiError && err.code === ORIENTATION_CONSENT_REQUIRED) {
          setMessages((prev) => prev.filter((m) => m.id !== localId)); // it was never delivered: send it again after accepting
          unanswered.current = null;
          setConsentRequired(true);
          return;
        }
        if (err instanceof ApiError && err.code === ORIENTATION_COMPLETED) {
          lockedRef.current = true;
          setCompleted(true);
          setSessionReady(false);
          setMessages((prev) => prev.filter((m) => m.id !== localId)); // it was never delivered
          unanswered.current = null;
          return;
        }
        // Whatever was already written stays on screen; the visitor's own message always stays.
        const partialText = (streamSnapshot() || problem.partialText).trim();
        if (partialText) {
          setMessages((prev) => [
            ...prev,
            { id: key, renderKey: key, role: "assistant", content: partialText, createdAt: new Date().toISOString(), partial: stopped ? "stopped" : "interrupted" },
          ]);
        }
        if (!stopped) {
          if (problem.kind === "support") setSupport(problem.emergencyResources);
          else if (problem.kind === "other") setError(err instanceof Error && !(err instanceof ApiError) ? err.message : errors.send);
          else setFailure(problem.kind);
        }
      } finally {
        window.clearTimeout(reflectTimer);
        finishStream();
        setWriting(null);
        setIsSending(false);
        setIsBotTyping(false);
        setPhase(null);
      }
    },
    [beginStream, chapter, errors.send, finishStream, isSending, result, sessionReady, streamSnapshot],
  );

  /** Send the visitor's unanswered message again (from the unfinished reply's "Try again", or the error banner). */
  const retry = useCallback(() => {
    const last = unanswered.current;
    if (last) void sendMessage(last.text, { resendOf: last.localId });
  }, [sendMessage]);

  /** Finalize ("download report"): consumes one attempt. Idempotent; safe to call once per download. */
  const finalize = useCallback(async (): Promise<MiraAttemptState | null> => {
    const sid = sessionRef.current;
    if (!sid) return null;
    setIsFinalizing(true);
    try {
      const response = await fetch("/api/mira", fpInit({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finalize", sessionId: sid }),
      }));
      const data = (await response.json()) as { attempt?: MiraAttemptState };
      if (response.ok && data.attempt) {
        setAttempt(data.attempt);
        return data.attempt;
      }
    } catch {
      /* finalize is best-effort from the client's perspective; the DB stamp is what counts */
    } finally {
      setIsFinalizing(false);
    }
    return null;
  }, []);

  const restart = useCallback((nextLanguage?: Lang) => {
    if (lockedRef.current) return;
    sessionRef.current = null;
    sessionLanguageRef.current = null;
    startedRef.current = false;
    setMessages([]);
    setSessionId(null);
    setProgress(0);
    setQuestions(null);
    setSafety({ level: "routine", flags: [] });
    setOptions([]);
    setResult(null);
    setFinishedLive(false);
    setSessionLanguage(null);
    setSessionReady(false);
    setError(null);
    if (storageKey) window.localStorage.removeItem(storageKey);
    void start(nextLanguage);
  }, [start, storageKey]);

  /** Accept the consent text, then resume the SAME orientation: the open session when there is one, else the stored or account one. */
  const acceptConsent = useCallback(async () => {
    setConsentBusy(true);
    setConsentError(false);
    try {
      await profileApi.setOrientationConsent(true, CONSENT_VERSION);
      setConsentRequired(false);
      if (sessionRef.current) {
        setError(null);
      } else {
        restoredKeyRef.current = null;
        startedRef.current = false;
        setRestoreTick((n) => n + 1);
      }
    } catch {
      setConsentError(true);
    } finally {
      setConsentBusy(false);
    }
  }, []);

  return {
    messages: displayMessages,
    isStreaming: displayMessages.length > messages.length,
    stop: stopStream,
    retry,
    failure,
    support,
    dismissSupport: () => setSupport(null),
    sessionId,
    sessionLanguage: sessionLanguage ?? lang,
    chapter,
    progress,
    /** The agent's count (answered / live total, which grows past 16 with clarifications); null until known. */
    questions,
    isSending,
    isBotTyping,
    isStarting,
    isFinalizing,
    /** Current pacing beat while Mira prepares a reply (null when idle). */
    phase,
    error,
    safety,
    /** Answers to tap for the current situation; empty when typing is the only way to reply. */
    options,
    result,
    finishedLive,
    attempt,
    blocked,
    consentRequired,
    consentBusy,
    consentError,
    acceptConsent,
    /** Signed-in patient: orientation already completed, the chat is locked. */
    completed,
    assessmentComplete: Boolean(result),
    sendMessage,
    finalize,
    restart,
  };
}
