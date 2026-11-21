"use client";

import { AgentAvatar } from "@/components/layout/site-header";
import { SERIF } from "@/components/home/typography";
import type { LuminaPreviewCopy } from "@/lib/i18n/agents";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { Check, LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { MoodEmoji } from "@/components/patient/ui/MoodEmoji";
import { MOOD_LEVELS } from "@/lib/patient/moods";
import { HEATMAP, SIGNAL_LEVELS, monthSeries, smoothPath } from "./chartData";

const CHART_W = 600;
const CHART_H = 210;
const BAND = { top: 82, bottom: 138 } as const;
const SERIES = monthSeries(CHART_W, BAND.top, BAND.bottom, 1.9);
const LINE = smoothPath(SERIES);
const AREA = `${LINE} L ${CHART_W} ${CHART_H} L 0 ${CHART_H} Z`;
const LAST = SERIES[SERIES.length - 1];

const rise = (delay: number, reduce: boolean | null) => ({
  initial: reduce ? false : { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: EASE_OUT, delay },
});

function Pane({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-3">
          <AgentAvatar agent="lumina" className="size-9 rounded-xl ring-1 ring-line" />
          <span className="truncate text-[1rem]  text-ink">{title}</span>
        </span>
        {aside}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function SavedPill({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-sage-100 bg-sage-50 px-3 py-1 text-[0.75rem]  text-sage-700">
      <Check className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}

/** Five signals as soft sliders that fill one after another. */
export function CheckinView({ copy }: { copy: LuminaPreviewCopy }) {
  const reduce = useReducedMotion();
  return (
    <Pane title={copy.views.checkin.title} aside={<SavedPill label={copy.saved} />}>
      <motion.p {...rise(0, reduce)} className={cn(SERIF, "text-[1.75rem] font-light tracking-[-0.02em] text-ink rtl:font-normal rtl:tracking-normal")}>
        {copy.greeting}
      </motion.p>
      <motion.ul {...rise(0.1, reduce)} dir="ltr" aria-hidden className="mt-5 flex items-center justify-between gap-1.5 rounded-2xl bg-canvas p-2 sm:justify-start sm:gap-3">
        {MOOD_LEVELS.map((level, index) => (
          <motion.li
            key={level.level}
            initial={reduce ? false : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: index === 3 ? 1.12 : 1 }}
            transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.2 + index * 0.07 }}
            className={cn("flex size-11 items-center justify-center rounded-xl text-[1.875rem] sm:size-12", index === 3 ? "bg-white shadow-float" : "opacity-70")}
            style={index === 3 ? { boxShadow: `0 0 0 2px ${level.color}` } : undefined}
          >
            <MoodEmoji level={level} />
          </motion.li>
        ))}
      </motion.ul>
      <ul className="mt-6 space-y-5">
        {copy.signals.map((signal, row) => (
          <motion.li key={signal} {...rise(0.15 + row * 0.08, reduce)} className="grid grid-cols-[5.5rem_1fr] items-center gap-4 sm:grid-cols-[7rem_1fr]">
            <span className="truncate text-[0.9375rem] font-medium text-ink-soft">{signal}</span>
            <span className="relative h-2.5 rounded-full bg-line">
              <motion.span
                className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-r from-teal-300 via-teal-500 to-gold"
                initial={reduce ? false : { width: 0 }}
                animate={{ width: `${(SIGNAL_LEVELS[row] / 5) * 100}%` }}
                transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.4 + row * 0.12 }}
              >
                <span className="absolute -end-1.5 top-1/2 size-5 -translate-y-1/2 rounded-full border-2 border-gold bg-white shadow-sm" />
              </motion.span>
            </span>
          </motion.li>
        ))}
      </ul>
    </Pane>
  );
}

