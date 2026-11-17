"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { GoalList } from "@/components/patient/checkin/CheckinFlow";
import { LuminaLogo } from "@/components/patient/ui/LuminaLogo";
import { ErrorState, GlassCard, Skeleton } from "@/components/patient/ui/primitives";
import { Button } from "@/components/ui/button";
import { useTodayCheckin } from "@/hooks/patient/useCheckin";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { fill } from "@/lib/i18n/patient";

/** Home's right column: today's goals from the check-in. (The reading band sits under the overview — see `ReadsBand`.) */
export function HomeSidePanel() {
  return <GoalsPanel />;
}

function PanelHeader({ title, subtitle, badge }: { title: string; subtitle: string; badge?: string }) {
  return (
    <div className="flex items-center gap-3">
      <LuminaLogo size={44} presence />
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold leading-tight text-ink">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {badge && <span className="chip shrink-0"><Sparkles className="size-3" aria-hidden />{badge}</span>}
    </div>
  );
}

/** Today's goals: set during the check-in, resolved here with one tap as the day goes. */
function GoalsPanel() {
  const copy = usePatientCopy();
  const today = useTodayCheckin();
  const g = copy.home.goals;
  const goals = today.data?.goals ?? [];
  const resolved = goals.filter((goal) => goal.status !== "PENDING").length;

  return (
    <GlassCard as="aside" data-tour="goals" aria-label={g.title} className="flex flex-col gap-4">
      <PanelHeader title={g.title} subtitle={goals.length ? fill(g.progress, { a: resolved, b: goals.length }) : g.subtitle} />

      {today.error ? (
        <ErrorState onRetry={() => void today.refresh()} />
      ) : today.isLoading ? (
        <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
      ) : goals.length ? (
        <GoalList goals={goals} />
      ) : (
        <p className="lm-inset px-4 py-6 text-center text-sm leading-relaxed text-muted-foreground">
          {today.data ? g.noneToday : g.checkinFirst}
        </p>
      )}

      <Button asChild variant={goals.length ? "ghost" : "default"} size="lg" className="w-full">
        <Link href="/dashboard/check-in">
          {today.data ? (goals.length ? g.update : g.add) : g.start}
          <ArrowRight className="rtl:-scale-x-100" aria-hidden />
        </Link>
      </Button>
    </GlassCard>
  );
}

export function PanelSkeleton() {
  return (
    <GlassCard className="space-y-4">
      <Skeleton className="h-11 w-2/3" />
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </GlassCard>
  );
}
