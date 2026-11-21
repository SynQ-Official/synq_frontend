"use client";

import { HomeSection } from "@/components/home/HomeSection";
import { SectionHeader } from "@/components/home/SectionHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { tracksCopy } from "@/lib/i18n/tracks";
import { REVEAL_VIEWPORT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { TRACK_ORDER } from "./TracksExplorer";
import { TRACK_TONE } from "./TrackVisuals";

const GRID = "grid grid-cols-[minmax(0,1fr)_repeat(3,4.25rem)] items-center gap-x-1 sm:grid-cols-[minmax(0,1fr)_repeat(3,7rem)]";

/** What changes from one track to the next, in one table; the shared core is named once, in the intro. */
export function TracksMatrix() {
  const { language } = useLanguage();
  const { matrix } = tracksCopy[language];

  return (
    <HomeSection id="at-a-glance" labelledBy="matrix-title" tone="tint">
      <SectionHeader variant="editorial" id="matrix-title" layout="split" counter="02 / 02" eyebrow={matrix.eyebrow} titleA={matrix.titleA} titleB={matrix.titleB} intro={matrix.body} />

      <motion.div
        variants={stagger(0.07, 0.1)}
        initial="hidden"
        whileInView="show"
        viewport={REVEAL_VIEWPORT}
        role="table"
        aria-label={`${matrix.titleA} ${matrix.titleB}`}
        className="mt-12 overflow-hidden rounded-panel border border-line bg-white shadow-soft lg:mt-16"
      >
        <div role="row" className={cn(GRID, "border-b border-line bg-canvas/70 px-3 py-4 sm:px-6")}>
          <span aria-hidden />
          {matrix.columns.map((name, index) => (
            <span key={name} role="columnheader" className="flex flex-col items-center gap-1.5 text-center text-[0.6875rem]  leading-tight text-ink sm:text-[0.8125rem]">
              <span aria-hidden className={cn("size-2.5 rounded-full", TRACK_TONE[TRACK_ORDER[index]].dot)} />
              {name}
            </span>
          ))}
        </div>
        {matrix.rows.map((row) => (
          <motion.div key={row.label} role="row" variants={fadeUp(0, 10)} className={cn(GRID, "border-b border-line px-3 py-4 last:border-b-0 sm:px-6")}>
            <span role="rowheader" className="pe-3 text-[0.875rem] leading-snug text-ink-soft sm:text-[0.9375rem]">{row.label}</span>
            {row.values.map((on, index) => (
              <span key={index} role="cell" className="flex justify-center">
                <span className={cn("flex size-7 items-center justify-center rounded-full", on ? TRACK_TONE[TRACK_ORDER[index]].solid : "bg-canvas text-ink-subtle")}>
                  {on ? <Check className="size-4" strokeWidth={3} aria-hidden /> : <Minus className="size-3.5" aria-hidden />}
                  <span className="sr-only">{on ? matrix.yes : matrix.no}</span>
                </span>
              </span>
            ))}
          </motion.div>
        ))}
      </motion.div>
    </HomeSection>
  );
}
