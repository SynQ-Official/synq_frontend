"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Flame, HeartPulse, Moon, Target, Zap, type LucideIcon } from "lucide-react";
import { ErrorState, GlassCard, SectionTitle, Skeleton } from "@/components/patient/ui/primitives";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMonthlyCheckinReport } from "@/hooks/patient/useCheckin";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import type { DailyMetricBlock, DailyMetricKey, DailyReport } from "@/lib/api/patient-types";
import { fill } from "@/lib/i18n/patient";
import { formatDay } from "@/lib/patient/format";
import { cn } from "@/lib/utils";

const METRICS: { key: DailyMetricKey; icon: LucideIcon; unit: string }[] = [
  { key: "mood", icon: HeartPulse, unit: "/5" },
  { key: "energy", icon: Zap, unit: "/5" },
  { key: "focus", icon: Target, unit: "/5" },
  { key: "sleep", icon: Moon, unit: "h" },
];

/** What the longitudinal service says about the change: the words are its own, the tone is ours. */
type TrendKey = "higher" | "mildly higher" | "lower" | "mildly lower" | "stable";
const TREND_TONE: Record<TrendKey, string> = {
  higher: "chip-success",
  "mildly higher": "chip-success",
  stable: "",
  "mildly lower": "chip-pending",
  lower: "chip-pending",
};

const round = (value: number) => Math.round(value * 10) / 10;

/** The patient's own check-in report for a month: averages, the change against their own baseline, and goals. */
export function MonthlyReport() {
  const copy = usePatientCopy();
  const m = copy.reports.monthly;
  const { language } = useLanguage();
  const now = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const resource = useMonthlyCheckinReport(cursor.year, cursor.month);
  const atCurrent = cursor.year === now.getFullYear() && cursor.month === now.getMonth() + 1;
  const label = formatDay(new Date(cursor.year, cursor.month - 1, 1), language, { month: "long", year: "numeric" });

  function shift(by: number) {
    setCursor(({ year, month }) => {
      const next = new Date(year, month - 1 + by, 1);
      return { year: next.getFullYear(), month: next.getMonth() + 1 };
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg  text-ink">{m.title}</h2>
          <p className="text-sm text-ink-soft">{m.subtitle}</p>
        </div>
        <div className="flex items-center gap-1" role="group" aria-label={m.title}>
          <Button variant="outline" size="icon" aria-label={m.previous} onClick={() => shift(-1)}><ChevronLeft className="rtl:-scale-x-100" aria-hidden /></Button>
          <span className="min-w-32 text-center text-sm  text-ink" aria-live="polite">{label}</span>
          <Button variant="outline" size="icon" aria-label={m.next} onClick={() => shift(1)} disabled={atCurrent}><ChevronRight className="rtl:-scale-x-100" aria-hidden /></Button>
        </div>
      </div>

      {resource.error && !resource.data ? (
        <ErrorState message={m.loadError} onRetry={() => void resource.refresh()} />
      ) : !resource.data ? (
        <div className="grid gap-5 sm:grid-cols-2"><Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" /></div>
      ) : (
        <Body report={resource.data} />
      )}
    </div>
  );
}

function Body({ report }: { report: DailyReport }) {
  const copy = usePatientCopy();
  const m = copy.reports.monthly;
  const g = report.goals;
  const enough = report.status === "ok";

  return (
    <>
      <p className="flex items-center gap-2 rounded-2xl border border-teal-100 bg-teal-50/80 px-4 py-3 text-sm text-teal-800">
        <Flame className="size-4 shrink-0" aria-hidden />
        {fill(m.availability, { a: report.availability.checkins, b: report.availability.days })}
      </p>

      {!enough ? (
        <p className="lm-inset px-4 py-10 text-center text-sm text-muted-foreground">{m.insufficient}</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {METRICS.map(({ key, icon, unit }) => (
            <li key={key} className="flex"><MetricCard metric={report.metrics[key]} name={copy.dimensions[key]} icon={icon} unit={unit} /></li>
          ))}
        </ul>
      )}

      {enough && report.elevated_short_sleep && (
        <p role="note" className="rounded-2xl border border-gold-100 bg-gold-50/90 px-4 py-3 text-sm text-ink-soft">
          {fill(m.elevatedSleep, {
            n: report.elevated_short_sleep.length,
            from: report.elevated_short_sleep.start.slice(5),
            to: report.elevated_short_sleep.end.slice(5),
          })}
        </p>
      )}

      {g.created > 0 && (
        <GlassCard aria-label={m.goals}>
          <SectionTitle title={m.goals} subtitle={fill(m.goalsCreated, { n: g.created })} />
          <dl className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: copy.checkin.goalStatus.COMPLETED, value: g.completed, tone: "text-sage-700" },
              { label: copy.checkin.goalStatus.PARTIAL, value: g.partial, tone: "text-gold-700" },
              { label: copy.checkin.goalStatus.MISSED, value: g.missed, tone: "text-rose-700" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-white/70 px-2 py-3">
                <dd className={cn("text-2xl  tabular-nums", item.tone)}>{item.value}</dd>
                <dt className="mt-0.5 text-xs text-muted-foreground">{item.label}</dt>
              </div>
            ))}
          </dl>
          {g.completion_rate !== null && <p className="mt-3 text-sm text-ink-soft">{fill(m.completionRate, { n: Math.round(g.completion_rate * 100) })}</p>}
        </GlassCard>
      )}

      {report.data_limitations.length > 0 && (
        <p className="text-xs leading-relaxed text-muted-foreground">{m.limitations}: {report.data_limitations.join(" · ")}</p>
      )}
      <p className="text-xs text-muted-foreground">{m.disclaimer}</p>
    </>
  );
}

