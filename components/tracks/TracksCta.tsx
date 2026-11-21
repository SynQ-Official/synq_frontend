"use client";

import { PillLink } from "@/components/agents/shared";
import { Magnetic, WordReveal } from "@/components/home/AnimationUtilities";
import { Grain } from "@/components/home/Atmosphere";
import { CURTAIN } from "@/components/home/HomeSection";
import { SERIF } from "@/components/home/typography";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuthSession } from "@/hooks/useAuthSession";
import { agentEntryHref } from "@/lib/config/routes";
import { tracksCopy } from "@/lib/i18n/tracks";
import { REVEAL_VIEWPORT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

/** Last word: if the track is not clear yet, Mira is where to begin. */
export function TracksCta() {
  const { language } = useLanguage();
  const { cta } = tracksCopy[language];
  const { signedIn } = useAuthSession();

  return (
    <section id="start" aria-labelledby="tracks-start-title" className={cn("relative isolate overflow-hidden bg-deep pb-24 pt-28 text-white md:pb-32 md:pt-40", CURTAIN)}>
      <Grain />
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
      <div className="page-container">
        <motion.div variants={stagger(0.09, 0.05)} initial="hidden" whileInView="show" viewport={REVEAL_VIEWPORT} className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <h2 id="tracks-start-title" className={cn(SERIF, "mt-8 text-[clamp(3rem,6.6vw+0.5rem,7rem)] font-light leading-[0.98] tracking-[-0.04em] text-white rtl:tracking-normal")}>
            <span className="block">
              <WordReveal>{cta.titleA}</WordReveal>
            </span>
            <span className="block">
              <WordReveal className=" text-white" delay={0.15}>
                {cta.titleB}
              </WordReveal>
            </span>
          </h2>
          <motion.p variants={fadeUp()} className="mt-7 max-w-md text-[clamp(1.0625rem,0.3vw+1rem,1.25rem)] leading-[1.75] text-teal-100">
            {cta.body}
          </motion.p>
          <motion.div variants={fadeUp(0, 18)} className="mt-10">
            <Magnetic strength={0.12}>
              <PillLink href={agentEntryHref("mira", signedIn)} tone="white">
                {cta.primary}
              </PillLink>
            </Magnetic>
          </motion.div>
          <motion.p variants={fadeUp(0, 10)} className="mt-12 flex items-center gap-2.5 text-[0.9375rem] text-white/90">
            <ShieldCheck className="size-4 text-gold-300" aria-hidden />
            {cta.note}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
