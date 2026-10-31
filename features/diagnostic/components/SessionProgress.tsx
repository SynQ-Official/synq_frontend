"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, ShieldCheck, Sparkles } from "lucide-react";
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
  /** The agent's own count; the total grows past 16 when Mira asks a clarification. */
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
  const counter = fill(diagnostic.questionCounter, { current: position.current, total: position.total });
  return { diagnostic, percent, position, activeIndex, stage, counter };
}

/** "3/10" ring: soft track, teal → sage stroke, gentle halo. */
function QuestionRing({ answered, total, percent, size = "lg" }: { answered: number; total: number; percent: number; size?: "lg" | "sm" }) {
  const gradientId = useId();
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const large = size === "lg";
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center rounded-full bg-white shadow-[0_10px_28px_-14px_rgb(43_112_128/0.5)] ring-1 ring-teal-100", large ? "size-24" : "size-12")}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-teal-600)" />
            <stop offset="100%" stopColor="var(--color-gold)" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-teal-100)" strokeWidth={large ? 5 : 7} />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={large ? 5 : 7}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: circumference * (1 - percent / 100) }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
        />
      </svg>
      <span className={cn("relative tabular-nums text-ink", large ? cn(SERIF, "text-[1.625rem] font-light tracking-[-0.03em]") : "text-[0.75rem] font-semibold")} dir="ltr">
        {answered}/{total}
      </span>
    </span>
  );
}

function LinearProgress({ percent, label }: { percent: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-1.5 w-full overflow-hidden rounded-full bg-teal-100"
    >
      <motion.span
        className="block h-full origin-left rounded-full bg-[linear-gradient(90deg,var(--color-teal-600),var(--color-gold))] rtl:origin-right"
        initial={false}
        animate={{ scaleX: Math.max(0.04, percent / 100) }}
        transition={{ duration: 0.8, ease: EASE_OUT }}
      />
    </div>
  );
}

/** Desktop rail: what this session is, where the visitor is, and a calm reassurance. */
export function SessionRail(props: ProgressProps) {
  const { diagnostic, percent, position, activeIndex, stage } = useProgressModel(props);
  const rail = diagnostic.rail;
  const [journeyOpen, setJourneyOpen] = useState(false);
  const journeyId = useId();
  // Title: the last word carries the olive-gold accent, as on the home page.
  const titleWords = rail.title.split(" ");
  const titleLead = titleWords.slice(0, -1).join(" ");
  const titleAccent = titleWords.slice(-1).join(" ");

  return (
    <aside
      aria-label={diagnostic.stepsTitle}
      className={cn("orientation-glass scrollbar-hide flex min-h-0 flex-col overflow-y-auto p-6 xl:p-7 [&>*]:shrink-0", props.className)}
    >
      <div className="flex items-center gap-3.5">
        <MiraAvatar size="xl" presence />
        <p className={cn(LABEL, "flex min-w-0 items-center gap-2.5 text-teal-700")}>
          <span aria-hidden className="h-px w-5 shrink-0 bg-gold" />
          {rail.eyebrow}
        </p>
      </div>
      <h1 className={cn(SERIF, "mt-6 text-[clamp(2rem,1.4vw+1.5rem,2.75rem)] font-light leading-[1.05] tracking-[-0.035em] text-ink rtl:leading-[1.3] rtl:tracking-normal")}>
        {titleLead ? <>{titleLead} </> : null}
        <span className={ACCENT_LIGHT}>{titleAccent}</span>
      </h1>
      <p className="mt-5 text-[0.9375rem] leading-7 text-ink-soft">{rail.body}</p>

      {/* Questions */}
      <div className="orientation-tile mt-6 flex items-center gap-4 p-4">
        <QuestionRing answered={position.answered} total={position.total} percent={percent} />
        <div className="min-w-0 flex-1">
          <p className="text-[0.9375rem] font-semibold text-ink">{rail.questions}</p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={stage}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="mt-0.5 text-[0.875rem] text-ink-soft"
              aria-live="polite"
            >
              {stage}
            </motion.p>
          </AnimatePresence>
          <div className="mt-3">
            <LinearProgress percent={percent} label={diagnostic.progressLabel} />
          </div>
        </div>
      </div>

      {/* Today's focus — expands into the journey chapters */}
      <div className="orientation-tile mt-4 overflow-hidden">
        <button
          type="button"
          onClick={() => setJourneyOpen((open) => !open)}
          aria-expanded={journeyOpen}
          aria-controls={journeyId}
          className="group flex w-full cursor-pointer items-start gap-3.5 p-4 text-start transition-colors duration-200 hover:bg-white/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-500"
        >
          <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-gold-700 shadow-xs ring-1 ring-gold-100">
            <Sparkles className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.9375rem] font-semibold text-ink">{rail.focusTitle}</span>
            <span className="mt-1 block text-[0.875rem] leading-6 text-ink-soft">{rail.focusBody}</span>
          </span>
          <ChevronRight
            aria-hidden
            className={cn(
              "mt-3 h-4 w-4 shrink-0 text-ink-subtle transition-transform duration-300 ease-out-soft group-hover:text-teal-700 rtl:-scale-x-100",
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
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="overflow-hidden border-t border-white/80 px-4"
            >
              <li className={cn(LABEL, "pt-3 text-ink-muted")}>{rail.journeyTitle}</li>
              {CHAPTER_SEQUENCE.map((step, i) => {
                const done = i < activeIndex;
                const current = i === activeIndex;
                return (
                  <li key={step} className="flex items-center gap-3 py-2 last:pb-4" aria-current={current ? "step" : undefined}>
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
                        done && "border-primary bg-primary text-white",
                        current && "border-teal-300 bg-teal-50 text-teal-700 shadow-[0_0_0_3px_var(--color-teal-100)]",
                        !done && !current && "border-line bg-white text-ink-subtle",
                      )}
                    >
                      {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : <ChapterIcon chapter={step} className="h-3.5 w-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-[0.9375rem]", current ? "font-semibold text-ink" : "text-ink-soft")}>
                        {diagnostic.chapters[step]}
                      </span>
                      <span className="block text-[0.8125rem] text-ink-muted">{diagnostic.chapterHints[step as keyof typeof diagnostic.chapterHints]}</span>
                    </span>
                    {current && <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[0.75rem] font-semibold text-teal-700">{diagnostic.chapterNow}</span>}
                  </li>
                );
              })}
            </motion.ol>
          )}
        </AnimatePresence>
      </div>

      {/* Privacy */}
      <div className="mt-auto flex items-center gap-3.5 pt-6">
        <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
          <ShieldCheck className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <p className="text-[0.875rem] leading-6 text-ink-soft">{diagnostic.privateNote}</p>
      </div>
    </aside>
  );
}

/** Compact progress for tablet/mobile, shown above the conversation. */
export function CompactProgress(props: ProgressProps) {
  const { diagnostic, percent, position, stage } = useProgressModel(props);

  return (
    <div className={cn("orientation-glass flex items-center gap-3.5 !rounded-[1.25rem] px-4 py-3", props.className)}>
      <QuestionRing answered={position.answered} total={position.total} percent={percent} size="sm" />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold text-ink">
          <span className="sr-only">{diagnostic.title} — </span>
          {diagnostic.rail.questions}
          <span className="font-normal text-ink-soft"> · {stage}</span>
        </h1>
        <div className="mt-2">
          <LinearProgress percent={percent} label={diagnostic.progressLabel} />
        </div>
      </div>
    </div>
  );
}
