"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CalendarClock, Eye, LockKeyhole, TrendingDown, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/patient/ui/primitives";
import { Sparkline } from "@/components/patient/ui/TrendChart";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import type { ReportInsight, ReportListItem } from "@/lib/api/patient-types";
import { fill } from "@/lib/i18n/patient";
import { addDaysLocal, dayOfPeriod, formatDay, formatRange, parseDay } from "@/lib/patient/format";
import { moodForLevel } from "@/lib/patient/moods";
import { MoodEmoji } from "@/components/patient/ui/MoodEmoji";
import { cn } from "@/lib/utils";

export function insightText(insight: ReportInsight, copy: ReturnType<typeof usePatientCopy>): string {
  const template = copy.reports.insights[insight.code];
  const value = insight.value === null ? "" : Math.abs(insight.value) % 1 === 0 ? String(insight.value) : String(Math.round(insight.value * 10) / 10);
  return fill(template, { value });
}

export function ReportCardSkeleton() {
  return (
    <div className="lm-glass space-y-4 p-5" aria-hidden>
      <div className="flex justify-between"><Skeleton className="h-5 w-32" /><Skeleton className="h-5 w-16 rounded-full" /></div>
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-full" />
      <div className="flex gap-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-24" /></div>
    </div>
  );
}

/**
 * One week. Hovering or focusing reveals an eye cue; opening morphs the card into the report
 * (shared `layoutId` with the modal). Motion is subtle and switched off for reduced-motion.
 */
export function ReportCard({ item, onOpen, locked = false }: { item: ReportListItem; onOpen: () => void; locked?: boolean }) {
  const copy = usePatientCopy();
  const { language } = useLanguage();
  const reduce = useReducedMotion();
  const inProgress = item.status === "IN_PROGRESS";
  const mood = moodForLevel(item.moodAverage);
  // Mood is 1-5, so half a point is the smallest change worth naming (the report uses the same threshold).
  const up = item.moodDelta !== null && item.moodDelta >= 0.5;
  const down = item.moodDelta !== null && item.moodDelta <= -0.5;
  const opensOn = formatDay(addDaysLocal(parseDay(item.weekEnd), 1), language, { weekday: "long", month: "short", day: "numeric" });

  // The first week is still running: the card is a plain, disabled preview. No click, no focus, no request.
  if (locked) {
    return (
      <div
        aria-disabled="true"
        className="lm-glass relative flex w-full cursor-not-allowed flex-col gap-4 overflow-hidden border-dashed border-teal-200 bg-white/45 p-5 text-start"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm  text-ink">{fill(copy.reports.weekOf, { range: formatRange(item.weekStart, item.weekEnd, language) })}</p>
            <span className="chip chip-pending mt-1.5">
              <CalendarClock className="size-3" aria-hidden />
              {copy.reports.inProgress} · {fill(copy.reports.dayOf, { a: dayOfPeriod(item.weekStart) })}
            </span>
          </div>
          <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700"><LockKeyhole className="size-4" /></span>
        </div>
        <p className="text-xs text-muted-foreground">
          <span>{copy.reports.metrics.checkins}: <b className=" text-ink-soft">{item.checkinDays}/7</b></span>
          <span className="ms-4">{copy.reports.metrics.journal}: <b className=" text-ink-soft">{item.journalEntries}</b></span>
        </p>
        <p className="text-sm font-medium text-teal-800">{fill(copy.reports.locked, { date: opensOn })}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{copy.reports.lockedHint}</p>
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      layoutId={reduce ? undefined : `report-${item.weekStart}`}
      onClick={onOpen}
      whileHover={reduce ? undefined : { y: -4 }}
      whileTap={reduce ? undefined : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      aria-label={`${fill(copy.reports.weekOf, { range: formatRange(item.weekStart, item.weekEnd, language) })} — ${copy.reports.view}`}
      className={cn(
        "lm-glass group relative flex w-full flex-col gap-4 overflow-hidden p-5 text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500",
        inProgress && "border-dashed border-teal-300 bg-white/45",
      )}
    >
      {/* The eye cue: a soft circle that fades in on hover/focus. */}
      <span
        aria-hidden
        className="pointer-events-none absolute end-4 top-4 flex size-9 scale-75 items-center justify-center rounded-full bg-teal-600 text-white opacity-0 shadow-brand transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
      >
        <Eye className="size-4" />
      </span>

      <div className="flex items-start justify-between gap-3 pe-11">
        <div className="min-w-0">
          <p className="text-sm  text-ink">{fill(copy.reports.weekOf, { range: formatRange(item.weekStart, item.weekEnd, language) })}</p>
          <span className={cn("chip mt-1.5", inProgress ? "chip-pending" : "chip-success")}>
            {inProgress && <CalendarClock className="size-3" aria-hidden />}
            {inProgress ? `${copy.reports.inProgress} · ${fill(copy.reports.dayOf, { a: dayOfPeriod(item.weekStart) })}` : copy.reports.ready}
          </span>
        </div>
      </div>

      {item.hasEnoughData || inProgress ? (
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{copy.reports.metrics.mood}</p>
            <p className="flex items-center gap-2 text-3xl  tabular-nums text-ink">
              {mood && <MoodEmoji level={mood} className="text-3xl" />}
              {item.moodAverage ?? "—"}
              {(up || down) && (
                <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", up ? "text-sage-700" : "text-gold-700")}>
                  {up ? <TrendingUp className="size-3.5" aria-hidden /> : <TrendingDown className="size-3.5" aria-hidden />}
                  {item.moodDelta! > 0 ? "+" : ""}{item.moodDelta}
                </span>
              )}
            </p>
          </div>
          <div className="w-28 sm:w-32"><Sparkline values={item.moodSeries} height={44} domain={[1, 5]} /></div>
        </div>
      ) : (
        <p className="rounded-xl bg-white/60 px-3 py-3 text-sm text-muted-foreground">{copy.reports.quietWeek}</p>
      )}

      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{copy.reports.metrics.checkins}: <b className=" text-ink-soft">{item.checkinDays}/7</b></span>
        <span>{copy.reports.metrics.journal}: <b className=" text-ink-soft">{item.journalEntries}</b></span>
      </p>

      {inProgress && (
        <p className="text-xs text-teal-700">
          {fill(copy.reports.inProgressBody, { date: formatDay(addDaysLocal(parseDay(item.weekEnd), 1), language, { weekday: "long", month: "short", day: "numeric" }) })}
        </p>
      )}
      {!inProgress && item.highlights[0] && item.highlights[0].code !== "LOW_DATA" && (
        <p className="line-clamp-2 text-[0.8125rem] leading-snug text-ink-soft" dir="auto">{insightText(item.highlights[0], copy)}</p>
      )}
    </motion.button>
  );
}
