"use client";

import { WordReveal } from "@/components/home/AnimationUtilities";
import { Grain } from "@/components/home/Atmosphere";
import { ACCENT_LIGHT, BODY, DISPLAY_XL } from "@/components/home/typography";
import { useLanguage } from "@/contexts/LanguageContext";
import { tracksCopy } from "@/lib/i18n/tracks";
import { EASE_OUT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { SELECT_TRACK_EVENT, TRACK_ORDER } from "./TracksExplorer";
import { TRACK_TONE } from "./TrackVisuals";

/** Where each circle of the trio sits (percent of the stage), its fill and how far it drifts. */
const CIRCLES = [
  { pos: "start-[6%] top-[4%]", fill: "bg-[radial-gradient(closest-side,rgb(134_186_188/0.75),rgb(134_186_188/0.25))]", drift: 10 },
  { pos: "end-[6%] top-[4%]", fill: "bg-[radial-gradient(closest-side,rgb(230_213_170/0.95),rgb(230_213_170/0.35))]", drift: -10 },
  { pos: "start-1/2 bottom-[2%] -translate-x-1/2 rtl:translate-x-1/2", fill: "bg-[radial-gradient(closest-side,rgb(127_176_174/0.7),rgb(127_176_174/0.22))]", drift: -8 },
] as const;

/** The opening: a short promise, and three overlapping circles around one shared core — each opens its track below. */
export function TracksHero() {
  const { language } = useLanguage();
  const { hero, explorer } = tracksCopy[language];
  const reduce = useReducedMotion();

  const open = (id: string) => window.dispatchEvent(new CustomEvent(SELECT_TRACK_EVENT, { detail: id }));

  return (
    <section
      aria-labelledby="tracks-title"
      className="relative isolate overflow-hidden bg-[radial-gradient(60%_44rem_at_0%_6%,rgb(191_221_225/0.65),transparent_70%),radial-gradient(48%_36rem_at_100%_22%,rgb(230_213_170/0.36),transparent_70%),linear-gradient(180deg,#ffffff_0%,var(--color-canvas)_100%)] pb-28 pt-10 sm:pt-14 lg:pb-36 lg:pt-20"
    >
      <Grain tone="light" />
      <div className="page-container grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
        <motion.div variants={stagger(0.09, 0.05)} initial="hidden" animate="show" className="lg:col-span-6">
          <h1 id="tracks-title" className={cn(DISPLAY_XL, "mt-7 text-[clamp(2.5rem,3.6vw+0.75rem,4.75rem)] text-ink")}>
            <span className="block">
              <WordReveal>{hero.titleA}</WordReveal>
            </span>
            <span className="block">
              <WordReveal className={ACCENT_LIGHT} delay={0.15}>
                {hero.titleB}
              </WordReveal>
            </span>
          </h1>
          <motion.p variants={fadeUp()} className={cn(BODY, "mt-7 max-w-lg")}>
            {hero.body}
          </motion.p>
          <motion.a
            variants={fadeUp(0, 14)}
            href="#explorer"
            className="group mt-10 inline-flex min-h-12 items-center gap-3 rounded-full border border-line-strong bg-white/80 py-1.5 ps-6 pe-1.5 text-[0.9375rem]  text-ink backdrop-blur transition-colors duration-300 hover:border-teal-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
          >
            {hero.scroll}
            <span className="flex size-9 items-center justify-center rounded-full bg-ink text-white transition-colors duration-300 group-hover:bg-teal-800">
              <ArrowDown className="size-4" aria-hidden />
            </span>
          </motion.a>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: EASE_OUT, delay: 0.3 }}
          className="relative mx-auto aspect-square w-full max-w-[26rem] lg:col-span-6 lg:max-w-[32rem]"
        >
          {CIRCLES.map((circle, index) => (
            <motion.span
              key={index}
              aria-hidden
              className={cn("absolute size-[62%] rounded-full mix-blend-multiply", circle.pos, circle.fill)}
              animate={reduce ? undefined : { y: [0, circle.drift, 0] }}
              transition={{ duration: 9 + index * 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
          <span aria-hidden className="absolute start-1/2 top-[46%] size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink shadow-[0_0_0_8px_rgb(255_255_255/0.6)] rtl:translate-x-1/2" />
          {TRACK_ORDER.map((id, index) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(event) => {
                event.preventDefault();
                open(id);
              }}
              className={cn(
                "absolute z-10 inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/80 bg-white/90 px-3.5 py-2 text-[0.8125rem]  text-ink shadow-float backdrop-blur-md transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500",
                index === 0 && "start-[2%] top-[22%]",
                index === 1 && "end-[2%] top-[22%]",
                index === 2 && "start-1/2 bottom-[10%] -translate-x-1/2 rtl:translate-x-1/2",
              )}
            >
              <span className={cn("size-2 rounded-full", TRACK_TONE[id].dot)} aria-hidden />
              {explorer.tracks[id].tab}
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
