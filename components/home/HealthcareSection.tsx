"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { ROUTES } from "@/lib/config/routes";
import { healthcareCopy } from "@/lib/i18n/healthcare";
import { REVEAL_VIEWPORT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowRight, Lock, ShieldAlert, Stethoscope } from "lucide-react";
import Link from "next/link";
import { HomeSection } from "./HomeSection";
import { SectionHeader } from "./SectionHeader";
import { DISPLAY_S } from "./typography";

/** One mark per pillar, in the order of `copy.pillars`: in charge, governed, escalated. */
const ICONS = [Stethoscope, Lock, ShieldAlert] as const;

/**
 * How healthcare professionals are involved: the professional decides, patient information is governed by consent, and
 * a serious case always reaches a human. The full trust pillars live on /trust.
 */
export const HealthcareSection = () => {
  const { language } = useLanguage();
  const copy = healthcareCopy[language];

  return (
    <HomeSection id="healthcare" labelledBy="healthcare-title" tone="tint">
      <SectionHeader variant="editorial" id="healthcare-title" layout="split" eyebrow={copy.eyebrow} titleA={copy.titleA} titleB={copy.titleB} intro={copy.intro} />

      <motion.ul variants={stagger(0.12, 0.1)} initial="hidden" whileInView="show" viewport={REVEAL_VIEWPORT} className="mt-12 grid grid-cols-1 gap-5 md:mt-16 md:grid-cols-3 lg:gap-6">
        {copy.pillars.map(([title, line], index) => {
          const Icon = ICONS[index];
          return (
            <motion.li key={index} variants={fadeUp(0, 20)} className="flex flex-col rounded-panel border border-line bg-white p-6 shadow-card sm:p-8">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                <Icon className="size-6" strokeWidth={1.75} aria-hidden />
              </span>
              <h3 className={cn(DISPLAY_S, "mt-6 text-ink")}>{title}</h3>
              <p className="mt-3 text-[0.9375rem] leading-[1.7] text-ink-soft">{line}</p>
            </motion.li>
          );
        })}
      </motion.ul>

      <Link href={ROUTES.trust} className="mt-8 inline-flex min-h-10 items-center gap-2 rounded-md text-[0.9375rem] font-semibold text-teal-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500">
        <span className="home-link-line">{copy.link}</span>
        <ArrowRight className="size-4 shrink-0 rtl:-scale-x-100" aria-hidden />
      </Link>
    </HomeSection>
  );
};
