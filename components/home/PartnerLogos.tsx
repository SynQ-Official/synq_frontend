"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "framer-motion";
import { Marquee } from "./Interactions";
import { LABEL } from "./typography";

const ITEM = "inline-flex items-center gap-2.5 whitespace-nowrap px-6 text-[0.9375rem]  text-ink-soft sm:px-9";

type PartnerLogosProps = {
  hidden?: boolean;
  backedLabel: string;
  backedNames: readonly string[];
};

/** Only the programmes SynQ has actually joined; vendor credit programmes are not partners and are not listed. */
export function PartnerLogos({ hidden, backedLabel, backedNames }: PartnerLogosProps) {
  return (
    <>
      <span aria-hidden={hidden} className={ITEM}>
        <span className="text-[0.6875rem] uppercase tracking-[0.16em] text-gold-700">{backedLabel}</span>
        <span className="h-5 w-px bg-line-strong" aria-hidden />
        <span>{backedNames.join("  ·  ")}</span>
      </span>
    </>
  );
}

/** The partners ticker, under the hero: the first copy is announced to readers, the repeats are hidden. */
export function PartnerStrip() {
  const { dictionary } = useLanguage();
  const home = dictionary.home;
  const reduce = useReducedMotion();
  return (
    <div role="group" aria-labelledby="partners-label" className="flex flex-col items-center gap-2.5 border-y border-line/80 bg-white/40 py-3.5 backdrop-blur-sm sm:flex-row sm:gap-0">
      <p id="partners-label" className={cn(LABEL, "shrink-0 px-4 text-ink-soft sm:ps-8 lg:ps-12")}>
        {home.partners}
      </p>
      <Marquee seconds={70} className="w-full min-w-0 flex-1">
        {Array.from({ length: reduce ? 1 : 8 }, (_, index) => (
          <PartnerLogos
            key={index}
            hidden={index > 0}
            backedLabel={home.partnerBackedLabel}
            backedNames={home.partnerBackedNames}
          />
        ))}
      </Marquee>
    </div>
  );
}
