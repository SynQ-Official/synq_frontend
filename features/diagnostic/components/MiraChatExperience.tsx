"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ChartLine,
  ChartNoAxesColumn,
  Cloud,
  Heart,
  Info,
  Lightbulb,
  Lock,
  Mic,
  MicOff,
  Paperclip,
  SendHorizontal,
  ShieldCheck,
  Smile,
  Sparkle,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/config/routes";
import { copy, LANGS, type Lang } from "@/lib/i18n/config";
import { fill } from "@/lib/i18n/format";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useMiraChat, type MiraPhase } from "../hooks/useMiraChat";
import { questionPosition } from "../lib/chapters";
import { hasReadableContent } from "../lib/input";
import { MIRA_STREAM_COPY } from "../lib/stream-copy";
import { useVisitorName } from "../lib/visitor";
import { FINISH_STEP_MS, FinishingScreen } from "./FinishingScreen";
import { MiraAvatar, MiraMessage } from "./MiraMessage";
import { LastAttemptNotice } from "./LastAttemptNotice";
import { NameIntake } from "./NameIntake";
import { CompactProgress, SessionRail } from "./SessionProgress";
import { TypingIndicator } from "./TypingIndicator";
import { LogoSpinner } from "@/components/shared/LogoLoader";
import { LABEL } from "@/components/home/typography";
import { SupportCard } from "@/components/patient/ui/SupportCard";

type IconType = ComponentType<{ className?: string }>;

/** Icon per suggestion chip / trust item, in the dictionary's order. */
const SUGGESTION_ICONS: IconType[] = [Smile, Cloud, ChartLine, Lightbulb];
const TRUST_ICONS: IconType[] = [Lock, Sparkle, Heart, ChartNoAxesColumn];

/** Mira preparing a reply: avatar + dots + the current beat (reading → reflecting → typing). */
function MiraTyping({ phase, language }: { phase: MiraPhase | null; language: Lang }) {
  const diagnostic = copy[language].diagnostic;
  const label = phase ? diagnostic.phases[phase] : diagnostic.thinking;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, transition: { duration: 0.15 } }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      className="flex items-center gap-3 sm:gap-4"
      role="status"
      aria-live="polite"
    >
      <MiraAvatar size="lg" />
      <span className="inline-flex min-h-12 items-center gap-3 rounded-[1.375rem] rounded-ss-md border border-teal-100 bg-teal-50/70 px-5">
        <TypingIndicator />
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={label}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.2 }}
            className="text-[0.9375rem] text-ink-soft"
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.div>
  );
}

function GreetingPill({ name, language, className }: { name: string; language: Lang; className?: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-teal-100 bg-teal-50 px-4 py-2.5 text-[0.9375rem] font-semibold text-ink",
        className,
      )}
    >
      <span aria-hidden className="h-2 w-2 rounded-full bg-sage shadow-[0_0_0_3px_rgb(120_174_170/0.2)]" />
      {fill(copy[language].diagnostic.greetingPill, { name })}
    </motion.p>
  );
}

type SpeechRecognitionType = {
  new(): {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    onresult:
    | ((
      event: {
        resultIndex: number;
        results: ArrayLike<{ isFinal: boolean } & ArrayLike<{ transcript: string }>>;
      },
    ) => void)
    | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
  };
};

function getSpeechRecognition(): SpeechRecognitionType | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition || w.webkitSpeechRecognition) as SpeechRecognitionType | null;
}

/**
 * MiraChatExperience — guided orientation layout (mira_interface.jpeg).
 *
 * Desktop: a frosted session rail (headline, questions ring, today's focus, privacy)
 * beside a frosted conversation pane. Mobile/tablet: compact progress above the pane.
 * The transcript is the only scroll area while chatting. Replies are human-paced by
 * `useMiraChat` (reading → reflecting → typing); Mira's reasoning is untouched.
 */
