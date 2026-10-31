"use client";

import Image from "next/image";
import { Check, CircleHelp, CircleSlash, Copy, Info, MessageCircleQuestion, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { MIRA_MARK_SRC } from "@/components/layout/site-header/AgentAvatar";
import { useLanguage } from "@/contexts/LanguageContext";
import { LANGS } from "@/lib/i18n/config";
import { EASE_OUT } from "@/lib/motion";
import { useSpeech } from "@/hooks/useSpeech";
import { cn } from "@/lib/utils";
import { LABEL, SERIF } from "@/components/home/typography";
import { MIRA_STREAM_COPY } from "../lib/stream-copy";
import { splitQuestion } from "../lib/question";
import { RichText } from "./RichText";
import { LogoSpinner } from "@/components/shared/LogoLoader";

interface MiraMessageProps {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  index: number;
  language: "en" | "ar";
  /** The reply is still being written. */
  streaming?: boolean;
  /** An unfinished reply that was kept; `onRetry` offers to send the visitor's message again. */
  partial?: "stopped" | "interrupted";
  onRetry?: () => void;
  /** Mira's calm reply to a message she could not read: set apart so it is clear nothing was counted. */
  notice?: "unreadable";
  /** The visitor's message that Mira did not count. */
  notCounted?: boolean;
}

/** Rendered size (px) of Mira's mark per avatar size. */
const AVATAR_SIZES = {
  sm: "size-9",
  md: "size-11",
  lg: "size-10 sm:size-12 lg:size-[3.25rem]",
  xl: "size-14",
} as const;

/** Mira's 3D mark on a luminous white disc. `presence` adds a calm "here with you" dot. */
export function MiraAvatar({
  className,
  size = "sm",
  presence = false,
}: {
  className?: string;
  size?: keyof typeof AVATAR_SIZES;
  presence?: boolean;
}) {
  return (
    <span aria-hidden className={cn("relative inline-flex shrink-0", className)}>
      <span className={cn("lm-logo-disc flex items-center justify-center rounded-full", AVATAR_SIZES[size])}>
        <Image src={MIRA_MARK_SRC} alt="" width={112} height={112} className="size-[86%] object-contain" />
      </span>
      {presence && (
        <span className="absolute -bottom-0.5 -end-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white">
          <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-sage opacity-50 motion-reduce:hidden" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-sage" />
        </span>
      )}
    </span>
  );
}

function Waveform() {
  return (
    <span className="flex h-3 items-center gap-[2px]" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="w-[2px] rounded-full bg-teal-600"
          animate={{ height: [4, 11, 4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

const ACTION_CLASS =
  "inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full px-3 text-sm font-medium text-ink-soft transition-[background-color,color] duration-200 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4";

/**
 * Conversation message.
 * Mira: avatar + a quiet white card (the question) + read-aloud / copy actions.
 * Visitor: a brand-teal answer bubble aligned to the end edge.
 */
/** Three soft dots in the card's own padding: no layout change when they leave. Still under reduced motion. */
function StreamingDots() {
  const reduce = useReducedMotion();
  return (
    <span className="pointer-events-none absolute bottom-1.5 end-5 flex items-center gap-1" role="presentation">
      {[0, 1, 2].map((dot) => (
        <motion.span
          key={dot}
          aria-hidden
          className="size-1 rounded-full bg-teal-500/80"
          animate={reduce ? { opacity: 0.7 } : { opacity: [0.25, 1, 0.25] }}
          transition={reduce ? undefined : { duration: 1.2, repeat: Infinity, delay: dot * 0.18 }}
        />
      ))}
    </span>
  );
}

export function MiraMessage({ content, role, createdAt, index, language, streaming = false, partial, onRetry, notice, notCounted }: MiraMessageProps) {
  const { dictionary } = useLanguage();
  const streamCopy = MIRA_STREAM_COPY[language];
  const diagnostic = dictionary.diagnostic;
  const isUser = role === "user";
  const { state: speech, toggle } = useSpeech(content, language);
  const [copied, setCopied] = useState(false);

  const time = (() => {
    if (!createdAt) return "";
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return "";
    const locale = LANGS.find((l) => l.code === language)?.bcp47 ?? "en-US";
    return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", numberingSystem: "latn" });
  })();

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const speaking = speech === "speaking" || speech === "loading";
  const split = useMemo(() => splitQuestion(content), [content]);

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: EASE_OUT }}
        className="flex w-full justify-end"
      >
        <div className="flex max-w-[92%] flex-col items-end gap-1 sm:max-w-[84%]">
          <span className="px-1 text-[0.75rem] font-medium text-ink-soft">
            {diagnostic.youLabel}
            {time && <time className="ms-1.5 tabular-nums text-ink-muted">{time}</time>}
          </span>
          <div className="max-w-full rounded-[1.375rem] rounded-se-md bg-[linear-gradient(135deg,var(--color-teal-700),var(--color-teal-900))] px-5 py-3.5 text-white shadow-[0_14px_30px_-16px_rgb(17_76_97/0.7)]">
            {/* The visitor's own words, line breaks kept; each line takes its own direction (Arabic and English mixed). */}
            <p className="whitespace-pre-line text-[0.9375rem] leading-7 [overflow-wrap:anywhere] [unicode-bidi:plaintext] sm:text-base">{content}</p>
          </div>
          {notCounted && (
            <span className="inline-flex items-center gap-1.5 px-1 text-[0.75rem] font-medium text-gold-700">
              <CircleSlash className="size-3.5" aria-hidden />
              {diagnostic.notCounted}
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.article
      aria-label={diagnostic.miraLabel}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.2), ease: EASE_OUT }}
      className="flex w-full gap-3 sm:gap-4"
    >
      <MiraAvatar size="lg" />
      <div className="min-w-0 max-w-[95%] flex-1 sm:max-w-[90%] lg:max-w-[min(84%,60rem)]">
        <p className="flex flex-wrap items-baseline gap-x-2.5 px-1 pt-1">
          <span className={cn(SERIF, "text-[1.1875rem] font-normal tracking-[-0.01em] text-ink rtl:tracking-normal sm:text-[1.3125rem]")}>{diagnostic.miraLabel}</span>
          <span className="text-[0.8125rem] text-ink-soft">{diagnostic.aiGuide}</span>
          {time && <time className="text-[0.8125rem] tabular-nums text-ink-muted">{time}</time>}
        </p>

        <div
          className={cn(
            "relative mt-2 rounded-[1.375rem] rounded-ss-md border px-5 py-4 sm:px-6",
            notice ? "border-gold-100 bg-gold-50" : "border-teal-100 bg-teal-50/70",
          )}
        >
          {notice && (
            <p className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[0.8125rem] font-semibold text-gold-700 ring-1 ring-gold-100">
              <Info className="size-3.5" aria-hidden />
              {diagnostic.notCountedHint}
            </p>
          )}
          {/* Polite live region, busy while the reply is being written: assistive tech reads it once it is complete. */}
          <div aria-live="polite" aria-busy={streaming || undefined}>
            {split.lead && <RichText content={split.lead} className="text-base leading-7 text-ink-soft break-words sm:text-[1.0625rem]" />}
            {split.question && (split.label ? (
              // Labelled question: a quiet white block; situations get a gold edge so a scenario reads as one.
              <section
                aria-label={split.label}
                className={cn(
                  "rounded-2xl border bg-white px-4 py-3.5 shadow-xs sm:px-5 sm:py-4",
                  split.lead && "mt-4",
                  split.kind === "situation" ? "border-gold-100 border-s-[3px] border-s-gold-300" : "border-teal-100",
                )}
              >
                <p className={cn(LABEL, "mb-2 flex items-center gap-1.5", split.kind === "situation" ? "text-gold-700" : "text-teal-700")}>
                  {split.kind === "situation" ? <MessageCircleQuestion className="size-3.5" aria-hidden /> : <CircleHelp className="size-3.5" aria-hidden />}
                  {split.label}
                </p>
                <RichText content={split.question} className="text-base font-medium leading-7 text-ink break-words sm:text-[1.0625rem]" />
              </section>
            ) : (
              <RichText content={split.question} className={cn("text-base font-medium leading-7 text-ink break-words sm:text-[1.0625rem]", split.lead && "mt-3")} />
            ))}
          </div>
          {streaming && <StreamingDots />}
        </div>

        {partial && onRetry && (
          <p role="status" className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[0.8125rem] text-ink-soft">
            <span>{partial === "stopped" ? streamCopy.stopped : streamCopy.interrupted}</span>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-teal-200 bg-white px-3.5 text-xs font-medium text-teal-800 transition-colors hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
            >
              <RotateCcw className="size-3" aria-hidden />
              {streamCopy.tryAgain}
            </button>
          </p>
        )}

        <div className={cn("mt-2 flex flex-wrap items-center gap-1", (streaming || partial) && "hidden")}>
          <button
            type="button"
            onClick={toggle}
            disabled={speech === "unsupported"}
            aria-label={speaking ? diagnostic.stopListening : diagnostic.listen}
            className={cn(ACTION_CLASS, speaking && "bg-white text-teal-800")}
          >
            {speech === "loading" ? (
              <LogoSpinner size={18} />
            ) : speaking ? (
              <Waveform />
            ) : (
              <Volume2 aria-hidden />
            )}
            <span aria-live="polite">
              {speech === "loading" ? diagnostic.voiceLoading : speaking ? diagnostic.listening : diagnostic.listen}
            </span>
            {speech === "speaking" && <VolumeX className="opacity-60" aria-hidden />}
          </button>

          <button type="button" onClick={copyText} className={ACTION_CLASS} aria-label={copied ? diagnostic.copiedMessage : diagnostic.copyMessage}>
            {copied ? <Check className="text-sage-700" aria-hidden /> : <Copy aria-hidden />}
            <span className="hidden sm:inline">{copied ? diagnostic.copiedMessage : diagnostic.copyMessage}</span>
          </button>
        </div>

        {speech === "error" && (
          <p role="alert" className="mt-1 px-1 text-xs text-rose-700">
            {diagnostic.voiceError}
          </p>
        )}
      </div>
    </motion.article>
  );
}
