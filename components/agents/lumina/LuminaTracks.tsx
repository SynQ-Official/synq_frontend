"use client";

import { HomeSection } from "@/components/home/HomeSection";
import { Spotlight } from "@/components/home/Interactions";
import { SectionHeader } from "@/components/home/SectionHeader";
import { BODY_SM, DISPLAY_S, LABEL } from "@/components/home/typography";
import { EASE_OUT, REVEAL_VIEWPORT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { LuminaTracksCopy } from "@/lib/i18n/agents";
import { motion, useReducedMotion } from "framer-motion";
import { BellRing, BookOpenText, Check, Lightbulb, Moon, Sparkles, Wind } from "lucide-react";
import { useAgentPage } from "../shared";
import { LuminaMoodCard } from "./LuminaMoodCard";

const CARD_ICONS = [Sparkles, BookOpenText] as const;
const LIBRARY_ICONS = [BookOpenText, Wind, Moon] as const;

/** One surface per card, in the brand's two accents: aqua for the first, champagne for the second. */
const CARD_TONES = [
  { surface: "bg-[linear-gradient(155deg,var(--color-teal-100),#ffffff_94%)] border-teal-200 hover:border-teal-400", label: "text-teal-700", icon: "bg-white text-teal-700", check: "text-teal-700", spot: "teal" },
  { surface: "bg-[linear-gradient(155deg,var(--color-gold-50),#f6eed8_96%)] border-gold-100 hover:border-gold", label: "text-gold-700", icon: "bg-white text-gold-700", check: "text-gold-700", spot: "gold" },
] as const;

const rowIn = (delay: number) => ({ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT, delay } } });

/** The ADHD card's picture: a day with three tasks; one is ticked, one opens into small steps. */
function SparkPreview({ demo }: { demo: LuminaTracksCopy["demo"]["spark"] }) {
  const reduce = useReducedMotion();
  return (
    <motion.div variants={stagger(0.12, 0.25)} initial="hidden" whileInView="show" viewport={REVEAL_VIEWPORT} aria-hidden className="rounded-2xl bg-white/80 p-4 ring-1 ring-white">
      <p className="flex items-center gap-2 text-[0.75rem]  text-teal-700">
        <Sparkles className="size-3.5" strokeWidth={2} />
        {demo.heading}
      </p>
      <ul className="mt-3 space-y-2">
        <motion.li variants={rowIn(0)} className="flex items-center gap-3 text-[0.875rem] text-ink-muted">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-600">
            <svg viewBox="0 0 16 16" className="size-3 text-white">
              <motion.path
                d="M3.5 8.5 6.5 11.5 12.5 4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reduce ? false : { pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.9, ease: EASE_OUT }}
              />
            </svg>
          </span>
          <span className="line-through decoration-teal-400">{demo.tasks[0]}</span>
        </motion.li>

        <motion.li variants={rowIn(0)}>
          <p className="flex items-center gap-3 text-[0.875rem] font-medium text-ink">
            <span className="size-5 shrink-0 rounded-full border-2 border-teal-500" />
            {demo.tasks[1]}
          </p>
          <motion.ol variants={stagger(0.18, 0.7)} className="ms-8 mt-2 space-y-1.5 border-s border-dashed border-teal-300 ps-4">
            {demo.steps.map((step) => (
              <motion.li key={step} variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } } }} className="text-[0.8125rem] text-ink-soft">
                {step}
              </motion.li>
            ))}
          </motion.ol>
        </motion.li>

        <motion.li variants={rowIn(0)} className="flex items-center gap-3 text-[0.875rem] text-ink-soft">
          <span className="size-5 shrink-0 rounded-full border-2 border-line-strong" />
          {demo.tasks[2]}
        </motion.li>
      </ul>

      <motion.p variants={rowIn(0)} className="mt-3 flex items-center gap-2.5 rounded-xl bg-teal-50 px-3 py-2 text-[0.8125rem] font-medium text-teal-800">
        <BellRing className="size-4 shrink-0 text-teal-700" strokeWidth={1.75} />
        {demo.reminder}
      </motion.p>
      <motion.p variants={rowIn(0)} className="mt-2 flex items-start gap-2.5 px-1 text-[0.8125rem] leading-5 text-ink-soft">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-gold-700" strokeWidth={1.75} />
        {demo.tip}
      </motion.p>
    </motion.div>
  );
}