/** A sentence that writes itself, then the themes lifted out of it. */
export function JournalView({ copy }: { copy: LuminaPreviewCopy }) {
  const reduce = useReducedMotion();
  const { entry, themes, note } = copy.views.journal;
  const [typed, setTyped] = useState(reduce ? entry.length : 0);

  useEffect(() => {
    if (reduce) return;
    const timer = window.setInterval(() => setTyped((count) => (count >= entry.length ? count : count + 1)), 32);
    return () => window.clearInterval(timer);
  }, [entry, reduce]);

  const done = typed >= entry.length;

  return (
    <Pane title={copy.views.journal.title}>
      <div className="grid gap-5 sm:grid-cols-[1.25fr_1fr]">
        <div className="min-h-[9.5rem] rounded-2xl border border-gold-100 bg-[linear-gradient(155deg,var(--color-gold-50),#ffffff_80%)] p-5">
          <p className={cn(SERIF, "text-[1.1875rem] font-light leading-[1.5] tracking-[-0.01em] text-ink rtl:font-normal rtl:tracking-normal")}>
            {entry.slice(0, typed)}
            {!done && <span aria-hidden className="ms-0.5 inline-block h-[1.1em] w-px translate-y-1 bg-gold-600" />}
          </p>
        </div>
        <div className="flex flex-col justify-between gap-4">
          <ul className="flex flex-wrap content-start gap-2">
            {themes.map((theme, index) => (
              <motion.li
                key={theme}
                initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                animate={done ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.4, ease: EASE_OUT, delay: index * 0.15 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-gold-100 bg-white px-3.5 py-1.5 text-[0.875rem] font-medium text-gold-700 shadow-xs"
              >
                <span className="size-1.5 rounded-full bg-gold" />
                {theme}
              </motion.li>
            ))}
          </ul>
          <p className="flex items-start gap-2 text-[0.8125rem] leading-5 text-ink-muted">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden />
            {note}
          </p>
        </div>
      </div>
    </Pane>
  );
}

const HEAT = ["bg-line", "bg-teal-100", "bg-teal-300", "bg-teal-500", "bg-teal-700"] as const;

/** Thirty days as an area chart against the person's own band, and five weeks of consistency as a heat grid. */
export function TrendView({ copy }: { copy: LuminaPreviewCopy }) {
  const reduce = useReducedMotion();
  const trend = copy.views.trend;
  return (
    <Pane title={trend.title}>
      <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <div dir="ltr" className="relative">
          <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="h-auto w-full overflow-visible" aria-hidden>
            <defs>
              <linearGradient id="lumina-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="var(--color-gold)" stopOpacity="0.38" />
                <stop offset="1" stopColor="var(--color-gold)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[40, 105, 170].map((y) => (
              <line key={y} x1="0" x2={CHART_W} y1={y} y2={y} stroke="var(--color-line)" strokeDasharray="3 6" />
            ))}
            <motion.rect
              x="0"
              y={BAND.top}
              width={CHART_W}
              height={BAND.bottom - BAND.top}
              rx="12"
              fill="var(--color-teal-100)"
              opacity="0.65"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 0.65 }}
              transition={{ duration: 0.8 }}
            />
            <motion.path d={AREA} fill="url(#lumina-area)" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.9 }} />
            <motion.path
              d={LINE}
              fill="none"
              stroke="var(--color-teal-600)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.8, ease: EASE_OUT, delay: 0.2 }}
            />
            <motion.g initial={reduce ? false : { opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.8, duration: 0.4, ease: EASE_OUT }} style={{ transformOrigin: `${LAST[0]}px ${LAST[1]}px` }}>
              <motion.circle cx={LAST[0]} cy={LAST[1]} r="10" fill="var(--color-gold)" />
              <circle cx={LAST[0]} cy={LAST[1]} r="6.5" fill="var(--color-gold)" stroke="#fff" strokeWidth="3" />
            </motion.g>
          </svg>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.1, duration: 0.5 }}
            className="absolute z-10 flex -translate-x-full -translate-y-[calc(100%+0.75rem)] items-center gap-2 rounded-xl bg-ink px-3 py-2 text-[0.75rem] font-medium text-white shadow-float"
            style={{ left: `${(LAST[0] / CHART_W) * 100}%`, top: `${(LAST[1] / CHART_H) * 100}%` }}
          >
            <span className="size-2 rounded-full bg-gold" />
            <span className="whitespace-nowrap">
              {trend.today} · {trend.verdict}
            </span>
          </motion.div>

          <p className="mt-2 inline-flex items-center gap-1.5 text-[0.75rem] text-ink-muted">
            <span className="h-2.5 w-5 rounded-sm bg-teal-100 ring-1 ring-teal-200" />
            {trend.baseline}
          </p>
        </div>

        <div className="max-w-[11.5rem]">
          <p className="text-[0.75rem] font-medium text-ink-muted">{trend.consistency}</p>
          <div dir="ltr" className="mt-2.5 grid grid-cols-7 gap-1.5" aria-hidden>
            {HEATMAP.map((level, index) => (
              <motion.span
                key={index}
                className={cn("aspect-square rounded-[5px]", HEAT[level], index === 30 && "ring-2 ring-gold ring-offset-1")}
                initial={reduce ? false : { opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.02, duration: 0.3 }}
              />
            ))}
          </div>
        </div>
      </div>
    </Pane>
  );
}

