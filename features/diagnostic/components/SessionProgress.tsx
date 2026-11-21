"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronRight, Info, ShieldCheck } from "lucide-react";
import { copy, type Lang } from "@/lib/i18n/config";
import { fill } from "@/lib/i18n/format";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ACCENT_LIGHT, LABEL, SERIF } from "@/components/home/typography";
import { CHAPTER_SEQUENCE, questionPosition, type QuestionCount } from "../lib/chapters";
import type { MiraChapter } from "../types";
import { ChapterIcon } from "./ChapterIcon";
import { MiraAvatar } from "./MiraMessage";

type ProgressProps = {
  chapter: MiraChapter;
  progress: number;
  /** The agent's own count: 26 questions (v2) or 16 (v1 sessions); clarifications and corrections are never counted. */
  questions?: QuestionCount | null;
  language: Lang;
  className?: string;
  /** Visitor's first name (kept for API compatibility; greeting lives in the conversation). */
  name?: string;
};

function useProgressModel({ chapter, progress, questions, language }: ProgressProps) {
  const diagnostic = copy[language].diagnostic;
  const clamped = Math.max(0, Math.min(1, progress));
  const percent = Math.round(clamped * 100);
  const position = questionPosition(clamped, questions);
  const activeIndex = chapter === "COMPLETE" ? CHAPTER_SEQUENCE.length : CHAPTER_SEQUENCE.indexOf(chapter);
  // Encouragement follows the journey: start → rhythm → past halfway → almost → done.
  const stageIndex = clamped >= 1 ? 4 : clamped >= 0.7 ? 3 : clamped >= 0.5 ? 2 : position.answered > 0 ? 1 : 0;
  const stage = diagnostic.rail.stages[stageIndex];
  // Only the agent's own total is printed: until it is known the label stays generic (never an assumed count).
  const counter = position.known ? fill(diagnostic.questionCounter, { current: position.current, total: position.total }) : diagnostic.rail.questions;
  return { diagnostic, percent, position, activeIndex, stage, counter };
}

/** "3/26" ring: soft track, deep teal → sage stroke. */
function QuestionRing({ answered, total, known, percent, size = "lg" }: { answered: number; total: number; known: boolean; percent: number; size?: "lg" | "sm" }) {
  const gradientId = useId();
  const reduce = useReducedMotion();
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const large = size === "lg";
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center rounded-full bg-white", large ? "size-[5.5rem]" : "size-11")}>
      {/* Mirrored in RTL so the stroke grows clockwise from the reading start. */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90 rtl:-scale-x-100 rtl:rotate-90" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-teal-700)" />
            <stop offset="100%" stopColor="var(--color-sage)" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-teal-50)" strokeWidth={large ? 4 : 7} />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={large ? 4 : 7}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: circumference * (1 - percent / 100) }}
          transition={reduce ? { duration: 0 } : { duration: 0.9, ease: EASE_OUT }}
        />
      </svg>
      <span className={cn("relative tabular-nums text-ink", large ? cn(SERIF, "text-[1.5rem] font-light tracking-[-0.03em] rtl:font-sans rtl:text-[1.25rem]") : "text-[0.6875rem] ")} dir="ltr">
        {answered}
        {known && <span className={cn("text-ink-subtle", large && "text-[0.9375rem]")}>/{total}</span>}
      </span>
    </span>
  );
}

function LinearProgress({ percent, label }: { percent: number; label: string }) {
  const reduce = useReducedMotion();
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-1 w-full overflow-hidden rounded-full bg-teal-50"
    >
      <motion.span
        className="block h-full origin-left rounded-full bg-[linear-gradient(90deg,var(--color-teal-700),var(--color-sage))] rtl:origin-right rtl:bg-[linear-gradient(270deg,var(--color-teal-700),var(--color-sage))]"
        initial={false}
        animate={{ scaleX: Math.max(0.03, percent / 100) }}
        transition={reduce ? { duration: 0 } : { duration: 0.8, ease: EASE_OUT }}
      />
    </div>
  );
}

function Stage({ stage, className }: { stage: string; className?: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={stage}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -3 }}
        transition={{ duration: 0.25, ease: EASE_OUT }}
        className={className}
        aria-live="polite"
      >
        {stage}
      </motion.span>
    </AnimatePresence>
  );
}

