"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, BatteryMedium, Brain, Check, Clock, Link2, ListChecks, Moon, Play, RotateCcw, Sparkles, Wind } from "lucide-react";
import { ExerciseSession } from "@/components/patient/ui/ExerciseSession";
import { GlassCard, Skeleton } from "@/components/patient/ui/primitives";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCompleteExercise, useCompletedToday, useExerciseCatalog } from "@/hooks/patient/useCare";
import { useTodayCheckin } from "@/hooks/patient/useCheckin";
import { usePatient } from "@/hooks/patient/usePatient";
import { useCalmTrack } from "@/hooks/useCalmTrack";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import type { Exercise } from "@/lib/api/patient-types";
import { fill } from "@/lib/i18n/patient";
import { localizeExercise, rankedExercises } from "@/lib/patient/exercises";
import { cn } from "@/lib/utils";

const ICON: Record<Exercise["type"], typeof Activity> = {
  BREATHING: Wind, GROUNDING: Link2, SLEEP: Moon, RELAXATION: BatteryMedium, ACTIVITY: Activity, OTHER: Brain,
};

const LIST_SIZE = 4;

/**
 * Recommended exercises for the patient's track: the best fit right now as a featured card, the rest ranked beside
 * it, filterable by kind. Every one opens the guided session; finishing records the practice, and what was already
 * done today says so instead of asking again.
 */