/** A report page taking shape, and the consent switch that decides whether anyone sees it. */
export function ReportView({ copy }: { copy: LuminaPreviewCopy }) {
  const reduce = useReducedMotion();
  const { direction } = useLanguage();
  const report = copy.views.report;
  const [shared, setShared] = useState(reduce ?? false);

  useEffect(() => {
    if (reduce) return;
    const timer = window.setTimeout(() => setShared(true), 1700);
    return () => window.clearTimeout(timer);
  }, [reduce]);

  const spark = smoothPath(monthSeries(120, 6, 34));

  return (
    <Pane title={report.title}>
      <div className="grid gap-5 sm:grid-cols-[1.3fr_1fr]">
        <motion.div {...rise(0.1, reduce)} className="rounded-2xl border border-line bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3 border-b border-line pb-4">
            <span className="h-2.5 w-24 rounded-full bg-ink/80" />
            <span className="ms-auto h-2 w-10 rounded-full bg-line-strong" />
          </div>
          <ul className="mt-4 space-y-4">
            {report.sections.map((section, index) => (
              <motion.li key={section} {...rise(0.35 + index * 0.15, reduce)}>
                <p className="text-[0.75rem]  text-teal-700">{section}</p>
                {index === 0 ? (
                  <svg viewBox="0 0 120 40" className="mt-1.5 h-9 w-full" aria-hidden preserveAspectRatio="none">
                    <path d={spark} fill="none" stroke="var(--color-teal-500)" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  </svg>
                ) : index === 1 ? (
                  <div className="mt-2 space-y-1.5" aria-hidden>
                    <span className="block h-1.5 w-full rounded-full bg-line-strong/70" />
                    <span className="block h-1.5 w-4/5 rounded-full bg-line-strong/70" />
                  </div>
                ) : (
                  <span aria-hidden className="mt-2 block h-1.5 w-1/2 rounded-full bg-gold/60" />
                )}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div {...rise(0.5, reduce)} className="flex flex-col justify-center gap-5 rounded-2xl border border-teal-200 bg-teal-50/60 p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[0.9375rem]  leading-snug text-ink">{report.share}</span>
            <span aria-hidden className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors duration-500", shared ? "bg-teal-600" : "bg-line-strong")}>
              <motion.span className="absolute start-1 top-1 size-5 rounded-full bg-white shadow-sm" animate={{ x: shared ? (direction === "rtl" ? -20 : 20) : 0 }} transition={{ type: "spring", stiffness: 420, damping: 26 }} />
            </span>
          </div>
          <p className="flex items-center gap-2 text-[0.8125rem] text-ink-soft">
            <LockKeyhole className="size-4 shrink-0 text-teal-600" aria-hidden />
            {report.consent}
          </p>
        </motion.div>
      </div>
    </Pane>
  );
}
