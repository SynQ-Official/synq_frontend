"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { homeStoryCopy } from "@/lib/i18n/homeStory";
import { EASE_OUT, REVEAL_VIEWPORT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { HomeSection } from "./HomeSection";
import { StageRise } from "./Interactions";
import { SectionHeader } from "./SectionHeader";
import { ACCENT_LIGHT, BODY, DISPLAY_S, SERIF } from "./typography";

/** The films in `public/media`, in the order of `copy.films`. */
const FILMS = ["/media/SynQ_Patient_2K.mp4", "/media/SynQ_Parent_2K.mp4", "/media/SynQ_Clinician_2K.mp4"] as const;

/** Only the active film plays; the others rest on their first frame and restart from the top when chosen. */
function Film({ src, label, active, playing }: { src: string; label: string; active: boolean; playing: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const wasActive = useRef(active);
  const hasEnded = useRef(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (active && !wasActive.current) {
      video.currentTime = 0;
      hasEnded.current = false;
    }
    wasActive.current = active;
  }, [active]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    // Autoplay can be refused (low-power mode, data saver): the first frame simply stays.
    if (playing && !hasEnded.current) video.play().catch(() => {});
    else video.pause();
  }, [playing]);

  return (
    <video
      ref={ref}
      // #t=0.1 asks for a frame to rest on without downloading the whole film.
      src={`${src}#t=0.1`}
      aria-label={label}
      muted
      playsInline
      loop={false}
      preload={active ? "auto" : "metadata"}
      onEnded={(event) => {
        hasEnded.current = true;
        event.currentTarget.pause();
      }}
      aria-hidden={!active}
      className={cn("absolute inset-0 size-full object-cover transition-opacity duration-700 ease-out motion-reduce:transition-none", active ? "opacity-100" : "opacity-0")}
    />
  );
}

/**
 * What SynQ is, for someone who has never heard of it: the title beside its statement, a ledger of three figures, then
 * the films in one frame on the page itself. Numbered tabs above it let visitors choose a film, which dissolves in place.
 */
export const WhatSection = () => {
  const { language } = useLanguage();
  const copy = homeStoryCopy[language].what;
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  // With reduced motion nothing moves until the visitor picks a film.
  const [started, setStarted] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const onScreen = useInView(stage, { amount: 0.35 });
  const show = (index: number) => {
    const next = Math.min(FILMS.length - 1, Math.max(0, index));
    setActive(next);
  };
  const choose = (index: number) => {
    show(index);
    setStarted(true);
  };

  return (
    <HomeSection id="what" labelledBy="what-title" tone="base">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
        <SectionHeader variant="editorial" id="what-title" eyebrow={copy.eyebrow} titleA={copy.titleA} titleB={copy.titleB} className="lg:col-span-7" />

        <motion.p
          variants={fadeUp(0, 18)}
          initial="hidden"
          whileInView="show"
          viewport={REVEAL_VIEWPORT}
          className={cn(DISPLAY_S, "leading-[1.4] text-ink-soft lg:col-span-5 lg:col-start-8 lg:pb-2")}
        >
          {copy.statement.split(" ").map((word, index) => (
            // Reading-size text needs more contrast than the display accent's gold-600.
            <span key={`${word}-${index}`} className={copy.highlight.includes(word) ? cn(ACCENT_LIGHT, "text-gold-700") : undefined}>
              {word}{" "}
            </span>
          ))}
        </motion.p>
      </div>

      <motion.dl
        variants={stagger(0.12, 0.1)}
        initial="hidden"
        whileInView="show"
        viewport={REVEAL_VIEWPORT}
        className="mt-12 grid grid-cols-3 border-y border-line md:mt-16"
      >
        {copy.facts.map(([value, label], index) => (
          <motion.div
            key={value}
            variants={fadeUp(0, 14)}
            className={cn("flex flex-col-reverse justify-end gap-2 px-3 py-6 first:ps-0 sm:px-6 md:flex-row-reverse md:items-center md:gap-4 md:py-8 lg:px-10", index > 0 && "border-s border-line")}
          >
            <dt className="text-[0.8125rem] leading-snug text-ink-soft sm:text-[0.9375rem]">{label}</dt>
            <dd className={cn(SERIF, "shrink-0 text-[clamp(2.5rem,4vw+1rem,4rem)] font-light leading-none text-gold-600")}>{value}</dd>
          </motion.div>
        ))}
      </motion.dl>

      <StageRise className="mt-12 md:mt-16">
        {/* The frame never grows taller than the screen: on a short or wide window it narrows, so the film stays whole. */}
        <div className="mx-auto flex w-full max-w-[calc(70svh*16/9)] flex-col items-center gap-5 md:gap-6">
          <div role="group" aria-label={copy.filmsLabel} className="grid w-full max-w-2xl grid-cols-3 gap-1 rounded-[1.25rem] border border-line-strong bg-white p-1 sm:rounded-full">
            {copy.films.map(({ title }, index) => {
              const current = active === index;
              return (
                <button
                  key={index}
                  type="button"
                  aria-pressed={current}
                  onClick={() => choose(index)}
                  className={cn(
                    "flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-2 text-center text-[0.8125rem] font-semibold leading-tight transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 sm:flex-row sm:gap-2 sm:rounded-full sm:px-4 sm:text-[0.9375rem]",
                    current ? "bg-ink text-white" : "text-ink-soft hover:bg-canvas hover:text-ink",
                  )}
                >
                  <span dir="ltr" className={cn("font-mono tabular-nums", current ? "text-gold-300" : "text-gold-700")}>{index + 1}</span>
                  <span>{title}</span>
                </button>
              );
            })}
          </div>

          <div ref={stage} className="relative isolate aspect-video w-full overflow-hidden rounded-2xl border border-line md:rounded-3xl">
            {FILMS.map((src, index) => (
              <Film
                key={src}
                src={src}
                label={copy.films[index].title}
                active={active === index}
                playing={active === index && onScreen && (!reduce || started)}
              />
            ))}
          </div>

          <div aria-live="polite" className="min-h-[3.5rem] max-w-xl text-center sm:min-h-[3.25rem]">
            <AnimatePresence mode="wait">
              <motion.p
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
                className={cn(BODY, "text-ink-soft")}
              >
                {copy.films[active].line}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </StageRise>
    </HomeSection>
  );
};