export function RecommendedExercises() {
  const copy = usePatientCopy();
  const { language } = useLanguage();
  const { profile } = usePatient();
  const catalog = useExerciseCatalog();
  const doneToday = useCompletedToday();
  const today = useTodayCheckin();
  const { complete } = useCompleteExercise();
  const reduce = useReducedMotion();
  const calm = useCalmTrack();
  const [kind, setKind] = useState<Exercise["type"] | "ALL">("ALL");
  const [active, setActive] = useState<Exercise | null>(null);
  const [open, setOpen] = useState(false);

  const ex = copy.home.exercise;
  const sleepHours = today.data?.sleepHours ?? null;
  const ranked = useMemo(() => rankedExercises(catalog.data ?? [], profile.track, { sleepHours }), [catalog.data, profile.track, sleepHours]);
  const kinds = useMemo(() => Array.from(new Set(ranked.map((item) => item.type))), [ranked]);
  const visible = kind === "ALL" ? ranked : ranked.filter((item) => item.type === kind);
  const [featured, ...rest] = visible;
  const done = new Set(doneToday.data ?? []);
  const still = reduce || calm;

  if (catalog.isLoading) {
    return <GlassCard><Skeleton className="h-80" /></GlassCard>;
  }
  if (!featured) return null;

  const start = (exercise: Exercise) => {
    setActive(exercise);
    setOpen(true);
  };
  const reason = (exercise: Exercise) => {
    if (sleepHours !== null && sleepHours < 6 && exercise.slug === "sleep-wind-down") return ex.whySleep;
    return (ex.reasons as Record<string, string>)[exercise.slug] ?? ex.whyDefault;
  };

  const item = localizeExercise(featured, language);
  const FeaturedIcon = ICON[featured.type];
  const featuredDone = done.has(featured.id);

  return (
    <GlassCard className="p-0" aria-labelledby="recommended-title">
      <div className="flex flex-col gap-4 p-5 pb-4 sm:flex-row sm:items-end sm:justify-between sm:p-6 sm:pb-4">
        <div className="min-w-0">
          <p className="lm-eyebrow">{ex.section}</p>
          <h2 id="recommended-title" className="mt-1 text-xl  leading-snug text-ink">{ex.title}</h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-soft">{ex.lead[profile.track]}</p>
        </div>
        {kinds.length > 1 && (
          <div role="group" aria-label={ex.section} className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:justify-end sm:overflow-visible sm:pb-0">
            {(["ALL", ...kinds] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={kind === value}
                onClick={() => setKind(value)}
                className={cn(
                  "min-h-9 shrink-0 cursor-pointer rounded-full border px-3.5 text-xs  transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500",
                  kind === value ? "border-teal-600 bg-teal-600 text-white" : "border-line bg-white/70 text-ink-soft hover:border-teal-300 hover:text-ink",
                )}
              >
                {value === "ALL" ? ex.filterAll : ex.kinds[value]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 p-5 pt-0 sm:p-6 sm:pt-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-5">
        {/* Featured: the best fit right now. */}
        <article className="lm-soft relative isolate flex min-w-0 flex-col overflow-hidden rounded-3xl">
          <div className="lm-hero relative flex min-h-40 items-end overflow-hidden rounded-none border-0 p-5" style={{ boxShadow: "none" }}>
            <div aria-hidden className="pointer-events-none absolute end-5 top-1/2 flex size-28 -translate-y-1/2 items-center justify-center sm:size-32">
              {[1, 0.72, 0.46].map((scale, index) => (
                <motion.span
                  key={scale}
                  className="absolute inset-0 rounded-full border border-teal-500/30 bg-white/25"
                  style={{ scale }}
                  animate={still ? undefined : { scale: [scale, scale * 1.1, scale], opacity: [0.9, 0.55, 0.9] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 }}
                />
              ))}
              <span className="relative flex size-14 items-center justify-center rounded-2xl bg-white/80 text-teal-700 shadow-lg shadow-teal-900/10 ring-1 ring-white">
                <FeaturedIcon className="size-7" aria-hidden />
              </span>
            </div>
            <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[0.6875rem]  uppercase tracking-wide text-teal-800 ring-1 ring-white rtl:normal-case rtl:tracking-normal">
              <Sparkles className="size-3 text-gold-600" aria-hidden />
              {kind === "ALL" ? ex.featured : ex.kinds[featured.type]}
            </span>
          </div>

          <div className="flex flex-1 flex-col gap-3.5 p-5">
            <div>
              <h3 className="text-lg  leading-snug text-ink">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.description}</p>
            </div>
            <ul className="flex flex-wrap gap-2 text-xs font-medium text-ink-soft">
              <li className="chip"><FeaturedIcon className="size-3" aria-hidden />{ex.kinds[featured.type]}</li>
              {item.minutes ? <li className="chip"><Clock className="size-3" aria-hidden />{fill(copy.common.min, { n: item.minutes })}</li> : null}
              {item.steps.length ? <li className="chip"><ListChecks className="size-3" aria-hidden />{fill(ex.steps, { n: item.steps.length })}</li> : null}
            </ul>
            <p className="flex items-start gap-1.5 text-xs leading-snug text-muted-foreground">
              <Sparkles className="mt-px size-3.5 shrink-0 text-gold-600" aria-hidden />
              <span><span className=" text-ink-soft">{ex.why}:</span> {reason(featured)}</span>
            </p>
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-1">
              <Button onClick={() => start(featured)} className="w-full sm:w-auto">
                {featuredDone ? <RotateCcw aria-hidden /> : <Play aria-hidden />}
                {featuredDone ? ex.again : ex.start}
              </Button>
              {featuredDone && (
                <span className="inline-flex items-center gap-1.5 text-xs  text-sage-700">
                  <Check className="size-4" aria-hidden />{ex.doneToday}
                </span>
              )}
            </div>
          </div>
        </article>

        {/* The rest, ranked. */}
        <div className="min-w-0">
          {rest.length > 0 && <p className="mb-2.5 text-xs  uppercase tracking-wide text-ink-muted rtl:normal-case rtl:tracking-normal">{ex.more}</p>}
          <ul className="grid gap-2.5">
            {rest.slice(0, LIST_SIZE).map((exercise) => {
              const local = localizeExercise(exercise, language);
              const Icon = ICON[exercise.type];
              const finished = done.has(exercise.id);
              return (
                <li key={exercise.id}>
                  <button
                    type="button"
                    onClick={() => start(exercise)}
                    className="group lm-inset flex w-full cursor-pointer items-center gap-3.5 px-3.5 py-3 text-start transition-[transform,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
                  >
                    <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", finished ? "bg-sage-100 text-sage-700" : "bg-teal-100 text-teal-700")}>
                      {finished ? <Check className="size-5" aria-hidden /> : <Icon className="size-5" aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm  text-ink">{local.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-ink-soft">
                        {ex.kinds[exercise.type]}
                        {local.minutes ? ` · ${fill(copy.common.min, { n: local.minutes })}` : ""}
                        {finished ? ` · ${ex.doneToday}` : ""}
                      </span>
                    </span>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-teal-700 ring-1 ring-line transition-colors duration-200 group-hover:bg-teal-600 group-hover:text-white">
                      <Play className="size-3.5 rtl:-scale-x-100" aria-hidden />
                      <span className="sr-only">{ex.start}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <ExerciseSession
        exercise={active ? localizeExercise(active, language) : null}
        open={open}
        onClose={() => setOpen(false)}
        onFinish={(durationSeconds) => (active ? complete({ exerciseId: active.id, durationSeconds }) : undefined)}
      />
    </GlassCard>
  );
}
