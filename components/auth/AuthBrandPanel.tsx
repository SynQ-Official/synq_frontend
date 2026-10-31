"use client";

import { Grain, Swash } from "@/components/home/Atmosphere";
import { ACCENT_LIGHT, DISPLAY_L, LABEL } from "@/components/home/typography";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { BrainCircuit, HeartHandshake, Quote, ShieldCheck } from "lucide-react";

const POINT_ICONS = [BrainCircuit, ShieldCheck, HeartHandshake] as const;

/**
 * Desktop-only storytelling column for /auth/*: frosted glass lit like the home hero (teal mist into champagne, fine
 * grain), the accent phrase underlined by the hero's gold stroke, the points as a calm list, the quote closing the panel.
 */
export function AuthBrandPanel() {
  const { dictionary } = useLanguage();
  const brand = dictionary.auth.brand;

  return (
    <motion.aside
      aria-labelledby="auth-brand-title"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: EASE_OUT }}
      className="relative isolate hidden min-h-[min(36rem,calc(100dvh-16rem))] flex-col overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/65 p-10 text-ink shadow-[inset_0_1px_0_#fff,0_30px_60px_-34px_rgb(17_76_97/0.3)] backdrop-blur-xl lg:flex xl:p-14 2xl:p-16"
    >
      {/* The hero's light: teal mist from the top corner, champagne from the bottom; teal into gold along the edge */}
      <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_55%_at_0%_0%,rgb(191_221_225/0.6),transparent_70%),radial-gradient(65%_55%_at_100%_100%,rgb(230_213_170/0.5),transparent_72%)]" />
      <Grain tone="light" />
      <span aria-hidden className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-teal-300 via-gold to-gold-100" />

      <motion.div variants={stagger(0.08, 0.2)} initial="hidden" animate="show" className="flex flex-1 flex-col">
        <motion.p variants={fadeUp(0, 10)} className={cn(LABEL, "inline-flex items-center gap-3 text-teal-700")}>
          <span aria-hidden className="h-px w-8 bg-gold" />
          {brand.eyebrow}
        </motion.p>

        <motion.h2 id="auth-brand-title" variants={fadeUp(0, 14)} className={cn(DISPLAY_L, "mt-7 max-w-[14ch] text-[clamp(2.25rem,2.4vw+1.3rem,3.75rem)] text-ink")}>
          {brand.titleA}{" "}
          <span className="relative inline-block">
            <span className={ACCENT_LIGHT}>{brand.titleB}</span>
            <Swash delay={1.1} />
          </span>
        </motion.h2>

        <motion.p variants={fadeUp(0, 12)} className="mt-6 max-w-md text-[1.0625rem] leading-8 text-ink-soft 2xl:max-w-lg">
          {brand.body}
        </motion.p>

        <motion.ul variants={fadeUp(0, 12)} className="mt-9 max-w-md 2xl:max-w-lg divide-y divide-line overflow-hidden rounded-2xl border border-white/80 bg-white/60 backdrop-blur-sm">
          {brand.points.map((point, index) => {
            const Icon = POINT_ICONS[index % POINT_ICONS.length];
            return (
              <li key={point} className="flex items-center gap-4 px-4 py-3.5 text-[0.9375rem] font-medium text-ink">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-teal-200 bg-white text-teal-700">
                  <Icon className="size-[1.0625rem]" strokeWidth={1.5} aria-hidden />
                </span>
                {point}
              </li>
            );
          })}
        </motion.ul>

        <motion.figure variants={fadeUp(0, 12)} className="mt-auto max-w-sm pt-10">
          <Quote className="size-5 text-gold-600 rtl:-scale-x-100" aria-hidden />
          <blockquote className="mt-3 border-s border-gold ps-4 text-[0.9375rem] leading-7 text-ink-soft">{brand.quote}</blockquote>
        </motion.figure>
      </motion.div>
    </motion.aside>
  );
}
