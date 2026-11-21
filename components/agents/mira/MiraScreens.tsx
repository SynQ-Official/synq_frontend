"use client";

import { AgentAvatar } from "@/components/layout/site-header";
import { SERIF } from "@/components/home/typography";
import { useLanguage } from "@/contexts/LanguageContext";
import type { MiraPreviewCopy } from "@/lib/i18n/agents";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Download, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

const CURRENT_CHAPTER = 2;

/** Mount-time reveal: these screens remount when the step changes, so they animate on mount, not on scroll. */
const rise = (delay: number, reduce: boolean | null) => ({
  initial: reduce ? false : { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: EASE_OUT, delay },
});

/** Room under the notch, one column, and an app bar that every screen shares. */
function Screen({ children, right }: { children: ReactNode; right?: ReactNode }) {
  const { dictionary } = useLanguage();
  return (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#ffffff,var(--color-canvas))] px-4 pb-5 pt-12">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <AgentAvatar agent="mira" className="size-8 rounded-xl ring-1 ring-line" />
          <span className="text-[0.875rem]  text-ink">{dictionary.diagnostic.miraLabel}</span>
        </span>
        {right}
      </div>
      {children}
    </div>
  );
}

function Pill({ children, tone = "teal" }: { children: ReactNode; tone?: "teal" | "sage" | "gold" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.6875rem] ",
        tone === "teal" && "border-teal-200 bg-teal-50 text-teal-700",
        tone === "sage" && "border-sage-100 bg-sage-50 text-sage-700",
        tone === "gold" && "border-gold-100 bg-gold-100 text-gold-700",
      )}
    >
      {children}
    </span>
  );
}

function ChapterRail({ chapters }: { chapters: readonly string[] }) {
  const reduce = useReducedMotion();
  return (
    <ol className="mt-4 grid grid-cols-4 gap-1.5">
      {chapters.map((chapter, index) => (
        <li key={chapter} className="min-w-0">
          <span className="relative block h-1 overflow-hidden rounded-full bg-line">
            <motion.span
              className={cn("absolute inset-0 origin-left rounded-full rtl:origin-right", index === CURRENT_CHAPTER ? "bg-gold" : "bg-teal-500")}
              initial={reduce ? false : { scaleX: 0 }}
              animate={{ scaleX: index <= CURRENT_CHAPTER ? 1 : 0 }}
              transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.2 + index * 0.12 }}
            />
          </span>
          <span className={cn("mt-1 block truncate text-[0.6875rem] font-medium", index === CURRENT_CHAPTER ? "text-ink" : "text-ink-muted")}>{chapter}</span>
        </li>
      ))}
    </ol>
  );
}

function TypingDots() {
  return (
    <span aria-hidden className="inline-flex items-center gap-1">
      {[0, 1, 2].map((dot) => (
        <motion.span
          key={dot}
          className="size-1.5 rounded-full bg-teal-500"
        />
      ))}
    </span>
  );
}

/** The hero phone: a slice of the conversation. */
export function ChatScreen({ copy }: { copy: MiraPreviewCopy }) {
  const reduce = useReducedMotion();
  const { chat } = copy;
  return (
    <Screen right={<Pill>{chat.chapter}</Pill>}>
      <ChapterRail chapters={copy.chapters} />
      <div className="mt-5 space-y-2.5">
        <motion.p {...rise(0.4, reduce)} className="max-w-[92%] rounded-2xl rounded-ss-md bg-teal-50 px-3.5 py-2.5 text-[0.8125rem] leading-5 text-ink">
          {chat.question}
        </motion.p>
        <motion.p {...rise(0.9, reduce)} className="ms-auto w-fit max-w-[82%] rounded-2xl rounded-se-md bg-ink px-3.5 py-2.5 text-[0.8125rem] leading-5 text-white">
          {chat.answer}
        </motion.p>
        <motion.p {...rise(1.4, reduce)} className="flex items-center gap-2 ps-1 text-[0.75rem] text-ink-muted">
          <TypingDots />
          {chat.typing}
        </motion.p>
      </div>
      <div className="mt-auto flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-[0.75rem] text-ink-subtle shadow-xs">
        <span className="flex-1 truncate">…</span>
        <span className="flex size-6 items-center justify-center rounded-full bg-ink text-white">
          <Check className="size-3" aria-hidden />
        </span>
      </div>
    </Screen>
  );
}

