"use client";

import { motion } from "framer-motion";
import { CalendarCheck2, Dumbbell, HeartHandshake, Pill, Printer, Sparkles, TriangleAlert } from "lucide-react";
import { insightText } from "@/components/patient/reports/ReportCards";
import { ErrorState, Skeleton } from "@/components/patient/ui/primitives";
import { TrendChart } from "@/components/patient/ui/TrendChart";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useReport } from "@/hooks/patient/useReports";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import type { ReportDetail } from "@/lib/api/patient-types";
import { fill } from "@/lib/i18n/patient";
import { formatDay, formatRange } from "@/lib/patient/format";
import { moodForLevel, scaleColor, type EmotionKey } from "@/lib/patient/moods";
import { cn } from "@/lib/utils";

const TONE = {
  positive: "border-sage-100 bg-sage-50 text-sage-700",
  neutral: "border-teal-100 bg-teal-50/80 text-teal-800",
  attention: "border-gold-100 bg-gold-50 text-gold-700",
} as const;

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white/70 p-3.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-2xl  tabular-nums text-ink">{value}</p>
      {hint && <p className="text-xs text-teal-700">{hint}</p>}
    </div>
  );
}

function print() {
  document.body.classList.add("printing-report");
  const done = () => {
    document.body.classList.remove("printing-report");
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
}

/** A clinician's released, patient-facing text — rendered defensively, as its shape may grow. */
function clinicianFacts(content: unknown): string[] {
  if (!content || typeof content !== "object") return [];
  return Object.values(content as Record<string, unknown>).filter((value): value is string => typeof value === "string" && value.length > 0 && value.length < 240);
}

export function ReportView({ weekStart }: { weekStart: string }) {
  const copy = usePatientCopy();
  const resource = useReport(weekStart);
  if (resource.error && !resource.data) return <ErrorState message={copy.reports.detail.loadError} onRetry={() => void resource.refresh()} />;
  if (!resource.data) {
    return (
      <div className="mt-6 space-y-4" aria-hidden>
        <Skeleton className="h-8 w-2/3" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
        <Skeleton className="h-48" />
      </div>
    );
  }
  return <Body report={resource.data} />;
}

function Body({ report }: { report: ReportDetail }) {
  const copy = usePatientCopy();
  const d = copy.reports.detail;
  const { language } = useLanguage();
  const chart = report.days.map((day) => ({ label: formatDay(day.date, language, { weekday: "short" }), value: day.mood }));
  const hasMood = chart.some((point) => point.value !== null);
  const best = report.bestDay;
  const hard = report.hardestDay;
  const dims = [
    { key: "mood", value: report.averages.mood },
    { key: "energy", value: report.averages.energy },
    { key: "focus", value: report.averages.focus },
  ] as const;
  const shown = dims.filter((item) => item.value !== null);
  const facts = report.clinician ? clinicianFacts(report.clinician.content) : [];

  return (
    <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.4 }} className="mt-5 space-y-6" data-report-print>
      <header className="flex flex-wrap items-start justify-between gap-3 pe-10">
        <div>
          <p className="lm-eyebrow">{report.status === "IN_PROGRESS" ? copy.reports.inProgress : copy.reports.ready}</p>
          <h2 className="mt-1 text-xl  text-ink sm:text-2xl">{fill(copy.reports.weekOf, { range: formatRange(report.weekStart, report.weekEnd, language) })}</h2>
        </div>
        <Button variant="outline" size="sm" onClick={print} className="print:hidden"><Printer aria-hidden />{d.print}</Button>
      </header>

      <section aria-label={d.summary} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label={copy.reports.metrics.checkins} value={`${report.checkinDays}/7`} />
        <Tile label={copy.reports.metrics.journal} value={String(report.journalEntries)} />
        <Tile
          label={copy.reports.metrics.mood}
          value={report.averages.mood !== null ? `${moodForLevel(report.averages.mood)?.emoji ?? ""} ${report.averages.mood}` : "—"}
          hint={report.moodDelta !== null ? fill(d.vs, { delta: `${report.moodDelta > 0 ? "+" : ""}${report.moodDelta}` }) : undefined}
        />
        <Tile label={copy.reports.metrics.consistency} value={`${Math.round(report.consistency * 100)}%`} />
      </section>

      {report.insights.length > 0 && (
        <section aria-label={d.highlights}>
          <h3 className="mb-2.5 flex items-center gap-2 text-sm  text-ink"><Sparkles className="size-4 text-teal-600" aria-hidden />{d.highlights}</h3>
          <ul className="space-y-2">
            {report.insights.map((insight) => (
              <li key={insight.code} className={cn("rounded-2xl border px-4 py-3 text-sm leading-snug", TONE[insight.tone])} dir="auto">{insightText(insight, copy)}</li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label={d.moodChart}>
        <h3 className="mb-2 text-sm  text-ink">{d.moodChart}</h3>
        {hasMood ? <TrendChart data={chart} height={200} domain={[1, 5]} ticks={[1, 3, 5]} /> : <p className="rounded-xl bg-white/60 px-4 py-8 text-center text-sm text-muted-foreground">{d.noMood}</p>}
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {best && <span className="chip chip-success">{d.bestDay}: {formatDay(best.date, language, { weekday: "long" })} {moodForLevel(best.mood)?.emoji}</span>}
          {hard && <span className="chip chip-pending">{d.hardestDay}: {formatDay(hard.date, language, { weekday: "long" })} {moodForLevel(hard.mood)?.emoji}</span>}
        </div>
        <div className="mt-3 flex gap-1.5" dir="ltr" aria-hidden>
          {report.days.map((day) => (
            <span key={day.date} className="flex flex-1 flex-col items-center gap-1 text-[0.625rem] text-muted-foreground">
              <span className={cn("size-2 rounded-full", day.checkedIn ? "bg-teal-600" : "bg-ink/15")} />
              <span className={cn("size-2 rounded-full", day.journaled ? "bg-gold-600" : "bg-ink/15")} />
            </span>
          ))}
        </div>
        <p className="mt-1 flex gap-4 text-[0.6875rem] text-muted-foreground"><span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-teal-600" />{d.checkedIn}</span><span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-gold-600" />{d.journaled}</span></p>
      </section>

      {(shown.length > 0 || report.averages.sleepHours !== null) && (
        <section aria-label={d.dimensions}>
          <h3 className="mb-2.5 text-sm  text-ink">{d.dimensions}</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {shown.map((item) => (
              <li key={item.key} className="rounded-2xl bg-white/70 p-3.5">
                <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium text-ink">{copy.dimensions[item.key]}</span><span className="tabular-nums text-ink-soft">{item.value}/5</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-ink/10"><motion.div className="h-full rounded-full" style={{ background: scaleColor((item.value ?? 0) * 2) }} initial={{ width: 0 }} animate={{ width: `${((item.value ?? 0) / 5) * 100}%` }} transition={{ duration: 0.8 }} /></div>
              </li>
            ))}
            {report.averages.sleepHours !== null && (
              <li className="rounded-2xl bg-white/70 p-3.5">
                <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium text-ink">{copy.dimensions.sleep}</span><span className="tabular-nums text-ink-soft">{report.averages.sleepHours}h</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-ink/10"><motion.div className="h-full rounded-full bg-teal-500" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (report.averages.sleepHours / 10) * 100)}%` }} transition={{ duration: 0.8 }} /></div>
              </li>
            )}
            {report.journal.goalAverage !== null && (
              <li className="rounded-2xl bg-white/70 p-3.5">
                <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium text-ink">{copy.reports.metrics.goals}</span><span className="tabular-nums text-ink-soft">{report.journal.goalAverage}/10</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-ink/10"><motion.div className="h-full rounded-full bg-sage-700" initial={{ width: 0 }} animate={{ width: `${report.journal.goalAverage * 10}%` }} transition={{ duration: 0.8 }} /></div>
              </li>
            )}
          </ul>
        </section>
      )}

      {(report.topEmotions.length > 0 || report.exercisesCompleted > 0 || report.medication.adherence !== null) && (
        <section className="grid gap-3 sm:grid-cols-3">
          {report.topEmotions.length > 0 && (
            <div className="rounded-2xl bg-white/70 p-3.5">
              <p className="mb-2 flex items-center gap-1.5 text-xs  text-ink-soft"><HeartHandshake className="size-3.5" aria-hidden />{d.emotions}</p>
              <div className="flex flex-wrap gap-1.5">{report.topEmotions.map((item) => <span key={item.emotion} className="chip">{copy.journal.emotions[item.emotion as EmotionKey] ?? item.emotion}</span>)}</div>
            </div>
          )}
          {report.exercisesCompleted > 0 && (
            <div className="rounded-2xl bg-white/70 p-3.5">
              <p className="mb-1 flex items-center gap-1.5 text-xs  text-ink-soft"><Dumbbell className="size-3.5" aria-hidden />{d.exercises}</p>
              <p className="text-2xl  tabular-nums text-ink">{report.exercisesCompleted}</p>
            </div>
          )}
          {report.medication.adherence !== null && (
            <div className="rounded-2xl bg-white/70 p-3.5">
              <p className="mb-1 flex items-center gap-1.5 text-xs  text-ink-soft"><Pill className="size-3.5" aria-hidden />{d.medication}</p>
              <p className="text-sm text-ink">{fill(d.taken, { taken: report.medication.taken, total: report.medication.taken + report.medication.missed + report.medication.skipped })}</p>
            </div>
          )}
        </section>
      )}

      {report.clinician && (
        <section className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4" aria-label={d.clinician}>
          <h3 className="flex items-center gap-2 text-sm  text-teal-800"><CalendarCheck2 className="size-4" aria-hidden />{d.clinician}</h3>
          {report.clinician.headline && <p className="mt-2 text-sm text-ink" dir="auto">{report.clinician.headline}</p>}
          {facts.length > 0 && <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink-soft" dir="auto">{facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>}
          {report.clinician.note && (
            <div className="mt-3 rounded-xl bg-white/80 p-3">
              <p className="text-xs  text-teal-800">{d.clinicianNote}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink" dir="auto">{report.clinician.note}</p>
            </div>
          )}
        </section>
      )}

      <p className="flex items-start gap-2 text-xs text-muted-foreground"><TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />{d.disclaimer}</p>
    </motion.article>
  );
}
