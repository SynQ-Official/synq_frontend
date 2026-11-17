"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Flame, Moon, Sun, Sunrise, Sunset, type LucideIcon } from "lucide-react";
import { CountUp } from "@/components/home/CountUp";
import { Magnetic, WordReveal } from "@/components/home/AnimationUtilities";
import { DISPLAY_M, LABEL, SERIF } from "@/components/home/typography";
import { LuminaLogo } from "@/components/patient/ui/LuminaLogo";
import { Skeleton } from "@/components/patient/ui/primitives";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCheckinHistory, useTodayCheckin } from "@/hooks/patient/useCheckin";
import { usePatient } from "@/hooks/patient/usePatient";
import { useCalmTrack } from "@/hooks/useCalmTrack";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { fill } from "@/lib/i18n/patient";
import { dayPart, formatDay, type DayPart } from "@/lib/patient/format";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

const PLAYED_KEY = "vitamind_day_welcome_played";
const DAY_ICON: Record<DayPart, LucideIcon> = { morning: Sunrise, afternoon: Sun, evening: Sunset, night: Moon };
const DAY_MS = 86_400_000;

/** The full entrance plays once per browser session; later visits to Home only settle in. */
function alreadyPlayed() {
  try {
    return window.sessionStorage.getItem(PLAYED_KEY) === "1";
  } catch {
    return false;
  }
}

/** `value` is null when the history could not load: a dash, never a discouraging 0. */
function Stat({ value, label, loading }: { value: number | null; label: string; loading: boolean }) {
  return (
    <div className="min-w-0">
      {loading ? (
        <Skeleton className="h-8 w-12" />
      ) : (
        <CountUp value={value === null ? "—" : String(value)} className={cn(SERIF, "block text-[clamp(1.75rem,1.2rem+1.4vw,2.5rem)] font-light leading-none tabular-nums text-ink")} />
      )}
      <p className="mt-1.5 text-[0.8125rem] font-medium leading-snug text-ink">{label}</p>
    </div>
  );
}

/**
 * The welcome after sign-in. A clean white panel lit by the condition's colour, the SynQ mark with its soft halo,
 * a greeting that rises word by word, and three numbers that count up: the
 * patient sees, at once, that someone has been keeping the thread of their days. Every motion
 * stops under reduced motion (and, for psychosis / schizophrenia tracks, the mark stays still).
 */
export function DayWelcome() {
  const copy = usePatientCopy();
  const { language } = useLanguage();
  const { name, profile } = usePatient();
  const reduce = useReducedMotion();
  // Schizophrenia / psychosis tracks: nothing rises, scales or floats, entrances are a calm fade.
  const calm = useCalmTrack();
  const today = useTodayCheckin();
  const history = useCheckinHistory(30);
  const [first] = useState(() => typeof window !== "undefined" && !alreadyPlayed());

  useEffect(() => {
    try {
      window.sessionStorage.setItem(PLAYED_KEY, "1");
    } catch {
      /* the entrance simply plays again next time */
    }
  }, []);

  const part = dayPart();
  const DayIcon = DAY_ICON[part];
  const checkedIn = Boolean(today.data);
  const w = copy.home.welcome;
  const hero = copy.home.hero;

  // "Good morning, {name}": the lead is revealed word by word, the name rises last in the track's accent.
  const [lead, tail] = copy.shell.greeting[part].split("{name}");
  const delay = first ? 0.45 : 0.05;

  const together = useMemo(() => {
    const since = new Date(profile.memberSince).getTime();
    return Number.isFinite(since) ? Math.max(1, Math.ceil((new Date().getTime() - since) / DAY_MS)) : 1;
  }, [profile.memberSince]);

  const enter = (offset: number) => {
    if (reduce) return {};
    const delay = (first ? 0.6 : 0.1) + offset;
    return calm
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.9, ease: "easeOut" as const, delay } }
      : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, ease: EASE_OUT, delay } };
  };

  /** A word-by-word rise, or a plain fade on the calm tracks. */
  const reveal = (text: string, at: number) =>
    calm ? (
      <motion.span initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, ease: "easeOut", delay: at }}>
        {text}
      </motion.span>
    ) : (
      <WordReveal delay={at}>{text}</WordReveal>
    );

  const cta = (
    <Button asChild size="lg" disabled={today.isLoading}>
      <Link href={checkedIn ? "/dashboard/journal" : "/dashboard/check-in"}>
        {checkedIn ? hero.doneCta : hero.readyCta}
        <ArrowRight className="rtl:-scale-x-100" aria-hidden />
      </Link>
    </Button>
  );

  return (
    <section data-tour="welcome" aria-labelledby="day-welcome-title" className="lm-welcome mb-6">
      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12 lg:p-10">
        <div className="min-w-0">
          <motion.div {...enter(0)} className="flex flex-wrap items-center gap-2">
            <span className="lm-welcome-chip">
              <DayIcon className="size-4" style={{ color: "var(--color-teal-600)" }} aria-hidden />
              {formatDay(new Date(), language, { weekday: "long", month: "long", day: "numeric" })}
            </span>
            <span className={cn(LABEL, "lm-welcome-chip uppercase")}>
              <span aria-hidden className="size-1.5 rounded-full" style={{ background: "var(--cond)" }} />
              {w.motif[profile.track]}
            </span>
          </motion.div>

          <h1 id="day-welcome-title" className={cn(DISPLAY_M, "mt-5 text-ink")}>
            {lead.trim() && reveal(lead.trim(), delay)}
            {lead.trim() ? " " : null}
            <span dir="auto" className="italic rtl:not-italic">
              {reveal(name, delay + 0.2)}
            </span>
            {tail?.trim() ? reveal(tail.trim(), delay + 0.3) : null}
          </h1>

          <motion.p {...enter(0.15)} className="mt-4 max-w-xl text-[0.9375rem] leading-[1.7] text-ink sm:text-base">
            {today.isLoading ? " " : checkedIn ? w.doneLine : w.readyLine}
          </motion.p>

          <motion.div {...enter(0.3)} className="mt-6 flex flex-wrap items-center gap-3">
            {calm ? cta : <Magnetic>{cta}</Magnetic>}
            {history.streak >= 2 && (
              <span className="lm-welcome-chip">
                <Flame className="size-3.5" style={{ color: "var(--color-teal-600)" }} aria-hidden />
                {fill(hero.streak, { n: history.streak })}
              </span>
            )}
          </motion.div>
        </div>

        <div aria-hidden className="relative mx-auto hidden size-44 shrink-0 items-center justify-center sm:flex lg:mx-0 lg:size-52">
          <motion.span
            initial={reduce ? false : calm ? { opacity: 0 } : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: EASE_OUT, delay: first ? 0.3 : 0 }}
            className="relative"
          >
            <LuminaLogo size={96} presence float />
          </motion.span>
        </div>
      </div>

      <motion.div {...enter(0.45)} className="relative grid grid-cols-3 gap-4 bg-white/45 px-6 py-5 sm:px-8 lg:px-10">
        <Stat value={history.error ? null : history.data?.length ?? 0} label={w.stats.checkins} loading={history.isLoading} />
        <Stat value={history.error ? null : history.streak} label={w.stats.streak} loading={history.isLoading} />
        <Stat value={together} label={w.stats.together} loading={false} />
      </motion.div>
    </section>
  );
}
