"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
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
        <span className="text-[0.8125rem] text-gold-700">{backedLabel}</span>
        <span className="h-5 w-px bg-line-strong" aria-hidden />
        <span>{backedNames.join("  ·  ")}</span>
      </span>
    </>
  );
}

/** The programmes line under the hero: one static line (no ticker), read once by screen readers and crawlers. */
export function PartnerStrip() {
  const { dictionary } = useLanguage();
  const home = dictionary.home;
  return (
    <div role="group" aria-labelledby="partners-label" className="flex flex-col items-center gap-2.5 border-y border-line/80 bg-white/40 py-3.5 backdrop-blur-sm sm:flex-row sm:gap-0">
      <p id="partners-label" className={cn(LABEL, "shrink-0 px-4 text-ink-soft sm:ps-8 lg:ps-12")}>
        {home.partners}
      </p>
      {/* The layout the ticker already used under reduced motion. */}
      <div className="flex w-full min-w-0 flex-1 flex-wrap justify-center gap-3">
        <PartnerLogos backedLabel={home.partnerBackedLabel} backedNames={home.partnerBackedNames} />
      </div>
    </div>
  );
}
