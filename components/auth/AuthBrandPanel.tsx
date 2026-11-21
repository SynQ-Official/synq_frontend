"use client";

import { Grain } from "@/components/home/Atmosphere";
import { ACCENT_DARK, DISPLAY_L } from "@/components/home/typography";
import { useLanguage } from "@/contexts/LanguageContext";
import { familyCopy } from "@/lib/family/copy";
import { accessCopy } from "@/lib/i18n/access";

/** Who the page beside the panel is for: the panel speaks to them (patients, parents, or clinicians applying). */
export type AuthAudience = "patient" | "parent" | "clinic";
import { EASE_OUT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

/**
 * Desktop-only story column for /auth/*: one solid block of the logo's deep teal beside the form, white type, the
 * points as a ruled list and the quote closing it. It sits at its own height and stays in view while a long form
 * scrolls, instead of stretching to the form's height.
 */
export function AuthBrandPanel({ audience = "patient" }: { audience?: AuthAudience }) {
  const { dictionary, language } = useLanguage();
  const brand =
    audience === "clinic" ? accessCopy[language].clinic.brand : audience === "parent" ? familyCopy[language].auth.panel : dictionary.auth.brand;

  return (
    <motion.aside
      aria-labelledby="auth-brand-title"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE_OUT }}
      className="relative isolate hidden overflow-hidden rounded-[1.75rem] bg-teal-900 p-10 text-white shadow-[0_2px_4px_rgb(13_61_80/0.12),0_32px_64px_-36px_rgb(13_61_80/0.7)] lg:sticky lg:top-24 lg:flex lg:flex-col xl:p-14"
    >
      {/* A thin gold edge along the top is the only ornament. */}
      <span aria-hidden className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gold-300/60" />
      <Grain tone="deep" />

      <motion.div variants={stagger(0.07, 0.15)} initial="hidden" animate="show" className="flex flex-col">
        <motion.h2
          id="auth-brand-title"
          variants={fadeUp(0, 14)}
          className={cn(DISPLAY_L, "max-w-[13ch] text-balance text-[clamp(2.25rem,2.4vw+1.3rem,3.75rem)] leading-[1.04] text-white")}
        >
          {brand.titleA} <span className={ACCENT_DARK}>{brand.titleB}</span>
        </motion.h2>

        <motion.p variants={fadeUp(0, 12)} className="mt-6 max-w-[42ch] text-pretty text-[1.0625rem] leading-[1.7] text-teal-100">
          {brand.body}
        </motion.p>

        <motion.ul variants={fadeUp(0, 12)} className="mt-10 max-w-md border-t border-white/15">
          {brand.points.map((point) => (
            <li key={point} className="flex items-baseline gap-4 border-b border-white/15 py-4 text-base font-medium leading-6 text-white">
              <span aria-hidden className="size-1.5 shrink-0 translate-y-[-0.15em] rounded-full bg-gold-300" />
              {point}
            </li>
          ))}
        </motion.ul>

        <motion.figure variants={fadeUp(0, 12)} className="mt-12 max-w-sm">
          <blockquote className="text-pretty font-[family-name:var(--font-home-serif)] text-title font-light leading-[1.4] text-white rtl:font-sans rtl:text-base">
            {brand.quote}
          </blockquote>
        </motion.figure>
      </motion.div>
    </motion.aside>
  );
}
