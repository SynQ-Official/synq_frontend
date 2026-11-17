"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, HeartHandshake, Undo2, Zap } from "lucide-react";
import { FocusTimer } from "@/components/patient/spark/FocusTimer";
import { SparkTaskItem } from "@/components/patient/spark/SparkTaskItem";
import { phoneOf } from "@/components/patient/ui/SupportCard";
import { EmptyState, ErrorState, GlassCard, PageIntro, SectionTitle, Skeleton } from "@/components/patient/ui/primitives";
import { Button } from "@/components/ui/button";
import { usePatient } from "@/hooks/patient/usePatient";
import { useSpark } from "@/hooks/patient/useSpark";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { fill } from "@/lib/i18n/patient";
import { cn } from "@/lib/utils";

const LATER_PREVIEW = 3;
const hourLabel = (hour: number) => `${String(hour % 24).padStart(2, "0")}:00`;

/** Spark: tell it what is on your mind, and it sorts the day from how you are doing. ADHD track only. */
export function SparkView() {
  const copy = usePatientCopy().spark;
  const { profile } = usePatient();
  const router = useRouter();
  const isAdhd = profile.track === "ADHD";
  const spark = useSpark(isAdhd);
  const [text, setText] = useState("");
  const [showAllLater, setShowAllLater] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Spark belongs to the ADHD track: send a typed URL home instead of showing a dead page.
  useEffect(() => {
    if (profile.track !== "UNSPECIFIED" && !isAdhd) router.replace("/dashboard");
  }, [isAdhd, profile.track, router]);
  if (!isAdhd) return null;

  const { view } = spark;
  const today = view?.tasks.filter((task) => task.bucket !== "later") ?? [];
  const later = view?.tasks.filter((task) => task.bucket === "later") ?? [];
  const first = today[0];
  const rest = today.slice(1);
  const shownLater = showAllLater ? later : later.slice(0, LATER_PREVIEW);

  async function submit() {
    const value = text.trim();
    if (!value || spark.busy) return;
    const next = await spark.add(value);
    if (!next) return;
    // nothing found: keep the words, so they can be rephrased instead of retyped
    if (next.safety || next.added > 0) setText("");
    setNotice(next.safety ? null : next.added > 0 ? fill(copy.capture.added, { n: next.added }) : copy.capture.nothing);
  }

  const back = (
    <Button asChild variant="ghost" size="lg">
      <Link href="/dashboard"><ArrowLeft className="rtl:-scale-x-100" aria-hidden />{copy.back}</Link>
    </Button>
  );
  const actions = {
    busy: spark.busy,
    onFinish: (id: string) => void spark.finish(id),
    onDefer: (id: string) => void spark.defer(id),
    onRemove: (id: string) => void spark.remove(id),
    onTick: (id: string, index: number, done: boolean) => void spark.tick(id, index, done),
  };
  const capacity = view?.capacity;
  const peak = capacity && capacity.peakHours.length ? `${hourLabel(capacity.peakHours[0])}–${hourLabel(capacity.peakHours[capacity.peakHours.length - 1] + 1)}` : null;

  return (
    <div className="lm-rise">
      <PageIntro eyebrow={copy.eyebrow} icon={Zap} title={copy.title} subtitle={copy.subtitle} action={back} />

      {spark.error && !view ? (
        <ErrorState onRetry={() => void spark.refresh()} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-6">
          <div className="min-w-0 space-y-5 lg:space-y-6">
            {/* Tell Spark what is on your mind */}
            <GlassCard>
              <SectionTitle title={copy.capture.title} />
              <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="space-y-3">
                <label htmlFor="spark-text" className="sr-only">{copy.capture.label}</label>
                <textarea
                  id="spark-text" rows={3} maxLength={2000} value={text} onChange={(event) => setText(event.target.value)}
                  placeholder={copy.capture.placeholder}
                  className="lm-inset block w-full resize-none px-4 py-3 text-sm text-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-teal-500"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="min-w-0 flex-1 basis-56 text-xs text-muted-foreground">{copy.capture.hint}</p>
                  <Button type="submit" disabled={!text.trim() || spark.busy}>
                    <Zap aria-hidden />{spark.busy && text.trim() ? copy.capture.sorting : copy.capture.submit}
                  </Button>
                </div>
                <div aria-live="polite" className="min-h-0 text-sm">
                  {spark.failure && <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-rose-700">{copy.errors[spark.failure]}</p>}
                  {!spark.failure && notice && <p className="rounded-xl bg-sage-100 px-3.5 py-2.5 font-medium text-sage-700">{notice}</p>}
                </div>
              </form>
            </GlassCard>

            {view?.safety?.needsSupport && (
              <section role="region" aria-label={copy.safety.title} className="rounded-[1.5rem] border border-rose-100 bg-rose-50/80 p-5">
                <p className="flex items-center gap-2 font-semibold text-rose-700"><HeartHandshake className="size-5" aria-hidden />{copy.safety.title}</p>
                {view.safety.message && <p className="mt-2 text-sm leading-relaxed text-ink">{view.safety.message}</p>}
                {view.safety.emergencyResources.length > 0 && (
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {view.safety.emergencyResources.map((resource) => {
                      const phone = phoneOf(resource);
                      return (
                        <li key={resource}>
                          {phone ? <a href={`tel:${phone}`} className="font-semibold text-rose-700 underline underline-offset-2">{resource}</a> : <span className="text-ink">{resource}</span>}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}

            {view?.degraded && <p role="status" className="rounded-2xl bg-gold-100/70 px-4 py-3 text-sm text-ink">{copy.degraded}</p>}

            {/* Today, in order */}
            <GlassCard>
              <SectionTitle
                title={copy.today.title}
                subtitle={view?.headline ?? copy.today.subtitle}
                action={capacity && <span className="chip shrink-0">{copy.mode[capacity.mode]}</span>}
              />
              {!view ? (
                <div className="space-y-3" aria-busy>
                  <Skeleton className="h-28 w-full rounded-2xl" />
                  <Skeleton className="h-16 w-full rounded-2xl" />
                </div>
              ) : today.length === 0 ? (
                <EmptyState icon={Zap} title={copy.today.empty} />
              ) : (
                <ul className="space-y-3">
                  <AnimatePresence initial={false}>
                    {first && <SparkTaskItem key={first.id} task={first} variant="now" {...actions} />}
                    {rest.map((task) => <SparkTaskItem key={task.id} task={task} variant="row" {...actions} />)}
                  </AnimatePresence>
                </ul>
              )}
              {view && view.notes.length > 0 && (
                <ul className="mt-4 space-y-1 text-[0.8125rem] leading-snug text-muted-foreground">
                  {view.notes.map((note) => <li key={note}>· {note}</li>)}
                </ul>
              )}
            </GlassCard>

            {/* Waiting, without pressure */}
            {later.length > 0 && (
              <GlassCard>
                <SectionTitle title={copy.later.title} subtitle={copy.later.subtitle} />
                <ul className="space-y-3">
                  <AnimatePresence initial={false}>
                    {shownLater.map((task) => <SparkTaskItem key={task.id} task={task} variant="row" {...actions} />)}
                  </AnimatePresence>
                </ul>
                {later.length > LATER_PREVIEW && (
                  <div className="mt-3 flex justify-center">
                    <Button variant="ghost" size="sm" onClick={() => setShowAllLater((value) => !value)} aria-expanded={showAllLater}>
                      {showAllLater ? copy.later.hide : fill(copy.later.show, { n: later.length - LATER_PREVIEW })}
                    </Button>
                  </div>
                )}
              </GlassCard>
            )}
          </div>

          <aside className="min-w-0 space-y-5 lg:space-y-6">
            <GlassCard>
              <SectionTitle title={copy.focus.title} />
              <FocusTimer
                key={capacity?.sprintMin ?? "default"}
                suggested={capacity?.sprintMin}
                today={{ rounds: view?.stats.focusRoundsToday ?? 0, minutes: view?.stats.focusMinutesToday ?? 0 }}
                onComplete={(minutes) => void spark.logFocus(minutes, first?.id)}
              />
            </GlassCard>

            <GlassCard>
              <SectionTitle title={copy.how.title} subtitle={capacity ? copy.modeHint[capacity.mode] : undefined} />
              {capacity ? (
                <ul className="space-y-2.5 text-sm leading-snug text-ink-soft">
                  <li>{fill(copy.how.budget, { m: capacity.dailyBudgetMin, n: capacity.maxToday })}</li>
                  <li>{fill(copy.how.round, { n: capacity.sprintMin, b: capacity.breakMin })}</li>
                  {peak && <li>{fill(copy.how.peak, { a: peak.split("–")[0], b: peak.split("–")[1] })}</li>}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{view ? copy.degraded : ""}</p>
              )}
              {capacity?.confidence === "low" && (
                <div className="mt-4 space-y-2 rounded-xl bg-gold-100/60 p-3.5 text-[0.8125rem] leading-snug text-ink">
                  <p>{copy.how.lowConfidence}</p>
                  <Button asChild size="sm" variant="outline"><Link href="/dashboard/check-in">{copy.how.checkin}</Link></Button>
                </div>
              )}
              <p className="mt-4 text-xs leading-snug text-muted-foreground">{copy.how.privacy}</p>
            </GlassCard>

            <GlassCard>
              <SectionTitle title={copy.done.title} />
              {!view || view.doneToday.length === 0 ? (
                <p className="text-sm text-muted-foreground">{copy.done.none}</p>
              ) : (
                <ul className="space-y-2">
                  {view.doneToday.map((task) => (
                    <li key={task.id} className={cn("lm-inset flex items-center gap-3 px-3.5 py-2.5")}>
                      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground line-through">{task.title}</span>
                      <Button size="sm" variant="ghost" onClick={() => void spark.reopen(task.id)} disabled={spark.busy} aria-label={`${copy.done.undo}: ${task.title}`}>
                        <Undo2 aria-hidden /><span className="sr-only sm:not-sr-only">{copy.done.undo}</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          </aside>
        </div>
      )}
    </div>
  );
}
