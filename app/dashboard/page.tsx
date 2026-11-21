"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AmbiencesCard } from "@/components/patient/home/AmbiencesCard";
import { CheckinScheduleCard } from "@/components/patient/home/CheckinScheduleCard";
import { DayWelcome } from "@/components/patient/home/DayWelcome";
import { ReadsBand } from "@/components/patient/home/ReadsBand";
import { PlanCard, ProgressStrip, SignalsCard, TrendCard, WellbeingCard } from "@/components/patient/home/HomeCards";
import { RecommendedExercises } from "@/components/patient/home/RecommendedExercises";
import { TourReplayButton } from "@/components/patient/tour/TourProvider";
import { SparkCard } from "@/components/patient/home/SparkCard";
import { CareTeamInvitationBanner, SharingReconfirmBanner } from "@/components/patient/consent/SharingReconfirm";
import { HomeSidePanel } from "@/components/patient/home/HomePanels";
import { usePatient } from "@/hooks/patient/usePatient";
import { useCalmTrack } from "@/hooks/useCalmTrack";
import { EASE_OUT } from "@/lib/motion";

/** One card that settles into place a beat after the one before it (still, under reduced motion). */
function Cell({ index, children }: { index: number; children: ReactNode }) {
  const reduce = useReducedMotion();
  const calm = useCalmTrack();
  return (
    <motion.div
      className="min-w-0"
      initial={reduce ? false : calm ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.1 + index * 0.05 }}
    >
      {children}
    </motion.div>
  );
}

/** Spark heads the main column for ADHD patients (nothing for every other track). */
function SparkSlot() {
  const { profile } = usePatient();
  if (profile.track !== "ADHD") return null;
  return <Cell index={0}><SparkCard /></Cell>;
}

/**
 * Home as one dashboard under the day's welcome: a main column for the day and the week (wellbeing, trend, consistency)
 * and a side column for what to do (goals, signals, the plan, comfort sounds). The two columns stack independently, so
 * no card is stretched to match its neighbour. Reading and the exercise library follow, full width. Every card loads on
 * its own, so the page fills in progressively.
 */
export default function HomePage() {
  return (
    <div>
      <CareTeamInvitationBanner />
      <SharingReconfirmBanner />
      <DayWelcome />
      {/* First visit: choose the check-in time; afterwards, one line with the time and today's status. */}
      <CheckinScheduleCard />

      <div className="grid items-start gap-5 lg:grid-cols-12 lg:gap-6">
        <div className="grid min-w-0 gap-5 lg:col-span-8 lg:gap-6">
          <SparkSlot />
          <Cell index={0}><WellbeingCard /></Cell>
          <Cell index={2}><TrendCard /></Cell>
          <Cell index={4}><ProgressStrip /></Cell>
        </div>
        <div className="grid min-w-0 gap-5 lg:col-span-4 lg:gap-6">
          <Cell index={1}><HomeSidePanel /></Cell>
          <Cell index={3}><SignalsCard /></Cell>
          <Cell index={5}><PlanCard /></Cell>
          {/* Renders nothing until the server has sounds for this patient (psychosis: after the clinician's switch). */}
          <Cell index={6}><AmbiencesCard /></Cell>
        </div>
      </div>

      {/* Reading follows the patient's own day, for the tracks that have a library. */}
      <ReadsBand />

      <div className="mt-5 lg:mt-6"><Cell index={7}><RecommendedExercises /></Cell></div>

      {/* Small screens have no rail, so the way back into the tour sits here. */}
      <div className="mt-8 flex justify-center lg:hidden">
        <TourReplayButton className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500" />
      </div>
    </div>
  );
}
