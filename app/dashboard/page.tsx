"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckinScheduleCard } from "@/components/patient/home/CheckinScheduleCard";
import { DayWelcome } from "@/components/patient/home/DayWelcome";
import { ReadsBand } from "@/components/patient/home/ReadsBand";
import { PlanCard, ProgressStrip, SignalsCard, TrendCard, WellbeingCard } from "@/components/patient/home/HomeCards";
import { RecommendedExercises } from "@/components/patient/home/RecommendedExercises";
import { TourReplayButton } from "@/components/patient/tour/TourProvider";
import { SparkCard } from "@/components/patient/home/SparkCard";
import { SharingReconfirmBanner } from "@/components/patient/consent/SharingReconfirm";
import { HomeSidePanel } from "@/components/patient/home/HomePanels";
import { usePatient } from "@/hooks/patient/usePatient";
import { useCalmTrack } from "@/hooks/useCalmTrack";
import { EASE_OUT } from "@/lib/motion";

/** One grid cell that settles into place a beat after the one before it (still, under reduced motion). */
function Cell({ index, className, children }: { index: number; className: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  const calm = useCalmTrack();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : calm ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.5 + index * 0.07 }}
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
 * Home. The day's welcome first (greeting, three numbers that count up), then a calm structured overview:
 * today's wellbeing, the trend and signals, a small plan and — beside them — today's goals. Then, for the tracks
 * that have one, a warm band of reading, and the exercises recommended for the patient's track.
 * Every card loads on its own, so the page fills in progressively.
 */
export default function HomePage() {
  return (
    <div>
      <SharingReconfirmBanner />
      <DayWelcome />
      {/* First visit: choose the check-in time; afterwards, one line with the time and today's status. */}
      <CheckinScheduleCard />
      {/* ADHD only: the card renders nothing for every other track. */}
      <SparkSlot />

      {/* Two columns from tablet; the goals panel joins as a third column only where there is real room (2xl). */}
      <div className="grid gap-5 md:grid-cols-2 lg:gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(21rem,25rem)] 2xl:items-start">
        <Cell index={0} className="order-1 min-w-0 md:col-span-2 2xl:order-none 2xl:col-span-1 2xl:col-start-1 2xl:row-start-1"><WellbeingCard /></Cell>
        <Cell index={1} className="order-2 min-w-0 md:col-span-2 2xl:order-none 2xl:col-span-1 2xl:col-start-3 2xl:row-span-3 2xl:row-start-1 2xl:sticky 2xl:top-4"><HomeSidePanel /></Cell>
        <Cell index={2} className="order-3 min-w-0 2xl:order-none 2xl:col-span-1 2xl:col-start-2 2xl:row-start-1"><TrendCard /></Cell>
        <Cell index={3} className="order-4 min-w-0 2xl:order-none 2xl:col-start-1 2xl:row-start-2"><PlanCard /></Cell>
        <Cell index={4} className="order-5 min-w-0 2xl:order-none 2xl:col-start-2 2xl:row-start-2"><SignalsCard /></Cell>
        <Cell index={5} className="order-6 min-w-0 md:col-span-2 2xl:order-none 2xl:col-span-2 2xl:col-start-1 2xl:row-start-3"><ProgressStrip /></Cell>
      </div>

      {/* The patient's own day comes first; reading follows it, for the tracks that have a library. */}
      <ReadsBand />

      {/* Full width: the featured practice and the ranked list need room to read as one section. */}
      <div className="mt-5 lg:mt-6"><Cell index={6} className="min-w-0"><RecommendedExercises /></Cell></div>

      {/* Small screens have no rail, so the way back into the tour sits here. */}
      <div className="mt-6 flex justify-center lg:hidden">
        <TourReplayButton className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500" />
      </div>
    </div>
  );
}
