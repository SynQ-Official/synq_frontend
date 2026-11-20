"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { ROUTES } from "@/lib/config/routes";
import { copy, type Lang } from "@/lib/i18n/config";
import { useComposer } from "../hooks/useComposer";
import { useMiraChat, type MiraChat } from "../hooks/useMiraChat";
import { chatView } from "../lib/chat-view";
import { useVisitorName } from "../lib/visitor";
import { MiraActiveChatView } from "./chat/MiraActiveChatView";
import { MiraCompletedView } from "./chat/MiraCompletedView";
import { MiraIntakeView } from "./chat/MiraIntakeView";
import { FINISH_STEP_MS } from "./FinishingScreen";

/**
 * A completed orientation lives on its own route — never fall back into the chat flow. Finished just now, the
 * hand-over takes a proper beat (the finishing screen); a restored one opens straight away.
 */
function useResultHandOff(result: MiraChat["result"], href: string | null, finishedLive: boolean): void {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const finishedAt = useRef<number | null>(null);
  useEffect(() => {
    if (!result || !href) return;
    // The route's code loads during the finishing beat; the hand-off is timed from the moment the result arrived,
    // so a re-run of this effect (re-render, hot refresh) never restarts it.
    router.prefetch(href);
    finishedAt.current ??= Date.now();
    const beat = finishedLive ? (reduceMotion ? 1400 : FINISH_STEP_MS * 3 + 1100) : 0;
    const timer = window.setTimeout(() => router.replace(href), Math.max(0, finishedAt.current + beat - Date.now()));
    return () => window.clearTimeout(timer);
  }, [result, href, finishedLive, reduceMotion, router]);
}

/** A language picked in the header restarts the conversation in that language (once per switch). */
function useLanguageSwitch(languageSwitch: { id: number; language: Lang } | null, onSwitch: (language: Lang) => void): void {
  const handled = useRef<number | null>(null);
  const latest = useRef(onSwitch);
  useEffect(() => {
    latest.current = onSwitch;
  });
  useEffect(() => {
    if (!languageSwitch || languageSwitch.id === handled.current) return;
    handled.current = languageSwitch.id;
    latest.current(languageSwitch.language);
  }, [languageSwitch]);
}

/**
 * MiraChatExperience — the orientation screen, one view per state: the consent to give first (`MiraIntakeView`),
 * the conversation itself (`MiraActiveChatView`), and the hand-over to the report once it is done (`MiraCompletedView`).
 * Replies are human-paced by `useMiraChat` (reading → reflecting → typing); Mira's reasoning is untouched.
 */
export function MiraChatExperience({ chatId, languageSwitch, locked = false }: {
  chatId: string;
  languageSwitch: { id: number; language: Lang } | null;
  /** Signed-in patient: the orientation is already completed, so the chat stays locked. */
  locked?: boolean;
}) {
  const { language } = useLanguage();
  const [nameSkipped, setNameSkipped] = useState(false);
  const { name, setName } = useVisitorName();
  const chat = useMiraChat(chatId, language, { locked });
  const resultHref = chat.sessionId ? `${ROUTES.orientation}/result/${encodeURIComponent(chat.sessionId)}` : null;
  useResultHandOff(chat.result, resultHref, chat.finishedLive);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const showNameIntake = !chat.completed && !chat.result && !name && !nameSkipped;
  const choiceOpen = chat.options.length > 0 && chat.safety.level !== "urgent";
  const idle = !chat.isSending && !chat.isBotTyping && !chat.isStarting;
  const { sendMessage } = chat;
  const composer = useComposer({
    language,
    canSubmit: idle && chat.sessionReady && !chat.result && !chat.completed && !choiceOpen,
    onSend: (text) => void sendMessage(text),
    refs: { inputRef, fileRef },
  });
  const view = chatView(chat, composer.input, showNameIntake);
  useLanguageSwitch(languageSwitch, (next) => {
    composer.clear();
    chat.restart(next);
  });

  return (
    <section dir={language === "ar" ? "rtl" : "ltr"} aria-label={copy[language].diagnostic.title} className="relative flex min-h-0 flex-1  flex-col overflow-y-auto overflow-x-clip text-ink">
      {chat.consentRequired ? (
        <MiraIntakeView language={language} busy={chat.consentBusy} failed={chat.consentError} onAccept={() => void chat.acceptConsent()} />
      ) : chat.result ? (
        <MiraCompletedView finishedLive={chat.finishedLive} total={view.position.total} href={resultHref} language={language} />
      ) : (
        <MiraActiveChatView
          chat={chat}
          composer={composer}
          inputRef={inputRef}
          fileRef={fileRef}
          view={view}
          chatId={chatId}
          language={language}
          name={name}
          showNameIntake={showNameIntake}
          onName={setName}
          onSkipName={() => setNameSkipped(true)}
        />
      )}
    </section>
  );
}
