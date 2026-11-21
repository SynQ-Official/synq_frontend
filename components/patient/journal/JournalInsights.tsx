"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Info, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { EmptyState, ErrorState, GlassCard, SectionTitle, Skeleton } from "@/components/patient/ui/primitives";
import { TrendChart } from "@/components/patient/ui/TrendChart";
import { useLanguage } from "@/contexts/LanguageContext";
import { useJournalInsights } from "@/hooks/patient/useJournal";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import type { JournalInsights as Insights, Trend } from "@/lib/api/patient-types";
import { fill } from "@/lib/i18n/patient";
import { formatDay } from "@/lib/patient/format";
import { signalLabel, themeLabel } from "@/lib/patient/journal-labels";
import { moodFor, toFiveScale, type EmotionKey } from "@/lib/patient/moods";
import { cn } from "@/lib/utils";

const RANGES = [7, 30, 90] as const;

function TrendChip({ trend, delta }: { trend: Trend; delta: number | null }) {
  const copy = usePatientCopy();
  const Icon = trend === "UP" ? TrendingUp : trend === "DOWN" ? TrendingDown : Minus;
  return (
    <span className={cn("chip shrink-0", trend === "UP" && "chip-success", trend === "DOWN" && "chip-pending")}>
      <Icon className="size-3" aria-hidden />
      {copy.journal.insights.trend[trend]}
      {delta !== null && trend !== "UNKNOWN" && <span className="tabular-nums">{delta > 0 ? ` +${delta}` : ` ${delta}`}</span>}
    </span>
  );
}

/**
 * What the journal says over time. Built to resist over-reading: below a handful of writing days
 * it only describes, and says so; trends appear once there is enough to stand on.
 */
export function JournalInsights() {
  const copy = usePatientCopy();
  const i = copy.journal.insights;
  const { language } = useLanguage();
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const resource = useJournalInsights(days);
  const data = resource.data;

  const label = (date: string) => formatDay(date, language, { month: "short", day: "numeric" });
  const moodSeries = useMemo(() => (data?.mood.series ?? []).map((point) => ({ label: label(point.date), value: point.value })), [data, language]); // eslint-disable-line react-hooks/exhaustive-deps
  const goalSeries = useMemo(() => (data?.goals.series ?? []).map((point) => ({ label: label(point.date), value: point.value })), [data, language]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg  text-ink">{i.title}</h2>
        <div role="group" aria-label={i.title} className="segmented">
          {RANGES.map((range) => (
            <button key={range} type="button" aria-pressed={days === range} onClick={() => setDays(range)} className="lm-tab">
              {copy.journal.history.ranges[String(range) as "7" | "30" | "90"]}
            </button>
          ))}
        </div>
      </div>

      {resource.error && !data ? (
        <ErrorState message={i.loadError} onRetry={() => void resource.refresh()} />
      ) : !data ? (
        <div className="grid gap-5 md:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
      ) : data.totals.entries === 0 ? (
        <EmptyState title={i.empty} />
      ) : (
        <Loaded data={data} days={days} moodSeries={moodSeries} goalSeries={goalSeries} />
      )}
    </div>
  );
}