/** Desktop rail: what this session is, where the visitor is, and a calm reassurance. */
export function SessionRail(props: ProgressProps) {
  const { diagnostic, percent, position, activeIndex, stage, counter } = useProgressModel(props);
  const rail = diagnostic.rail;
  const [journeyOpen, setJourneyOpen] = useState(false);
  const journeyId = useId();
  // Title: the last word carries the champagne-gold accent, as on the home page.
  const titleWords = rail.title.split(" ");
  const titleLead = titleWords.slice(0, -1).join(" ");
  const titleAccent = titleWords.slice(-1).join(" ");

  return (
    <aside
      aria-label={diagnostic.stepsTitle}
      className={cn("orientation-glass scrollbar-hide flex min-h-0 flex-col overflow-y-auto px-6 py-7 xl:px-8 xl:py-8 [&>*]:shrink-0", props.className)}
    >
      <div className="flex items-center gap-3">
        <MiraAvatar size="md" presence />
        <p className={cn(LABEL, "min-w-0 text-teal-700")}>{rail.eyebrow}</p>
      </div>
      <h1 className={cn(SERIF, "mt-7 text-balance text-[clamp(1.875rem,1.2vw+1.4rem,2.5rem)] font-light leading-[1.08] tracking-[-0.03em] text-ink rtl:text-[clamp(1.625rem,1vw+1.25rem,2.125rem)]  rtl:leading-[1.4] rtl:tracking-normal")}>
        {titleLead ? <>{titleLead} </> : null}
        <span className={ACCENT_LIGHT}>{titleAccent}</span>
      </h1>
      <p className="mt-4 text-[0.9375rem] leading-7 text-ink-soft rtl:leading-8">{rail.body}</p>

      {/* Where the visitor is */}
      <div className="orientation-tile mt-7 p-5">
        <div className="flex items-center gap-4">
          <QuestionRing answered={position.answered} total={position.total} known={position.known} percent={percent} />
          <div className="min-w-0 flex-1">
            <p className="text-[0.9375rem]  text-ink">{counter}</p>
            <Stage stage={stage} className="mt-1 block text-[0.875rem] leading-6 text-ink-soft" />
          </div>
        </div>
        <div className="mt-4">
          <LinearProgress percent={percent} label={diagnostic.progressLabel} />
        </div>
        <p className="mt-4 flex items-start gap-2 text-[0.8125rem] leading-5 text-ink-muted">
          <Info className="mt-0.5 size-3.5 shrink-0 text-sage-700" aria-hidden />
          {diagnostic.skipHint}
        </p>
      </div>

      {/* Today's focus — expands into the journey chapters */}
      <div className={cn("mt-3 overflow-hidden rounded-[1.25rem] border transition-colors duration-200", journeyOpen ? "border-line" : "border-transparent")}>
        <button
          type="button"
          onClick={() => setJourneyOpen((open) => !open)}
          aria-expanded={journeyOpen}
          aria-controls={journeyId}
          className="group flex w-full cursor-pointer items-start gap-3 rounded-[1.25rem] px-4 py-3.5 text-start transition-colors duration-200 hover:bg-ivory focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-500"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[0.875rem]  text-ink">{rail.focusTitle}</span>
            <span className="mt-0.5 block text-[0.8125rem] leading-5 text-ink-muted">{rail.focusBody}</span>
          </span>
          <ChevronRight
            aria-hidden
            className={cn(
              "mt-1 h-4 w-4 shrink-0 text-ink-subtle transition-transform duration-300 ease-out-soft group-hover:text-teal-700 rtl:-scale-x-100",
              journeyOpen && "rotate-90 rtl:-rotate-90",
            )}
          />
        </button>

        <AnimatePresence initial={false}>
          {journeyOpen && (
            <motion.ol
              id={journeyId}
              aria-label={rail.journeyTitle}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="overflow-hidden px-4"
            >
              <li className={cn(LABEL, "pt-1 text-ink-muted")}>{rail.journeyTitle}</li>
              {CHAPTER_SEQUENCE.map((step, i) => {
                const done = i < activeIndex;
                const current = i === activeIndex;
                return (
                  <li key={step} className="flex items-center gap-3 py-2 last:pb-4" aria-current={current ? "step" : undefined}>
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
                        done && "border-teal-700 bg-teal-700 text-white",
                        current && "border-teal-300 bg-teal-50 text-teal-700",
                        !done && !current && "border-line bg-white text-ink-subtle",
                      )}
                    >
                      {done ? <Check className="size-3.5" strokeWidth={2.5} /> : <ChapterIcon chapter={step} className="size-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-[0.875rem]", current ? " text-ink" : "text-ink-soft")}>
                        {diagnostic.chapters[step]}
                      </span>
                      <span className="block text-[0.8125rem] text-ink-muted">{diagnostic.chapterHints[step as keyof typeof diagnostic.chapterHints]}</span>
                    </span>
                    {current && <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[0.75rem]  text-teal-700">{diagnostic.chapterNow}</span>}
                  </li>
                );
              })}
            </motion.ol>
          )}
        </AnimatePresence>
      </div>

      {/* Privacy */}
      <div className="mt-auto flex items-start gap-3 border-t border-line pt-5">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-sage-700" strokeWidth={1.75} aria-hidden />
        <p className="text-[0.8125rem] leading-5 text-ink-muted">{diagnostic.privateNote}</p>
      </div>
    </aside>
  );
}

/** Compact progress for tablet/mobile: one slim strip above the conversation, so the conversation keeps the screen. */
export function CompactProgress(props: ProgressProps) {
  const { diagnostic, percent, position, stage, counter } = useProgressModel(props);

  return (
    <div className={cn("orientation-glass flex items-center gap-3 !rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3", props.className)}>
      <QuestionRing answered={position.answered} total={position.total} known={position.known} percent={percent} size="sm" />
      <div className="min-w-0 flex-1">
        <h1 className="flex min-w-0 items-baseline gap-2 text-[0.875rem] text-ink">
          <span className="sr-only">{diagnostic.title} — </span>
          <span className="shrink-0 ">{counter}</span>
          <Stage stage={stage} className="min-w-0 truncate text-[0.8125rem] text-ink-muted" />
        </h1>
        <div className="mt-2">
          <LinearProgress percent={percent} label={diagnostic.progressLabel} />
        </div>
      </div>
    </div>
  );
}