export function MiraChatExperience({
  chatId,
  languageSwitch,
  locked = false,
}: {
  chatId: string;
  languageSwitch: { id: number; language: Lang } | null;
  /** Signed-in patient: the orientation is already completed, so the chat stays locked. */
  locked?: boolean;
}) {
  const router = useRouter();
  const { language } = useLanguage();
  const [input, setInput] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [dictating, setDictating] = useState(false);
  const [dictationSupported, setDictationSupported] = useState(false);
  const [nameSkipped, setNameSkipped] = useState(false);

  const { name, setName } = useVisitorName();

  const {
    messages,
    sessionId,
    chapter,
    progress,
    questions,
    isSending,
    isBotTyping,
    isStarting,
    isStreaming,
    stop,
    retry,
    failure,
    support,
    dismissSupport,
    phase,
    error,
    safety,
    options,
    result,
    finishedLive,
    attempt,
    blocked,
    consentRequired,
    consentBusy,
    consentError,
    acceptConsent,
    completed,
    sessionLanguage,
    sendMessage,
    restart,
  } = useMiraChat(chatId, language, { locked });

  // A completed orientation lives on its own route — never fall back into the chat flow. When it has just been
  // finished, the hand-over takes a proper beat (the finishing screen); a restored one opens straight away.
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (!result || !sessionId) return;
    const wait = finishedLive ? (reduceMotion ? 1400 : FINISH_STEP_MS * 3 + 1100) : 0;
    const timer = window.setTimeout(() => router.replace(`${ROUTES.orientation}/result/${encodeURIComponent(sessionId)}`), wait);
    return () => window.clearTimeout(timer);
  }, [result, sessionId, finishedLive, reduceMotion, router]);

  const showNameIntake = !blocked && !completed && !result && !name && !nameSkipped;
  const conversationLanguage = language;
  const dictionary = copy[language];
  const diagnostic = dictionary.diagnostic;
  const streamCopy = MIRA_STREAM_COPY[language];
  const failureText =
    failure === "offline" ? streamCopy.offline
    : failure === "rateLimited" ? streamCopy.rateLimited
    : failure === "timeout" ? streamCopy.slow
    : failure === "interrupted" ? streamCopy.interrupted
    : null;

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recognizerRef = useRef<{ stop: () => void } | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const languageSwitchRef = useRef<number | null>(null);
  const busy = isSending || isBotTyping || isStarting;

  useEffect(() => {
    if (!languageSwitch || languageSwitch.id === languageSwitchRef.current) return;
    languageSwitchRef.current = languageSwitch.id;
    recognizerRef.current?.stop();
    recognizerRef.current = null;
    setDictating(false);
    setInput("");
    restart(languageSwitch.language);
  }, [languageSwitch, restart, sessionLanguage]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDictationSupported(getSpeechRecognition() !== null), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const showHint = (text: string) => {
    setHint(text);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(null), 4000);
  };

  useEffect(() => {
    // While a reply is being written, follow it without queueing smooth scrolls.
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: isStreaming ? "auto" : "smooth" });
  }, [messages, isBotTyping, phase, result, isStreaming]);

  useEffect(() => {
    return () => {
      recognizerRef.current?.stop();
      if (hintTimer.current) clearTimeout(hintTimer.current);
    };
  }, []);

  function handleSend() {
    const text = input.trim();
    if (!text || busy || result || completed) return;
    // A choice question is open: the answer is one of the options, never typed text.
    if (options.length > 0 && safety.level !== "urgent") return;
    // Only symbols or spaces: nothing Mira could read as an answer. Say so here instead of sending it.
    if (!hasReadableContent(text)) {
      showHint(diagnostic.unreadableHint);
      return;
    }
    stopDictation();
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    void sendMessage(text);
  }

  function stopDictation() {
    recognizerRef.current?.stop();
    recognizerRef.current = null;
    setDictating(false);
  }

  function toggleDictation() {
    if (dictating) {
      stopDictation();
      return;
    }
    const SR = getSpeechRecognition();
    if (!SR) {
      showHint(diagnostic.composerDictationUnsupported);
      return;
    }
    try {
      const rec = new SR();
      rec.lang = LANGS.find((l) => l.code === conversationLanguage)?.bcp47 ?? "en-US";
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.onresult = (event) => {
        let chunk = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) chunk += res[0]?.transcript ?? "";
        }
        if (chunk.trim()) {
          setInput((prev) => {
            const base = prev.replace(/\s+$/, "");
            return `${base}${base ? " " : ""}${chunk.trim()} `;
          });
        }
      };
      rec.onerror = () => {
        stopDictation();
        showHint(diagnostic.voiceError);
      };
      rec.onend = () => {
        recognizerRef.current = null;
        setDictating(false);
      };
      recognizerRef.current = rec;
      rec.start();
      setDictating(true);
    } catch {
      showHint(diagnostic.voiceError);
    }
  }

  function handleAttachClick() {
    fileRef.current?.click();
  }

  function handleFilePicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const okType = /\.txt$|\.md$/i.test(file.name) || file.type.startsWith("text/");
    if (!okType) {
      showHint(diagnostic.composerAttachHint);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "").slice(0, 2000).trim();
      if (!text) {
        showHint(diagnostic.composerAttachHint);
        return;
      }
      setInput((prev) => `${prev}${prev.trim() ? "\n\n" : ""}--- ${file.name} ---\n${text}`);
      inputRef.current?.focus();
    };
    reader.onerror = () => showHint(diagnostic.voiceError);
    reader.readAsText(file);
  }

  const position = questionPosition(progress, questions);
  const showAlmostThere = !completed && !result && !error && safety.level !== "urgent" && progress >= 0.7 && position.remaining > 0;
  const unreadableDraft = input.trim().length > 0 && !hasReadableContent(input);
  // Mira is asking a choice question (backend input_enabled = false): tapping an option is the only way to answer.
  const choiceOnly = options.length > 0 && !completed && safety.level !== "urgent";
  const choiceHint = conversationLanguage === "ar" ? "اختر الإجابة الأنسب" : "Tap the answer that fits best";
  const canSend = Boolean(input.trim()) && !unreadableDraft && !busy && !completed && !choiceOnly;
  const showSuggestions = !completed && !result && !input.trim() && messages.length <= 1 && !showNameIntake && !choiceOnly;
  const multiline = input.includes("\n") || input.length > 90;

  return (
    <section
      dir={language === "ar" ? "rtl" : "ltr"}
      aria-label={diagnostic.title}
      className="relative flex min-h-0 flex-1  flex-col overflow-y-auto overflow-x-clip text-ink"
    >
      {consentRequired ? (
        <div className="relative mx-auto flex w-full max-w-lg flex-1 items-center px-4 py-10">
          <div className="orientation-glass w-full p-6 text-center sm:p-8" role="alertdialog" aria-labelledby="mira-consent-title" aria-describedby="mira-consent-body">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-teal-700 shadow-xs">
              <ShieldCheck className="h-6 w-6" aria-hidden />
            </span>
            <h1 id="mira-consent-title" className="mt-4 text-xl font-semibold text-ink">{diagnostic.consent.title}</h1>
            <p id="mira-consent-body" className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-muted">{diagnostic.consent.body}</p>
            <p className="mx-auto mt-3 max-w-sm text-xs leading-5 text-ink-muted">{diagnostic.consent.once}</p>
            {consentError && <p role="alert" className="mt-3 text-sm text-rose-700">{diagnostic.consent.error}</p>}
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              <Button variant="default" size="lg" disabled={consentBusy} onClick={() => void acceptConsent()}>
                {consentBusy ? diagnostic.consent.accepting : diagnostic.consent.accept}
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={ROUTES.support}>{diagnostic.consent.support}</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : blocked ? (
        <div className="relative mx-auto flex w-full max-w-lg flex-1 items-center px-4 py-10">
          <div className="orientation-glass w-full p-6 text-center sm:p-8">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-teal-700 shadow-xs">
              <ShieldCheck className="h-6 w-6" aria-hidden />
            </span>
            <h1 className="mt-4 text-xl font-semibold text-ink">{diagnostic.blocked.title}</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-muted">{diagnostic.blocked.body}</p>
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              <Button asChild variant="default" size="lg">
                <Link href={ROUTES.dashboard}>{diagnostic.blocked.cta}</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={ROUTES.support}>{diagnostic.blocked.support}</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : result ? (
        finishedLive ? (
          <FinishingScreen total={position.total} />
        ) : (
          <div className="relative flex min-h-[24rem] flex-1 items-center justify-center px-4" role="status">
            <span className="orientation-glass inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-medium text-ink">
              <LogoSpinner size={16} />
              {diagnostic.resultPage.loading}
            </span>
          </div>
        )
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
          className={cn(
            "relative mx-auto grid min-h-0 w-full flex-1 grid-rows-[minmax(0,1fr)] gap-2 px-0 pb-0 pt-2 sm:gap-5 sm:px-6 sm:pb-4 sm:pt-4 lg:min-h-[34rem] lg:gap-6 lg:px-8 lg:pb-6 lg:pt-5",
            completed ? "max-w-4xl" : "max-w-chat lg:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[21.5rem_minmax(0,1fr)]",
          )}
        >
          {!completed && <SessionRail chapter={chapter} progress={progress} questions={questions} language={conversationLanguage} name={name} className="hidden lg:flex" />}

          <div className="flex min-h-0 min-w-0 flex-col gap-3">
            {!completed && <CompactProgress chapter={chapter} progress={progress} questions={questions} language={conversationLanguage} className="max-sm:mx-3 lg:hidden" />}

            <AnimatePresence>
              {safety.level === "urgent" && (
                <motion.div
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3.5 max-sm:mx-3"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-rose-700">{diagnostic.urgentTitle}</p>
                    <p className="mt-1 text-[0.8125rem] leading-5 text-rose-700/90">{diagnostic.urgentBody}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <LastAttemptNotice
              chatId={chatId}
              show={Boolean(attempt?.isLastAttempt) && !completed && safety.level !== "urgent"}
              title={diagnostic.lastAttempt.title}
              body={diagnostic.lastAttempt.body}
              closeLabel={dictionary.common.close}
              className="max-sm:mx-3"
            />

            {/* ── Conversation pane ── */}
            <div className="orientation-glass relative flex min-h-0 flex-1 flex-col overflow-hidden max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0">
              <div
                ref={scrollRef}
                role="log"
                aria-live="polite"
                aria-label={diagnostic.title}
                tabIndex={0}
                className="diagnostic-scroll-area min-h-0 flex-1 overflow-y-auto overscroll-contain focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-500"
              >
                <div className="mx-auto w-full max-w-4xl space-y-7 px-4 py-6 sm:px-8 sm:py-9">
                  {name && (
                    <div className="flex justify-end">
                      <GreetingPill name={name} language={conversationLanguage} />
                    </div>
                  )}

                  {completed && (
                    <motion.div
                      role="alert"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, ease: EASE_OUT }}
                      className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-[1.375rem] border border-gold-100 bg-gold-50/60 px-6 py-8 text-center sm:px-10"
                    >
                      <MiraAvatar size="xl" />
                      <div className="min-w-0">
                        <p className="flex items-center justify-center gap-2 text-lg font-semibold text-ink">
                          <ShieldCheck className="h-5 w-5 shrink-0 text-teal-700" aria-hidden />
                          {diagnostic.completed.title}
                        </p>
                        <p className="mx-auto mt-2 max-w-md text-[0.9375rem] leading-7 text-ink-soft">{diagnostic.completed.body}</p>
                      </div>
                    </motion.div>
                  )}

                  {showNameIntake && <NameIntake onSubmit={(value) => setName(value)} onSkip={() => setNameSkipped(true)} />}

                  {messages.map((message, index) => (
                    <MiraMessage
                      key={message.renderKey ?? message.id}
                      streaming={message.streaming}
                      partial={message.partial}
                      notice={message.notice}
                      notCounted={message.notCounted}
                      onRetry={retry}
                      id={message.id}
                      role={message.role}
                      content={message.content}
                      language={conversationLanguage}
                      createdAt={message.createdAt}
                      index={index}
                    />
                  ))}

                  <AnimatePresence>{busy && !isStreaming && <MiraTyping key="typing" phase={phase} language={conversationLanguage} />}</AnimatePresence>
                </div>
              </div>

              {/* ── Composer ── */}
              <div className="mx-auto w-full max-w-4xl px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:pb-5">
                {support && (
                  <SupportCard resources={support} labels={streamCopy.support} onHide={dismissSupport} className="mb-3" />
                )}

                <AnimatePresence initial={false}>
                  {failureText && !error && (
                    <motion.p
                      role="status"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: EASE_OUT }}
                      className="mb-3 flex flex-wrap items-center justify-between gap-2 overflow-hidden rounded-2xl border border-teal-100 bg-teal-50/80 px-3.5 py-2 text-[0.8125rem] text-teal-900"
                    >
                      <span className="min-w-0 flex-1">{failureText}</span>
                      <Button type="button" variant="outline" size="sm" onClick={retry} className="rounded-full">
                        {streamCopy.tryAgain}
                      </Button>
                    </motion.p>
                  )}
                </AnimatePresence>

                <AnimatePresence initial={false}>
                  {error && (
                    <motion.div
                      role="alert"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: EASE_OUT }}
                      className="overflow-hidden"
                    >
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-3.5 py-2">
                        <p className="min-w-0 flex-1 text-[0.8125rem] font-medium text-rose-700">{error}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => (input.trim() ? handleSend() : retry())}
                          className="border-rose-100 text-rose-700 hover:border-rose hover:bg-white hover:text-rose-700"
                        >
                          {diagnostic.retry}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!error && isStarting && messages.length === 0 && (
                  <p role="status" className="mb-3 text-center text-xs text-ink-muted">
                    {diagnostic.reconnecting}
                  </p>
                )}
                {(hint || dictating) && (
                  <p role="status" className="mb-3 text-center text-xs font-medium text-teal-700">
                    {dictating ? diagnostic.composerDictationLive : hint}
                  </p>
                )}

                <AnimatePresence initial={false}>
                  {showAlmostThere && (
                    <motion.p
                      role="status"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: EASE_OUT }}
                      className="mb-3 flex items-center gap-2 rounded-2xl border border-gold-100 [@media(max-height:44rem)]:hidden bg-[linear-gradient(90deg,var(--color-gold-50),var(--color-teal-50))] px-3.5 py-2 text-[0.8125rem] font-medium text-ink-soft rtl:bg-[linear-gradient(270deg,var(--color-gold-50),var(--color-teal-50))]"
                    >
                      <Sparkles className="h-4 w-4 shrink-0 text-gold-600" aria-hidden />
                      {fill(diagnostic.almostThere, { count: position.remaining })}
                    </motion.p>
                  )}
                </AnimatePresence>

                <AnimatePresence initial={false}>
                  {showSuggestions && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.15 }}
                      className="mb-4 rounded-[1.25rem] border border-teal-100 bg-teal-50/50 p-3 sm:p-4 [@media(max-height:44rem)]:hidden"
                    >
                      <p className={cn(LABEL, "mb-3 flex items-center gap-2 px-1 text-ink-soft")}>
                        {diagnostic.suggestionsLabel}
                        <Sparkle className="h-3.5 w-3.5 text-gold-600" aria-hidden />
                      </p>
                      <div className="flex flex-wrap gap-2 sm:gap-2.5">
                        {diagnostic.suggestions.map((chip, i) => {
                          const Icon = SUGGESTION_ICONS[i] ?? Sparkle;
                          return (
                            <motion.button
                              key={chip}
                              type="button"
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                setInput(`${chip} `);
                                inputRef.current?.focus();
                              }}
                              className="group inline-flex min-h-11 cursor-pointer items-center gap-2.5 rounded-full border border-line bg-white/85 px-4 text-sm text-ink-soft shadow-xs transition-[border-color,background-color,color,box-shadow] duration-200 hover:border-teal-200 hover:bg-white hover:text-teal-800 hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 sm:min-h-12 sm:px-5 sm:text-[0.9375rem]"
                            >
                              <Icon className="h-[1.125rem] w-[1.125rem] shrink-0 text-ink-muted transition-colors duration-200 group-hover:text-teal-700" />
                              {chip}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {options.length > 0 && !busy && !completed && safety.level !== "urgent" && (
                  <div role="group" aria-labelledby="mira-options-label" className="mb-3 rounded-[1.25rem] border border-teal-100 bg-teal-50/50 p-3 sm:p-4">
                    <p id="mira-options-label" className={cn(LABEL, "mb-3 px-1 text-ink-soft")}>{choiceHint}</p>
                    {/* Short answers: two per row on phones, one row from tablet up; long ones wrap inside their button. */}
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2.5">
                      {options.map((option) => (
                        <motion.button
                          key={option.id}
                          type="button"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => void sendMessage(`${option.emoji} ${option.text}`.trim())}
                          className="group inline-flex min-h-12 min-w-0 cursor-pointer items-center gap-2.5 rounded-2xl border border-line bg-white py-2 ps-2 pe-4 text-start text-[0.9375rem] font-medium text-ink shadow-xs transition-[border-color,background-color,color,box-shadow] duration-200 hover:border-teal-300 hover:bg-teal-50/60 hover:text-teal-900 hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 active:border-teal-500 sm:min-w-32 sm:text-base"
                        >
                          <span aria-hidden className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-sm font-semibold text-teal-800 transition-colors duration-200 group-hover:border-teal-600 group-hover:bg-teal-700 group-hover:text-white">
                            {option.label}
                          </span>
                          {option.emoji ? <span aria-hidden>{option.emoji}</span> : null}
                          <span className="min-w-0 break-words">{option.text}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                <label htmlFor="mira-input" className="sr-only">
                  {diagnostic.inputLabel}
                </label>
                <div
                  className={cn(
                    "flex items-end gap-1 border border-line-strong bg-white p-2 shadow-[var(--shadow-soft)] transition-[border-color,box-shadow,border-radius] duration-300 ease-out-soft focus-within:border-teal-300 focus-within:shadow-[0_0_0_4px_rgb(91_144_145/0.14),var(--shadow-soft)] sm:p-2.5",
                    multiline ? "rounded-[1.75rem]" : "rounded-full",
                    completed && "cursor-not-allowed bg-white/60 opacity-70",
                    // A choice question is answered by tapping; a disabled text box beside the options only confuses.
                    choiceOnly && "hidden",
                  )}
                  aria-disabled={completed || undefined}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".txt,.md,text/plain"
                    aria-hidden
                    tabIndex={-1}
                    className="hidden"
                    onChange={handleFilePicked}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleAttachClick}
                    disabled={completed || choiceOnly}
                    aria-label={diagnostic.composerAttach}
                    title={diagnostic.composerAttach}
                    className="hidden h-11 w-11 rounded-full text-ink-muted hover:bg-teal-50 hover:text-teal-800 sm:inline-flex"
                  >
                    <Paperclip aria-hidden />
                  </Button>

                  <textarea
                    id="mira-input"
                    ref={inputRef}
                    value={input}
                    rows={1}
                    onChange={(event) => {
                      setInput(event.target.value);
                      event.target.style.height = "auto";
                      event.target.style.height = `${Math.min(event.target.scrollHeight, 140)}px`;
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={completed ? diagnostic.completed.inputDisabled : choiceOnly ? choiceHint : diagnostic.placeholder}
                    disabled={busy || completed || choiceOnly}
                    aria-describedby="mira-session-meta"
                    // `!`: the global :focus-visible outline would draw a square inside the pill; the pill's focus-within ring shows focus.
                    className="max-h-[min(140px,22dvh)] min-h-11 min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-base leading-6 text-ink !outline-none placeholder:text-ink-muted disabled:opacity-60 sm:text-[1.0625rem]"
                  />

                  {input.trim() && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        stopDictation();
                        setInput("");
                        if (inputRef.current) inputRef.current.style.height = "auto";
                      }}
                      aria-label={dictionary.common.close}
                      className="h-10 w-10 rounded-full text-ink-subtle hover:text-ink sm:h-11 sm:w-11"
                    >
                      <X aria-hidden />
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={toggleDictation}
                    disabled={completed || choiceOnly}
                    aria-label={dictating ? diagnostic.composerDictationLive : diagnostic.composerDictate}
                    title={dictating ? diagnostic.composerDictationLive : diagnostic.composerDictate}
                    aria-pressed={dictating}
                    className={cn(
                      "h-10 w-10 rounded-full sm:h-11 sm:w-11",
                      dictating ? "bg-rose-50 text-rose-700 hover:bg-rose-50 hover:text-rose-700" : "text-ink-muted hover:bg-teal-50 hover:text-teal-800",
                    )}
                  >
                    {dictating ? <Square className="fill-current" aria-hidden /> : dictationSupported ? <Mic aria-hidden /> : <MicOff aria-hidden />}
                  </Button>

                  {isSending && !isStarting ? (
                    <motion.button
                      type="button"
                      onClick={stop}
                      whileTap={{ scale: 0.92 }}
                      aria-label={streamCopy.stop}
                      title={streamCopy.stop}
                      className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-teal-200 sm:h-12 sm:w-12 bg-white text-teal-800 shadow-[0_0_0_5px_rgb(91_144_145/0.1)] transition-colors hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
                    >
                      <Square className="h-4 w-4 fill-current" aria-hidden />
                    </motion.button>
                  ) : (
                  <motion.button
                    type="button"
                    onClick={handleSend}
                    disabled={!canSend}
                    whileHover={canSend ? { scale: 1.05 } : undefined}
                    whileTap={canSend ? { scale: 0.92 } : undefined}
                    aria-label={diagnostic.send}
                    title={diagnostic.send}
                    className={cn(
                      "inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-white sm:h-12 sm:w-12 transition-[box-shadow,opacity] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed",
                      "bg-[radial-gradient(circle_at_30%_25%,var(--color-teal-600),var(--color-teal-800)_62%,var(--color-teal-900))]",
                      canSend
                        ? "shadow-[0_0_0_5px_rgb(201_175_111/0.2),0_10px_24px_-8px_rgb(17_76_97/0.65)]"
                        : "opacity-55 shadow-[0_0_0_5px_rgb(91_144_145/0.08)]",
                    )}
                  >
                    <SendHorizontal className="h-5 w-5 rtl:-scale-x-100" aria-hidden />
                  </motion.button>
                  )}
                </div>

                <div className={cn("mt-2.5 flex items-center justify-between gap-3 px-2 text-[0.8125rem] text-ink-soft", (completed || choiceOnly) && "hidden")}>
                  {unreadableDraft ? (
                    <span role="status" className="inline-flex items-center gap-1.5 font-medium text-gold-700">
                      <Info className="size-3.5 shrink-0" aria-hidden />
                      {diagnostic.unreadableHint}
                    </span>
                  ) : (
                    <span className={cn("tabular-nums", input.length === 0 && "max-sm:hidden")}>{input.length > 0 ? `${input.length.toLocaleString()} / 10,000` : diagnostic.questionsHint}</span>
                  )}
                  <span className="hidden sm:inline">{diagnostic.enterHint}</span>
                </div>

                {/* Reassurance row: dropped on short screens, where every line belongs to the conversation. */}
                <ul id="mira-session-meta" className="mt-5 hidden flex-wrap items-center justify-center gap-y-2 text-[0.8125rem] text-ink-soft md:flex [@media(max-height:50rem)]:!hidden">
                  {diagnostic.footerTrust.map((label, i) => {
                    const Icon = TRUST_ICONS[i] ?? ShieldCheck;
                    return (
                      <li key={label} className="inline-flex items-center gap-2 px-5 [&:not(:first-child)]:border-s [&:not(:first-child)]:border-line-strong/70">
                        <Icon className="h-4 w-4 text-gold-700" />
                        {label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
}
