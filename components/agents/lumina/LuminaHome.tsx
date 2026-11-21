"use client";

import { SERIF } from "@/components/home/typography";
import { AgentAvatar } from "@/components/layout/site-header";
import type { LuminaPreviewCopy } from "@/lib/i18n/agents";
import { EASE_OUT } from "@/lib/motion";
import { scaleColor } from "@/lib/patient/moods";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Flame, HeartPulse, Moon, Sparkles, Target, TrendingUp, Wind, Zap, type LucideIcon } from "lucide-react";
import { monthSeries, smoothPath } from "./chartData";

const W = 240;
const H = 84;
const BAND = { top: 28, bottom: 58 } as const;
const SERIES = monthSeries(W, BAND.top, BAND.bottom, 1.7);
const LINE = smoothPath(SERIES);
const AREA = `${LINE} L ${W} ${H} L 0 ${H} Z`;
const LAST = SERIES[SERIES.length - 1];

/** Today's four rings, by their place in the copy's five signals: mood, energy, focus, sleep (stress has no ring). */
const RINGS: readonly { signal: number; value: number; icon: LucideIcon }[] = [
  { signal: 0, value: 8, icon: HeartPulse },
  { signal: 1, value: 6, icon: Zap },
  { signal: 2, value: 7, icon: Target },
  { signal: 4, value: 7, icon: Moon },
];

const SIGNAL_ICONS = [Moon, HeartPulse, Target] as const;
const PLAN_ICONS = [Wind, Sparkles, Flame] as const;

/** One of today's rings: the stroke draws round, the number counts up. Reads the way the app's ScoreRing does. */
export function WellbeingRing({ value, label, icon: Icon, delay = 0 }: { value: number; label: string; icon: LucideIcon; delay?: number }) {
  const reduce = useReducedMotion();
  const color = scaleColor(value);
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
      <span className="relative block aspect-square w-full max-w-[3.75rem]">
        <svg viewBox="0 0 60 60" className="absolute inset-0 size-full -rotate-90 rtl:rotate-90 rtl:-scale-x-100">
          <circle cx="30" cy="30" r="25" fill="none" stroke="var(--color-line)" strokeWidth="5.5" />
          <motion.circle
            cx="30"
            cy="30"
            r="25"
            fill="none"
            stroke={color}
            strokeWidth="5.5"
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: value / 10 }}
            transition={{ duration: 1.3, ease: EASE_OUT, delay }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center" style={{ color }}>
          <Icon className="size-[1.0625rem]" strokeWidth={1.75} />
        </span>
      </span>
      <span className="block w-full truncate text-[0.6875rem] text-ink sm:text-[0.75rem]">{label}</span>
      <span dir="ltr" className="-mt-1 text-[0.6875rem] tabular-nums text-ink-soft">
        {String(value)}
        /10
      </span>
    </div>
  );
}

/** The week's mood line against the person's own band; the last point breathes. */
export function BaselineChart({ className, delay = 0.5 }: { className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("h-auto w-full overflow-visible", className)} aria-hidden>
      <defs>
        <linearGradient id="lumina-home-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--color-gold)" stopOpacity="0.38" />
          <stop offset="1" stopColor="var(--color-gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.rect
        x="0"
        y={BAND.top}
        width={W}
        height={BAND.bottom - BAND.top}
        rx="9"
        fill="var(--color-teal-100)"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 0.75 }}
        transition={{ duration: 0.7, delay }}
      />
      <motion.path d={AREA} fill="url(#lumina-home-area)" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: delay + 1.1 }} />
      <motion.path
        d={LINE}
        fill="none"
        stroke="var(--color-teal-600)"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.7, ease: EASE_OUT, delay: delay + 0.2 }}
      />
      <motion.g initial={reduce ? false : { opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: delay + 1.8, type: "spring", stiffness: 300, damping: 16 }} style={{ transformOrigin: `${LAST[0]}px ${LAST[1]}px` }}>
        <motion.circle cx={LAST[0]} cy={LAST[1]} r="6" fill="var(--color-gold)" animate={reduce ? undefined : { r: [5, 11, 5], opacity: [0.45, 0.05, 0.45] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
        <circle cx={LAST[0]} cy={LAST[1]} r="4.5" fill="var(--color-gold)" stroke="#fff" strokeWidth="2" />
      </motion.g>
    </svg>
  );
}

