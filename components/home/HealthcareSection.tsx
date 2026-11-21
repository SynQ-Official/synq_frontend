"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { ROUTES } from "@/lib/config/routes";
import { healthcareCopy } from "@/lib/i18n/healthcare";
import { REVEAL_VIEWPORT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowRight, Lock, ShieldAlert, Stethoscope } from "lucide-react";
import { LocaleLink as Link } from "@/components/shared/LocaleLink";
import { HomeSection } from "./HomeSection";
import { SectionHeader } from "./SectionHeader";
import { DISPLAY_S } from "./typography";

/** One mark per pillar, in the order of `copy.pillars`: in charge, governed, escalated. */
const ICONS = [Stethoscope, Lock, ShieldAlert] as const;

/**
 * How healthcare professionals are involved: the professional decides, patient information is governed by consent, and
 * a serious case always reaches a human. The full trust pillars live on /privacy.
 */
export const HealthcareSection = () => {
  const { language } = useLanguage();
  const copy = healthcareCopy[language];

  return (
    <HomeSection id="healthcare" labelledBy="healthcare-title" tone="tint">
      <SectionHeader variant="editorial" id="healthcare-title" layout="split" eyebrow={copy.eyebrow} titleA={copy.titleA} titleB={copy.titleB} intro={copy.intro} />

      <motion.ul variants={stagger(0.12, 0.1)} initial="hidden" whileInView="show" viewport={REVEAL_VIEWPORT} className="mt-12 grid grid-cols-1 gap-10 md:mt-16 md:grid-cols-3 md:gap-8 lg:gap-12">
        {copy.pillars.map(([title, line], index) => {
          const Icon = ICONS[index];
          return (
            <motion.li key={index} variants={fadeUp(0, 20)} className="flex flex-col border-t-2 border-teal-900 pt-6">
              <Icon className="size-5 text-teal-700" strokeWidth={1.75} aria-hidden />
              <h3 className={cn(DISPLAY_S, "mt-5 text-balance text-ink")}>{title}</h3>
              <p className="mt-3 max-w-[38ch] text-pretty text-[1rem] leading-[1.7] text-ink-soft">{line}</p>
            </motion.li>
          );
        })}
      </motion.ul>

      <Link href={ROUTES.privacy} className="mt-8 inline-flex min-h-10 items-center gap-2 rounded-md text-[0.9375rem]  text-teal-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500">
        <span className="home-link-line">{copy.link}</span>
        <ArrowRight className="size-4 shrink-0 rtl:-scale-x-100" aria-hidden />
      </Link>
    </HomeSection>
  );
};