function Loaded({ data, days, moodSeries, goalSeries }: { data: Insights; days: number; moodSeries: { label: string; value: number }[]; goalSeries: { label: string; value: number }[] }) {
  const copy = usePatientCopy();
  const i = copy.journal.insights;
  const { language } = useLanguage();
  const partial = data.confidence === "INSUFFICIENT";
  const banner = data.confidence === "ESTABLISHED" ? fill(i.confidence.ESTABLISHED, { n: data.totals.activeDays }) : i.confidence[data.confidence];

  return (
    <>
      <div role="note" className={cn("flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm", partial ? "border-gold-100 bg-gold-50 text-gold-700" : "border-teal-100 bg-teal-50/70 text-teal-800")}>
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />{banner}
      </div>

      {data.signals.length > 0 && (
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {data.signals.map((signal) => (
            <li key={signal} className="lm-glass flex items-center gap-3 px-4 py-3 text-sm text-ink">
              <span className="size-2 shrink-0 rounded-full bg-teal-500" aria-hidden />{i.signals[signal]}
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <GlassCard aria-label={i.moodTrend}>
          <SectionTitle title={i.moodTrend} subtitle={data.mood.average !== null ? `${i.average} ${toFiveScale(data.mood.average)}/5` : undefined} action={<TrendChip trend={data.mood.trend} delta={data.mood.delta} />} />
          {moodSeries.length >= 2 && !partial ? <TrendChart data={moodSeries} height={200} /> : <p className="rounded-xl bg-white/60 px-4 py-10 text-center text-sm text-muted-foreground">{i.trend.UNKNOWN}</p>}
        </GlassCard>

        <GlassCard aria-label={i.goalTrend}>
          <SectionTitle title={i.goalTrend} subtitle={data.goals.average !== null ? `${i.average} ${data.goals.average}/10` : undefined} action={<TrendChip trend={data.goals.trend} delta={data.goals.delta} />} />
          {goalSeries.length >= 2 && !partial ? <TrendChart data={goalSeries} color="#6f9d92" height={200} /> : <p className="rounded-xl bg-white/60 px-4 py-10 text-center text-sm text-muted-foreground">{i.trend.UNKNOWN}</p>}
        </GlassCard>

        <GlassCard aria-label={i.consistency}>
          <SectionTitle title={i.consistency} subtitle={i.window.replace("{n}", String(days))} />
          <div className="mb-4 grid grid-cols-3 gap-3 text-center">
            {[
              { label: i.streak, value: data.totals.currentStreak, icon: true },
              { label: i.longest, value: data.totals.longestStreak },
              { label: i.activeDays, value: data.totals.activeDays },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/65 px-2 py-3">
                <p className="flex items-center justify-center gap-1 text-2xl  tabular-nums text-ink">{stat.icon && <Flame className="size-4 text-gold-600" aria-hidden />}{stat.value}</p>
                <p className="mt-0.5 text-[0.6875rem] leading-tight text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${days <= 7 ? 7 : days <= 30 ? 10 : 15}, minmax(0, 1fr))` }} dir="ltr">
            {data.calendar.map((cell, index) => {
              const mood = moodFor(cell.mood);
              return (
                <motion.span
                  key={cell.date}
                  title={`${formatDay(cell.date, language)} · ${cell.entries}`}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(index, 60) * 0.008 }}
                  className="aspect-square rounded-md"
                  style={{ background: cell.entries ? (mood?.color ?? "#7ea5ab") : "rgb(44 62 59 / 0.07)", opacity: cell.entries ? 1 : 0.9 }}
                />
              );
            })}
          </div>
        </GlassCard>

        <GlassCard aria-label={i.emotions}>
          <SectionTitle title={i.emotions} />
          {data.emotions.length ? (
            <ul className="space-y-3">
              {data.emotions.map((item) => (
                <li key={item.emotion}>
                  <div className="mb-1 flex justify-between text-sm"><span className="font-medium text-ink">{copy.journal.emotions[item.emotion as EmotionKey] ?? item.emotion}</span><span className="tabular-nums text-muted-foreground">{item.count}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink/10"><motion.div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 rtl:bg-gradient-to-l" initial={{ width: 0 }} animate={{ width: `${Math.max(6, item.share * 100)}%` }} transition={{ duration: 0.7 }} /></div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">—</p>}
          {(data.themes.length > 0 || data.journalSignals.length > 0 || data.hardMoments > 0) && (
            <div className="mt-5 border-t border-white/70 pt-4">
              <p className="mb-2 text-xs  text-ink-soft">{i.themes}</p>
              <div className="flex flex-wrap gap-1.5">
                {data.themes.map((item) => <span key={item.theme} className="chip" dir="auto">{themeLabel(item.theme, copy)} · {item.count}</span>)}
                {data.journalSignals.map((item) => <span key={item.signal} className="chip" dir="auto">{signalLabel(item.signal, copy)} · {item.count}</span>)}
                {data.hardMoments > 0 && <span className="chip chip-pending">{fill(i.hardMoments, { n: data.hardMoments })}</span>}
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      <GlassCard aria-label={i.weekly}>
        <SectionTitle title={i.weekly} />
        <div className="grid gap-3 sm:grid-cols-2">
          {[{ title: i.last7, block: data.recent.last7 }, { title: i.prev7, block: data.recent.previous7 }].map(({ title, block }) => (
            <div key={title} className="rounded-2xl bg-white/65 p-4">
              <p className="text-xs  text-teal-700">{title}</p>
              <p className="mt-1 text-sm text-ink-soft">{fill(i.entries, { n: block.entries })}</p>
              <p className="mt-1 text-sm text-ink-soft tabular-nums">{copy.reports.metrics.mood}: {toFiveScale(block.moodAverage) ?? "—"} · {copy.reports.metrics.goals}: {block.goalAverage ?? "—"}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </>
  );
}