export function HelloScreen({ copy }: { copy: MiraPreviewCopy["screens"]["hello"] }) {
  const reduce = useReducedMotion();
  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <motion.span {...rise(0, reduce)} className="relative flex size-24 items-center justify-center">
          {[0, 1].map((ring) => (
            <motion.span
              key={ring}
              aria-hidden
              className="absolute inset-0 rounded-full border border-teal-300"
            />
          ))}
          <AgentAvatar agent="mira" className="size-20 rounded-3xl ring-1 ring-line shadow-float" />
        </motion.span>
        <motion.p {...rise(0.2, reduce)} className={cn(SERIF, "mt-6 text-[1.625rem] font-light leading-tight tracking-[-0.02em] text-ink rtl:font-normal rtl:tracking-normal")}>
          {copy.greeting}
        </motion.p>
        <motion.p {...rise(0.35, reduce)} className="mt-1.5 text-[0.875rem] text-ink-soft">
          {copy.ask}
        </motion.p>
        <motion.div {...rise(0.5, reduce)} className="mt-6 flex w-full items-center rounded-2xl border border-teal-300 bg-white px-4 py-3 text-start shadow-[0_0_0_4px_rgb(91_144_145/0.12)]">
          <span className="text-[0.9375rem] font-medium text-ink">
            {Array.from(copy.name).map((char, index) => (
              <motion.span key={`${char}-${index}`} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 + index * 0.18 }}>
                {char}
              </motion.span>
            ))}
          </span>
          <motion.span aria-hidden className="ms-0.5 h-4 w-px bg-teal-600" />
        </motion.div>
      </div>
      <motion.span {...rise(0.7, reduce)} className="flex min-h-11 items-center justify-center rounded-full bg-ink text-[0.875rem]  text-white">
        {copy.cta}
      </motion.span>
    </Screen>
  );
}

export function DaysScreen({ copy, chapters }: { copy: MiraPreviewCopy["screens"]["days"]; chapters: readonly string[] }) {
  const reduce = useReducedMotion();
  return (
    <Screen right={<Pill>{copy.chapter}</Pill>}>
      <ChapterRail chapters={chapters} />
      <motion.p {...rise(0.3, reduce)} className="mt-6 rounded-2xl rounded-ss-md bg-teal-50 px-4 py-3.5 text-[0.9375rem] leading-6 text-ink">
        {copy.question}
      </motion.p>
      <ul className="mt-5 space-y-2.5">
        {copy.options.map((option, index) => {
          const picked = index === 1;
          return (
            <motion.li
              key={option}
              {...rise(0.55 + index * 0.1, reduce)}
              className="relative flex min-h-12 items-center justify-between overflow-hidden rounded-2xl border border-line bg-white px-4 text-[0.9375rem] font-medium text-ink-soft"
            >
              {picked && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 origin-left bg-teal-600 rtl:origin-right"
                  initial={reduce ? false : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, ease: EASE_OUT, delay: 1.5 }}
                />
              )}
              <motion.span className="relative" animate={picked ? { color: "#ffffff" } : undefined} transition={{ delay: 1.7, duration: 0.3 }}>
                {option}
              </motion.span>
              {/* Every answer carries the same ring, so the chosen one reads as a choice among equals. */}
              {picked ? (
                <motion.span className="relative flex size-5 items-center justify-center rounded-full bg-white text-teal-700" initial={reduce ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.8, duration: 0.3, ease: EASE_OUT }}>
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                </motion.span>
              ) : (
                <span aria-hidden className="size-5 rounded-full border border-line-strong" />
              )}
            </motion.li>
          );
        })}
      </ul>
    </Screen>
  );
}

