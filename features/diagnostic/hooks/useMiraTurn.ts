"use client";

import { useCallback, useMemo, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { ApiError } from "@/lib/api/client";
import { useTurnStream } from "@/hooks/patient/useTurnStream";
import { classifyTurnFailure, type TurnFailureKind } from "@/lib/patient/turn-errors";
import type { Lang } from "@/lib/i18n/config";
import { miraApi, ORIENTATION_COMPLETED, ORIENTATION_CONSENT_REQUIRED, TRACK_ASSIGNED_BY_CLINICIAN, type MiraTurn } from "../lib/mira-api";
import { paceWholeReply, READING_MS } from "../lib/pacing";
import { assistantMessage, countOf, uid, userMessage } from "../lib/transcript";
import type { MiraChapter, MiraMessage } from "../types";
import { lockConversation, type ConversationRefs, type ConversationSetters, type MiraConversation } from "./useMiraConversation";

type Unanswered = { localId: string; text: string };

/** Everything one turn's helpers touch: the conversation, the visitor's message, and where failures are reported. */
type TurnContext = {
  set: ConversationSetters;
  refs: ConversationRefs;
  localId: string;
  /** Stable React key of the reply, from its first streamed word to its final form. */
  key: string;
  unanswered: MutableRefObject<Unanswered | null>;
  setFailure: Dispatch<SetStateAction<TurnFailureKind | null>>;
  setSupport: Dispatch<SetStateAction<string[] | null>>;
  sendError: string;
  onConsentRequired: () => void;
};

/** The final body is the source of truth: progress, safety, the answers to tap, and the reply itself. */
function applyReply({ set, localId, key }: TurnContext, data: MiraTurn, streamed: boolean): void {
  set.setProgress(data.chapter_progress);
  set.setQuestions((prev) => countOf(data) ?? prev);
  set.setSafety(data.safety);
  set.setOptions(data.options);
  // Nothing to read: Mira kept the question open and did not count it. Say so on both sides of the exchange.
  const unreadable = data.input_status === "invalid";
  set.setMessages((prev) => [
    ...(unreadable ? prev.map((m) => (m.id === localId ? { ...m, notCounted: true } : m)) : prev),
    assistantMessage(data.assistant_message, data.chapter, { renderKey: streamed ? key : undefined, notice: unreadable ? "unreadable" : undefined }),
  ]);
  if (data.assessment_complete && data.result) {
    set.setFinishedLive(true);
    set.setResult(data.result);
  }
}

/** A refusal that means the message was never delivered: drop it and hand over (consent screen, or the lock). */
function handleRefusal(ctx: TurnContext, error: unknown): boolean {
  const code = error instanceof ApiError ? error.code : undefined;
  if (code !== ORIENTATION_CONSENT_REQUIRED && code !== ORIENTATION_COMPLETED && code !== TRACK_ASSIGNED_BY_CLINICIAN) return false;
  ctx.set.setMessages((prev) => prev.filter((m) => m.id !== ctx.localId));
  ctx.unanswered.current = null;
  if (code === ORIENTATION_CONSENT_REQUIRED) {
    ctx.onConsentRequired(); // sent again after accepting
  } else {
    lockConversation(ctx.set, ctx.refs);
    ctx.set.setSessionReady(false);
  }
  return true;
}

/** Whatever was already written stays on screen; the visitor's own message always stays; the reason is told calmly. */
function handleTurnError(ctx: TurnContext, error: unknown, stopped: boolean, received: string): void {
  if (handleRefusal(ctx, error)) return;
  const problem = classifyTurnFailure(error);
  const partialText = (received || problem.partialText).trim();
  if (partialText) {
    const kept: MiraMessage = { id: ctx.key, renderKey: ctx.key, role: "assistant", content: partialText, createdAt: new Date().toISOString(), partial: stopped ? "stopped" : "interrupted" };
    ctx.set.setMessages((prev) => [...prev, kept]);
  }
  if (stopped) return;
  if (problem.kind === "support") ctx.setSupport(problem.emergencyResources);
  else if (problem.kind === "other") ctx.set.setError(error instanceof Error && !(error instanceof ApiError) ? error.message : ctx.sendError);
  else ctx.setFailure(problem.kind);
}

/** Shows the visitor's message at once; a retry replaces the unanswered attempt (and its unfinished reply). */
function postUserMessage(ctx: TurnContext, text: string, chapter: MiraChapter, resendOf?: string): void {
  ctx.set.setMessages((prev) => [
    ...prev.filter((m) => m.id !== resendOf && m.renderKey !== `stream:${resendOf}`),
    userMessage(ctx.localId, text, chapter),
  ]);
  ctx.unanswered.current = { localId: ctx.localId, text };
}

type TurnRun = {
  sid: string;
  text: string;
  language: Lang;
  chapter: MiraChapter;
  resendOf?: string;
  stream: Pick<ReturnType<typeof useTurnStream>, "begin" | "finish" | "snapshot">;
  setWriting: Dispatch<SetStateAction<{ key: string; startedAt: string } | null>>;
  setIsSending: Dispatch<SetStateAction<boolean>>;
};

/** One whole turn: message shown, reading → reflecting → typing beats, the reply applied, or the failure told. */
async function runTurn(ctx: TurnContext, { sid, text, language, chapter, resendOf, stream, setWriting, setIsSending }: TurnRun): Promise<void> {
  const { set } = ctx;
  setIsSending(true);
  set.setIsBotTyping(true);
  set.setPhase("reading");
  set.setError(null);
  ctx.setFailure(null);
  ctx.setSupport(null);
  postUserMessage(ctx, text, chapter, resendOf);
  const sentAt = performance.now();
  const reflectTimer = window.setTimeout(() => set.setPhase("reflecting"), READING_MS);
  const onTyping = () => {
    window.clearTimeout(reflectTimer);
    set.setPhase("typing");
  };
  const live = stream.begin();
  let streamed = false;
  const onDelta = (delta: string) => {
    if (!streamed) {
      streamed = true;
      onTyping();
      setWriting({ key: ctx.key, startedAt: new Date().toISOString() });
    }
    live.onDelta(delta);
  };
  try {
    const data = await miraApi.reply(sid, text, language, { signal: live.signal, onDelta });
    if (!streamed) await paceWholeReply(data.assistant_message, sentAt, onTyping);
    ctx.unanswered.current = null;
    applyReply(ctx, data, streamed);
  } catch (err) {
    handleTurnError(ctx, err, live.signal.aborted, stream.snapshot());
  } finally {
    window.clearTimeout(reflectTimer);
    stream.finish();
    setWriting(null);
    setIsSending(false);
    set.setIsBotTyping(false);
    set.setPhase(null);
  }
}

type TurnOptions = { chapter: MiraChapter; sendError: string; onConsentRequired: () => void };

/** One exchange with Mira at a time: the visitor's message, the streamed (or whole, paced) reply, Stop and Try again. */
export function useMiraTurn(conv: MiraConversation, { chapter, sendError, onConsentRequired }: TurnOptions) {
  const { set, refs, sessionReady, result, messages } = conv;
  const [isSending, setIsSending] = useState(false);
  const [failure, setFailure] = useState<TurnFailureKind | null>(null);
  const [support, setSupport] = useState<string[] | null>(null);
  const [writing, setWriting] = useState<{ key: string; startedAt: string } | null>(null);
  const stream = useTurnStream();
  const { begin, finish, snapshot } = stream;
  const unanswered = useRef<Unanswered | null>(null);

  const sendMessage = useCallback(async (content: string, { resendOf }: { resendOf?: string } = {}) => {
    const text = content.trim();
    const sid = refs.session.current;
    const language = refs.language.current;
    if (!text || !sid || !language || !sessionReady || isSending || result || refs.locked.current) return;
    const localId = uid("local");
    const ctx: TurnContext = { set, refs, localId, key: `stream:${localId}`, unanswered, setFailure, setSupport, sendError, onConsentRequired };
    await runTurn(ctx, { sid, text, language, chapter, resendOf, stream: { begin, finish, snapshot }, setWriting, setIsSending });
  }, [begin, chapter, finish, isSending, onConsentRequired, refs, result, sendError, sessionReady, set, snapshot]);

  /** Send the visitor's unanswered message again (from the unfinished reply's "Try again", or the error banner). False when there is none. */
  const retry = useCallback((): boolean => {
    const last = unanswered.current;
    if (!last) return false;
    void sendMessage(last.text, { resendOf: last.localId });
    return true;
  }, [sendMessage]);

  const displayMessages = useMemo<MiraMessage[]>(
    () =>
      writing && stream.text
        ? [...messages, { id: writing.key, renderKey: writing.key, role: "assistant", content: stream.text, createdAt: writing.startedAt, streaming: true }]
        : messages,
    [messages, writing, stream.text],
  );

  return {
    messages: displayMessages,
    isStreaming: displayMessages.length > messages.length,
    stop: stream.stop,
    retry,
    failure,
    support,
    dismissSupport: () => setSupport(null),
    isSending,
    sendMessage,
  };
}