/** The bipolar / schizophrenia card's picture: approved reading and a practice, beside a still breathing circle. */
function LibraryPreview({ demo }: { demo: LuminaTracksCopy["demo"]["library"] }) {
  return (
    <motion.div variants={stagger(0.12, 0.25)} initial="hidden" whileInView="show" viewport={REVEAL_VIEWPORT} aria-hidden className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto] rounded-2xl bg-white/80 p-4 ring-1 ring-white">
      <div>
        <p className="flex items-center gap-2 text-[0.75rem]  text-gold-700">
          <BookOpenText className="size-3.5" strokeWidth={2} />
          {demo.heading}
        </p>
        <ul className="mt-3 space-y-2.5">
          {demo.items.map(([title, meta], index) => {
            const Icon = LIBRARY_ICONS[index];
            return (
              <motion.li key={title} variants={rowIn(0)} className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gold-50 text-gold-700">
                  <Icon className="size-4" strokeWidth={1.75} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.875rem] font-medium leading-5 text-ink sm:truncate">{title}</span>
                  <span className="block text-[0.75rem] text-ink-muted sm:truncate">{meta}</span>
                </span>
              </motion.li>
            );
          })}
        </ul>
      </div>

      <div className="relative hidden size-24 shrink-0 items-center justify-center sm:flex">
        <motion.span
          className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgb(230_213_170/0.75),rgb(201_175_111/0.18)_70%,transparent)]"
        />
        <span className="relative text-[0.75rem]  text-gold-700">{demo.breathe}</span>
      </div>
    </motion.div>
  );
}

/**
 * What Lumina does for each of the three conditions it supports: Spark for ADHD, a psychoeducation and
 * self-management library for bipolar disorder and schizophrenia — each with a small live picture of itself —
 * and, beneath, the one daily check-in they share, to try. The check-in and the journal are described once, above.
 */
export function LuminaTracks() {
  const { copy } = useAgentPage("lumina");
  const tracks = copy.lumina.tracks;

  return (
    <HomeSection id="tracks" labelledBy="tracks-title" tone="tint">
      <SectionHeader variant="editorial" id="tracks-title" counter="02 / 04" layout="split" eyebrow={tracks.eyebrow} titleA={tracks.titleA} titleB={tracks.titleB} intro={tracks.intro} />

      <motion.ul variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={REVEAL_VIEWPORT} className="mt-12 grid gap-5 md:mt-16 lg:grid-cols-2 lg:gap-6">
        {tracks.cards.map((card, index) => {
          const tone = CARD_TONES[index];
          const Icon = CARD_ICONS[index];
          return (
            <motion.li key={card.title} variants={fadeUp(0, 24)} className="flex">
              <Spotlight
                tone={tone.spot}
                className={cn(
                  "flex w-full flex-col rounded-panel border p-6 transition-[transform,border-color,box-shadow] duration-500 ease-out-soft hover:-translate-y-1 hover:shadow-soft-hover sm:p-8",
                  tone.surface,
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl", tone.icon)}>
                    <Icon className="size-6" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className={cn(LABEL, tone.label)}>{card.tag}</span>
                </div>
                <h3 className={cn(DISPLAY_S, "mt-6 text-ink")}>{card.title}</h3>
                <p className={cn(BODY_SM, "mt-2 text-[1rem]")}>{card.line}</p>
                <ul className="mt-6 space-y-3">
                  {card.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-[0.9375rem] leading-6 text-ink-soft">
                      <Check className={cn("mt-1 size-4 shrink-0", tone.check)} strokeWidth={2.25} aria-hidden />
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-8">{index === 0 ? <SparkPreview demo={tracks.demo.spark} /> : <LibraryPreview demo={tracks.demo.library} />}</div>
              </Spotlight>
            </motion.li>
          );
        })}
      </motion.ul>

      <motion.div
        variants={fadeUp(0, 24)}
        initial="hidden"
        whileInView="show"
        viewport={REVEAL_VIEWPORT}
        className="mt-5 grid gap-8 rounded-panel border border-line bg-white p-6 sm:p-8 lg:mt-6 lg:grid-cols-12 lg:items-center lg:gap-10"
      >
        <div className="lg:col-span-6">
          <h3 className={cn(DISPLAY_S, "text-ink")}>{tracks.sharedTitle}</h3>
          <p className={cn(BODY_SM, "mt-2")}>{tracks.sharedLine}</p>
        </div>
        <LuminaMoodCard copy={tracks.mood} className="lg:col-span-6" />
      </motion.div>
    </HomeSection>
  );
}