function MetricCard({ metric, name, icon: Icon, unit }: { metric: DailyMetricBlock; name: string; icon: LucideIcon; unit: string }) {
  const copy = usePatientCopy();
  const m = copy.reports.monthly;
  const status = metric.trend.status;
  const trend = (status in TREND_TONE ? status : null) as TrendKey | null;
  const mean = metric.mean === null ? "—" : `${round(metric.mean)}${unit}`;

  return (
    <GlassCard className="w-full" aria-label={name}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="stat-tile size-10 shrink-0"><Icon className="size-[1.125rem]" aria-hidden /></span>
          <div className="min-w-0">
            <p className="text-sm  text-ink">{name}</p>
            <p className="text-xs text-muted-foreground">{m.average}</p>
          </div>
        </div>
        <p className="text-3xl  tabular-nums text-ink" dir="ltr">{mean}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {trend && (
          <span className={cn("chip", TREND_TONE[trend])}>
            {m.trend[trend]} · {metric.trend.against === "previous_week" ? m.againstWeek : m.againstMonth}
          </span>
        )}
        {metric.delta_vs_baseline !== null && (
          <span className="chip">{fill(m.vsBaseline, { delta: `${metric.delta_vs_baseline > 0 ? "+" : ""}${round(metric.delta_vs_baseline)}` })}</span>
        )}
        {metric.lower_days > 0 && <span className="chip">{fill(m.lowerDays, { n: metric.lower_days })}</span>}
        {(metric.higher_days ?? 0) > 0 && <span className="chip">{fill(m.higherDays, { n: metric.higher_days ?? 0 })}</span>}
      </div>

      {metric.sustained && (
        <p className="mt-3 text-xs leading-relaxed text-ink-soft">
          {fill(m.sustained, { n: metric.sustained.length, from: metric.sustained.start.slice(5), to: metric.sustained.end.slice(5) })}
        </p>
      )}
      {metric.sustained_high && (
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">
          {fill(m.sustainedHigh, { n: metric.sustained_high.length, from: metric.sustained_high.start.slice(5), to: metric.sustained_high.end.slice(5) })}
        </p>
      )}
    </GlassCard>
  );
}
