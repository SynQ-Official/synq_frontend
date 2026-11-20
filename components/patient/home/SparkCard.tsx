"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Clock, Zap } from "lucide-react";
import { useReasonText } from "@/components/patient/spark/SparkTaskItem";
import { GlassCard, SectionTitle, Skeleton } from "@/components/patient/ui/primitives";
import { Button } from "@/components/ui/button";
import { usePatient } from "@/hooks/patient/usePatient";
import { useSpark } from "@/hooks/patient/useSpark";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { fill } from "@/lib/i18n/patient";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

const SHOWN = 3;

/**
 * Spark on the home screen, ADHD patients only: a small view of today's tasks in the order Spark chose, with a
 * way to finish one and a way into the full page. Adding and sorting tasks lives on the Spark page.
 */
export function SparkCard() {
  const copy = usePatientCopy().home.spark;
  const { profile } = usePatient();
  const isAdhd = profile.track === "ADHD";
  const spark = useSpark(isAdhd);
  const reasonOf = useReasonText();
  if (!isAdhd) return null;

  const { view } = spark;
  const today = view?.tasks.filter((task) => task.bucket !== "later") ?? [];
  const later = (view?.tasks.length ?? 0) - today.length;
  const shown = today.slice(0, SHOWN);
  const done = view?.stats.doneToday ?? 0;
  const total = done + today.length;

  return (
    <GlassCard data-tour="spark" className="relative overflow-hidden">
      <span aria-hidden className="pointer-events-none absolute -end-16 -top-16 size-48 rounded-full bg-gold-100/70 blur-3xl" />
      <div className="relative">
        <SectionTitle
          title={copy.title}
          subtitle={view?.headline ?? copy.subtitle}
          action={<span className="chip shrink-0"><Zap className="size-3" aria-hidden />{copy.badge}</span>}
        />

        {!view ? (
          <div className="space-y-2.5" aria-busy>
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        ) : spark.error || (view.degraded && today.length === 0) ? (
          <p className="text-sm text-muted-foreground" role="status">{copy.unavailable}</p>
        ) : shown.length === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 flex-1 basis-56 text-sm text-ink-soft">{done > 0 ? copy.allDone : copy.empty}</p>
            <Button asChild><Link href="/dashboard/spark"><Zap aria-hidden />{copy.add}</Link></Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
                <span>{fill(copy.progress, { a: done, b: total })}</span>
                {later > 0 && <span>{fill(copy.later, { n: later })}</span>}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-teal-100" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
                <div className="h-full rounded-full bg-teal-600 transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
              </div>
            </div>

            <ul className="grid gap-2.5 md:grid-cols-3">
              <AnimatePresence initial={false} mode="popLayout">
              {shown.map((task, index) => (
                <motion.li
                  key={task.id}
                  layout
                  // A finished task checks, shrinks and leaves; the rest close the gap.
                  exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.28, ease: EASE_OUT } }}
                  className={cn("lm-inset flex min-w-0 items-start gap-3 p-3.5", index === 0 && "ring-1 ring-teal-300/70")}
                >
                  <button
                    type="button"
                    onClick={() => void spark.finish(task.id)}
                    disabled={spark.busy}
                    aria-label={`${task.title}`}
                    className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-teal-300 bg-white text-transparent transition-colors hover:border-teal-600 hover:text-teal-600 focus-visible:text-teal-600 disabled:opacity-60"
                  >
                    <Check className="size-3.5" aria-hidden />
                  </button>
                  <div className="min-w-0">
                    {index === 0 && <p className="lm-eyebrow mb-0.5">{copy.next}</p>}
                    <p className="text-sm font-medium leading-snug text-ink">{task.title}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" aria-hidden />{fill(copy.min, { n: task.estimateMin })}</p>
                    {index === 0 && <p className="mt-1.5 text-xs leading-snug text-ink-soft">{reasonOf(task)}</p>}
                  </div>
                </motion.li>
              ))}
              </AnimatePresence>
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{today.length > SHOWN ? fill(copy.more, { n: today.length - SHOWN }) : ""}</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/spark">{copy.open}<ArrowRight className="rtl:-scale-x-100" aria-hidden /></Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
