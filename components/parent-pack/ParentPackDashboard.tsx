"use client";

import Link from "next/link";
import { ArrowRight, BedDouble, BookHeart, BookOpenCheck, CheckCircle2, HeartHandshake, LifeBuoy, NotebookPen, Users, type LucideIcon } from "lucide-react";
import { PARENT_PACK_BASE } from "@/components/parent-pack/ParentPackShell";
import { ErrorState, GlassCard, PageIntro, Skeleton } from "@/components/patient/ui/primitives";
import { Button } from "@/components/ui/button";
import { useParentOverview } from "@/hooks/parent-pack/useParentPack";
import { presetById } from "@/lib/parent-pack/room";
import type { Condition, ParentOverview } from "@/lib/parent-pack/types";

const CONDITION_LABEL: Record<Condition, string> = { ADHD: "ADHD", BIPOLAR: "bipolar disorder", PSYCHOSIS: "psychosis" };

function Pillar({ href, icon: Icon, title, status, tone = "teal" }: { href: string; icon: LucideIcon; title: string; status: string; tone?: "teal" | "rose" | "gold" }) {
  const toneClass = { teal: "stat-tile-sage", rose: "stat-tile-rose", gold: "stat-tile-gold" }[tone];
  return (
    <li>
      <Link href={href} className="group flex items-center gap-4 rounded-2xl px-3 py-3.5 transition-colors hover:bg-teal-50/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500">
        <span className={`stat-tile ${toneClass}`}><Icon className="size-5" aria-hidden /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.9375rem]  text-ink">{title}</span>
          <span className="block truncate text-[0.8125rem] text-muted-foreground">{status}</span>
        </span>
        <ArrowRight className="size-4 shrink-0 text-ink-subtle transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100" aria-hidden />
      </Link>
    </li>
  );
}

function statuses(o: ParentOverview) {
  return {
    journal: o.todayCheckin ? "Today's observation is recorded" : `${o.last7Days.checkins} observation${o.last7Days.checkins === 1 ? "" : "s"} and ${o.last7Days.journalEntries} note${o.last7Days.journalEntries === 1 ? "" : "s"} this week`,
    safety: !o.safetyPlan.exists ? "Not prepared yet: set it up with the care team" : o.safetyPlan.hasEmergencyNumber ? `${o.safetyPlan.contacts} contact${o.safetyPlan.contacts === 1 ? "" : "s"} saved, emergency number set` : "Add your local emergency number",
    room: o.room ? `Saved layout${o.room.presetId ? `: ${presetById(o.room.presetId)?.name ?? ""}` : ""}` : "Try a layout in 3D",
    wellbeing: o.lastWellbeing ? `Last check-in ${new Date(o.lastWellbeing.date).toLocaleDateString()}: stress ${o.lastWellbeing.stress}/10` : "How are you doing today?",
    guidance: o.condition ? `Resources for ${CONDITION_LABEL[o.condition]} first` : "Resources for ADHD, bipolar disorder and psychosis",
  };
}

/** The Parent Pack home: where each pillar stands today and the next useful step, never a score. */
export function ParentPackDashboard() {
  const overview = useParentOverview();

  return (
    <>
      <PageIntro
        eyebrow="Parent Pack"
        icon={Users}
        title="Supporting your family, day by day"
        subtitle="Guidance, a calmer bedroom, daily observations to share with the care team, a safety plan, and support for you."
      />

      {overview.error && !overview.data ? (
        <ErrorState onRetry={() => void overview.refresh()} />
      ) : !overview.data ? (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]" aria-busy>
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      ) : (
        <Dashboard overview={overview.data} />
      )}
    </>
  );
}

function Dashboard({ overview }: { overview: ParentOverview }) {
  const s = statuses(overview);
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <GlassCard className="flex flex-col justify-between gap-5 p-6">
        <div>
          <p className="lm-eyebrow">Today</p>
          {overview.todayCheckin ? (
            <p className="mt-2 flex items-center gap-2 text-lg  text-ink"><CheckCircle2 className="size-5 text-teal-600" aria-hidden />Today&apos;s observation is saved</p>
          ) : (
            <p className="mt-2 text-lg  text-ink">A one-minute observation helps you remember the day for the next appointment.</p>
          )}
          <p className="mt-1.5 text-sm text-muted-foreground">
            The same daily check-in as your child&apos;s own, from your point of view. It stays separate from what your child records.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="lg"><Link href={`${PARENT_PACK_BASE}/journal`}>{overview.todayCheckin ? "Open the Family Journal" : "Record today"}</Link></Button>
          <Button asChild size="lg" variant="outline"><Link href={`${PARENT_PACK_BASE}/journal#report`}>Prepare a report</Link></Button>
        </div>
      </GlassCard>

      <section aria-labelledby="pp-pillars" className="lm-glass lm-card p-3">
        <h2 id="pp-pillars" className="sr-only">Parent Pack sections</h2>
        <ul className="divide-y divide-line/70">
          <Pillar href={`${PARENT_PACK_BASE}/safety`} icon={LifeBuoy} title="Crisis & Safety Plan" status={s.safety} tone={overview.safetyPlan.exists && overview.safetyPlan.hasEmergencyNumber ? "teal" : "rose"} />
          <Pillar href={`${PARENT_PACK_BASE}/journal`} icon={NotebookPen} title="Family Clinical Journal" status={s.journal} />
          <Pillar href={`${PARENT_PACK_BASE}/guidance`} icon={BookOpenCheck} title="Parent Guidance" status={s.guidance} />
          <Pillar href={`${PARENT_PACK_BASE}/room`} icon={BedDouble} title="3D Room Planner" status={s.room} />
          <Pillar href={`${PARENT_PACK_BASE}/wellbeing`} icon={HeartHandshake} title="Parent Wellbeing" status={s.wellbeing} tone="gold" />
          <Pillar href={`${PARENT_PACK_BASE}/library`} icon={BookHeart} title="Smart Library" status="Calming sounds and reading from SynQ" />
        </ul>
      </section>
    </div>
  );
}