export function SafetyScreen({ copy }: { copy: MiraPreviewCopy["screens"]["safety"] }) {
  const reduce = useReducedMotion();
  const bars = [0.35, 0.7, 0.5, 0.95, 0.6, 0.85, 0.4, 0.7, 0.3];
  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <span className="relative flex size-28 items-center justify-center">
          {[0, 1, 2].map((ring) => (
            <motion.span
              key={ring}
              aria-hidden
              className="absolute inset-0 rounded-full border border-teal-300"
              style={{ opacity: 0.25 }}
            />
          ))}
          <motion.span {...rise(0, reduce)} className="flex size-20 items-center justify-center rounded-full bg-[linear-gradient(150deg,var(--color-teal-400),var(--color-teal-700))] text-white shadow-[0_18px_34px_-14px_rgb(17_76_97/0.7)]">
            <ShieldCheck className="size-9" strokeWidth={1.5} aria-hidden />
          </motion.span>
        </span>
        <motion.p {...rise(0.2, reduce)} className={cn(SERIF, "mt-7 text-[1.5rem] font-light tracking-[-0.02em] text-ink rtl:font-normal rtl:tracking-normal")}>
          {copy.title}
        </motion.p>
        <motion.div {...rise(0.35, reduce)} aria-hidden className="mt-4 flex h-8 items-center gap-1">
          {bars.map((height, index) => (
            <motion.span
              key={index}
              className="w-1 rounded-full bg-teal-400"
              style={{ height: `${height * 100}%` }}
            />
          ))}
        </motion.div>
        <motion.p {...rise(0.45, reduce)} className="mt-2 text-[0.8125rem] text-ink-muted">
          {copy.status}
        </motion.p>
      </div>
      <motion.span {...rise(0.7, reduce)} className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-sage-100 bg-sage-50 text-[0.875rem]  text-sage-700">
        <Check className="size-4" aria-hidden />
        {copy.ok}
      </motion.span>
    </Screen>
  );
}

/**
 * The result as the real one reads: a qualitative level per area, never a score (the scores stay with the clinician),
 * the reminder that it is not a diagnosis, then the review and the report.
 */
export function ResultScreen({ copy }: { copy: MiraPreviewCopy["screens"]["result"] }) {
  const reduce = useReducedMotion();
  return (
    <Screen>
      <motion.p {...rise(0.1, reduce)} className={cn(SERIF, "mt-5 text-[1.375rem] font-light tracking-[-0.02em] text-ink rtl:font-normal rtl:tracking-normal")}>
        {copy.title}
      </motion.p>
      <motion.p {...rise(0.2, reduce)} className="mt-4 text-[0.75rem] text-ink-muted">
        {copy.signalsTitle}
      </motion.p>
      <ul className="mt-1.5 divide-y divide-line border-y border-line">
        {copy.areas.map((area, index) => (
          <motion.li key={area} {...rise(0.35 + index * 0.1, reduce)} className="py-2.5">
            <span className="block text-[0.8125rem] leading-5 text-ink">{area}</span>
            <span className="mt-1.5 flex items-center gap-2">
              {/* Three steps, filled from the strongest: a level to talk about, not a measurement. */}
              <span aria-hidden className="flex gap-1">
                {[0, 1, 2].map((step) => (
                  <span key={step} className={cn("h-1 w-4 rounded-full", step < 3 - index ? (index === 0 ? "bg-gold" : "bg-teal-500") : "bg-line")} />
                ))}
              </span>
              <span className="text-[0.75rem] text-ink-soft">{copy.levels[index]}</span>
            </span>
          </motion.li>
        ))}
      </ul>
      <motion.p {...rise(0.7, reduce)} className="mt-3 text-[0.75rem] leading-5 text-ink-soft">
        {copy.note}
      </motion.p>
      <motion.p {...rise(0.85, reduce)} className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3 text-[0.75rem] text-ink-soft">
        {copy.review}
        <Pill tone="gold">{copy.reviewValue}</Pill>
      </motion.p>
      <motion.span {...rise(1, reduce)} className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink text-[0.8125rem] text-white">
        <Download className="size-4" aria-hidden />
        {copy.download}
      </motion.span>
    </Screen>
  );
}