const card = "rounded-2xl bg-white/80 p-3 shadow-card ring-1 ring-white backdrop-blur-sm sm:p-4";

/**
 * The app's first screen: a greeting, today's four rings, the week's line inside its band, the signals worth a glance and
 * the day's small plan. The same cards the signed-in home is built from, in the same order, with example content.
 */
export function HomeScreen({ copy, compact = false }: { copy: LuminaPreviewCopy; compact?: boolean }) {
  const reduce = useReducedMotion();
  const { home, views, signals } = copy;
  const rise = (delay: number) => ({ initial: reduce ? false : { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease: EASE_OUT, delay } });

  return (
    <div className="flex flex-col gap-2.5 p-3 sm:gap-3 sm:p-5">
      <motion.div {...rise(0.1)} className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2.5">
          <AgentAvatar agent="lumina" className="size-8 rounded-xl ring-1 ring-gold-100 sm:size-9" />
          <span className={cn(SERIF, "truncate text-[1.125rem] font-light tracking-[-0.02em] text-ink rtl:font-normal rtl:tracking-normal sm:text-[1.375rem]")}>{copy.greeting}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sage-50 px-2 py-0.5 text-[0.625rem]  text-sage-700 ring-1 ring-sage-100 sm:text-[0.6875rem]">
          <Check className="size-3" strokeWidth={3} />
          {copy.saved}
        </span>
      </motion.div>

      <motion.section {...rise(0.25)} className={card}>
        <p className="text-[0.75rem]  text-ink sm:text-[0.8125rem]">{home.wellbeing}</p>
        <p className="text-[0.6875rem] text-ink-muted">{home.wellbeingLine}</p>
        <div className="mt-3 grid grid-cols-4 gap-1.5 sm:gap-3">
          {RINGS.map((ring, index) => (
            <WellbeingRing key={ring.signal} value={ring.value} label={signals[ring.signal]} icon={ring.icon} delay={0.5 + index * 0.14} />
          ))}
        </div>
      </motion.section>

      <div className={cn("grid gap-2.5 sm:gap-3", !compact && "sm:grid-cols-2")}>
        <motion.section {...rise(0.4)} className={card}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[0.75rem]  text-ink sm:text-[0.8125rem]">{views.trend.title}</p>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sage-50 px-2 py-0.5 text-[0.625rem]  text-sage-700 ring-1 ring-sage-100">
              <TrendingUp className="size-3" strokeWidth={2.5} />
              {home.nextTitle}
            </span>
          </div>
          <BaselineChart className="mt-2" />
          <p className="mt-1.5 flex items-center gap-1.5 text-[0.6875rem] text-ink-muted">
            <span className="h-2 w-4 rounded-sm bg-teal-100 ring-1 ring-teal-200" />
            {views.trend.baseline}
          </p>
        </motion.section>

        <motion.section {...rise(0.55)} className={cn(card, compact && "hidden")}>
          <p className="text-[0.75rem]  text-ink sm:text-[0.8125rem]">{home.signalsTitle}</p>
          <ul className="mt-2.5 space-y-2">
            {home.signals.map((line, index) => {
              const Icon = SIGNAL_ICONS[index];
              return (
                <li key={line} className="flex items-center gap-2.5 rounded-xl bg-canvas px-2.5 py-2 ring-1 ring-line">
                  <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", index === 2 ? "bg-gold-100 text-gold-700" : index === 0 ? "bg-sage-100 text-sage-700" : "bg-teal-100 text-teal-700")}>
                    <Icon className="size-3.5" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 text-[0.6875rem] leading-snug text-ink sm:text-[0.75rem]">{line}</span>
                </li>
              );
            })}
          </ul>
        </motion.section>
      </div>

      <motion.section {...rise(0.7)} className={cn(card, "hidden md:block", compact && "md:hidden")}>
        <p className="text-[0.8125rem]  text-ink">{home.planTitle}</p>
        <ul className="mt-2.5 grid grid-cols-3 gap-2">
          {home.plan.map((line, index) => {
            const Icon = PLAN_ICONS[index];
            return (
              <li key={line} className="flex items-center gap-2 rounded-xl bg-canvas px-2.5 py-2 ring-1 ring-line">
                <Icon className="size-3.5 shrink-0 text-gold-600" strokeWidth={2} />
                <span className="min-w-0 truncate text-[0.75rem] text-ink">{line}</span>
              </li>
            );
          })}
        </ul>
      </motion.section>
    </div>
  );
}
