"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { copy, type Lang } from "@/lib/i18n/config";
import type { MiraChat } from "../../hooks/useMiraChat";
import { MiraMessage } from "../MiraMessage";
import { NameIntake } from "../NameIntake";
import { CompletedNote, GreetingPill, MiraTyping } from "./ChatBits";

type TranscriptProps = {
  chat: MiraChat;
  language: Lang;
  name: string;
  busy: boolean;
  showNameIntake: boolean;
  onName: (name: string) => void;
  onSkipName: () => void;
};

/** The scrolling conversation: greeting, the visitor's name (once), the messages and Mira's typing beat. */
export function MiraTranscript({ chat, language, name, busy, showNameIntake, onName, onSkipName }: TranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, isBotTyping, phase, result, isStreaming } = chat;
  // The visitor's latest message has no reply yet: on its way while sending, not delivered once the turn failed.
  const last = messages.at(-1);
  const pendingId = last?.role === "user" ? last.id : null;
  const pendingStatus = chat.isSending ? "sending" : chat.failure || chat.error ? "failed" : undefined;
  useEffect(() => {
    // While a reply is being written, follow it without queueing smooth scrolls.
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: isStreaming ? "auto" : "smooth" });
  }, [messages, isBotTyping, phase, result, isStreaming]);

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-live="polite"
      aria-label={copy[language].diagnostic.title}
      tabIndex={0}
      className="diagnostic-scroll-area min-h-0 flex-1 overflow-y-auto overscroll-contain focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-500"
    >
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-5 sm:space-y-7 sm:px-8 sm:py-8">
        {name && (
          <div className="flex justify-center">
            <GreetingPill name={name} language={language} />
          </div>
        )}
        {chat.completed && <CompletedNote language={language} />}
        {showNameIntake && <NameIntake onSubmit={onName} onSkip={onSkipName} />}
        {messages.map((message, index) => (
          <MiraMessage
            key={message.renderKey ?? message.id}
            streaming={message.streaming}
            partial={message.partial}
            notice={message.notice}
            notCounted={message.notCounted}
            status={message.id === pendingId ? pendingStatus : undefined}
            onRetry={chat.retry}
            id={message.id}
            role={message.role}
            content={message.content}
            language={language}
            createdAt={message.createdAt}
            index={index}
          />
        ))}
        <AnimatePresence>{busy && !isStreaming && <MiraTyping key="typing" phase={phase} language={language} />}</AnimatePresence>
      </div>
    </div>
  );
}
