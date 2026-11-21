"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AmbiencesCard } from "@/components/patient/home/AmbiencesCard";
import { OverviewSection } from "@/components/patient/home/OverviewSection";
import { CheckinScheduleCard } from "@/components/patient/home/CheckinScheduleCard";
import { DayWelcome } from "@/components/patient/home/DayWelcome";
import { ReadsBand } from "@/components/patient/home/ReadsBand";
import { PlanCard, ProgressStrip, SignalsCard, TrendCard, WellbeingCard } from "@/components/patient/home/HomeCards";
import { RecommendedExercises } from "@/components/patient/home/RecommendedExercises";
import { TourReplayButton } from "@/components/patient/tour/TourProvider";
import { SparkCard } from "@/components/patient/home/SparkCard";
import { CareTeamInvitationBanner, SharingReconfirmBanner } from "@/components/patient/consent/SharingReconfirm";
import { HomeSidePanel } from "@/components/patient/home/HomePanels";
import { useAmbiences } from "@/hooks/patient/useAmbiences";
import { usePatient } from "@/hooks/patient/usePatient";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { useCalmTrack } from "@/hooks/useCalmTrack";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** One grid cell that settles into place a beat after the one before it (still, under reduced motion). */
function Cell({ index, className, children }: { index: number; className: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  const calm = useCalmTrack();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : calm ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.15 + index * 0.06 }}
    >
      {children}
    </motion.div>
  );
}

/** Spark's full-width row, for ADHD patients (the rest of the grid keeps its own positions). */
function SparkSlot() {
  const { profile } = usePatient();
  if (profile.track !== "ADHD") return null;
  return <div className="mb-5 lg:mb-6"><SparkCard /></div>;
}

/**
 * Home, in three titled bands under the day's welcome: today (wellbeing and goals), this week (trend, signals, progress)
 * and support (the plan, comfort sounds, reading and recommended exercises). Each band is a 12-column row, so the cards
 * line up from one band to the next. Every card loads on its own, so the page fills in progressively.
 */
export default function HomePage() {
  const copy = usePatientCopy().home.sections;
  // The sounds card sits beside the plan; when the server has no sounds for this patient the plan takes the full row.
  const { available: sounds } = useAmbiences();

  return (
    <div>
      <CareTeamInvitationBanner />
      <SharingReconfirmBanner />
      <DayWelcome />
      {/* First visit: choose the check-in time; afterwards, one line with the time and today's status. */}
      <CheckinScheduleCard />
      {/* ADHD only: the card renders nothing for every other track. */}
      <SparkSlot />

      <OverviewSection id="overview-today" eyebrow={copy.today.eyebrow} title={copy.today.title}>
        <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
          <Cell index={0} className="min-w-0 lg:col-span-7"><WellbeingCard /></Cell>
          <Cell index={1} className="min-w-0 lg:col-span-5"><HomeSidePanel /></Cell>
        </div>
      </OverviewSection>

      <OverviewSection id="overview-week" eyebrow={copy.week.eyebrow} title={copy.week.title}>
        <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
          <Cell index={2} className="min-w-0 lg:col-span-7"><TrendCard /></Cell>
          <Cell index={3} className="min-w-0 lg:col-span-5"><SignalsCard /></Cell>
          <Cell index={4} className="min-w-0 lg:col-span-12"><ProgressStrip /></Cell>
        </div>
      </OverviewSection>

      <OverviewSection id="overview-support" eyebrow={copy.support.eyebrow} title={copy.support.title}>
        <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
          <Cell index={5} className={cn("min-w-0", sounds ? "lg:col-span-7" : "lg:col-span-12")}><PlanCard /></Cell>
          {/* Renders nothing until the server has sounds for this patient (psychosis: after the clinician's switch). */}
          {sounds ? <Cell index={6} className="min-w-0 lg:col-span-5"><AmbiencesCard /></Cell> : null}
        </div>

        {/* Reading follows the patient's own day, for the tracks that have a library. */}
        <ReadsBand />

        {/* Full width: the featured practice and the ranked list need room to read as one section. */}
        <div className="mt-5 lg:mt-6"><Cell index={7} className="min-w-0"><RecommendedExercises /></Cell></div>
      </OverviewSection>

      {/* Small screens have no rail, so the way back into the tour sits here. */}
      <div className="mt-8 flex justify-center lg:hidden">
        <TourReplayButton className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500" />
      </div>
    </div>
  );
}
