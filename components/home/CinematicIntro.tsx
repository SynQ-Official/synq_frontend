"use client";

import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_IN_OUT, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { IntroBrand, IntroCounter, IntroField } from "./IntroScene";
import { ACCENT_LIGHT, LABEL, SERIF } from "./typography";

type CinematicIntroProps = {
  onComplete: () => void;
};

/** The second half of the scene: one sentence, then the colour settles into the hero's own light and the page appears. */
/** The colour has fully settled into the hero's light (SETTLE seconds after EXIT_AT) before the overlay starts to fade. */
const EXIT_AT_MS = 520;
const SETTLE_SECONDS = 0.8;
const COMPLETE_AT_MS = EXIT_AT_MS + SETTLE_SECONDS * 1000 + 40;

export const CinematicIntro = ({ onComplete }: CinematicIntroProps) => {
  const [startExit, setStartExit] = useState(false);
  const { dictionary, direction } = useLanguage();
  const reduce = useReducedMotion();
  const copy = dictionary.homeLanding.intro;

  const calm = useMotionValue(0);
  const presence = useMotionValue(1);
  // The loader ended at 100%; its numerals dissolve here instead of vanishing.
  const hundred = useMotionValue(100);

  // Latest callback without restarting the timeline when the parent re-renders.
  const done = useRef(onComplete);
  useEffect(() => {
    done.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (reduce) {
      const quick = setTimeout(() => done.current(), 300);
      return () => clearTimeout(quick);
    }
    let settle: ReturnType<typeof animate> | undefined;
    const exit = setTimeout(() => {
      setStartExit(true);
      settle = animate(calm, 1, { duration: SETTLE_SECONDS, ease: EASE_IN_OUT });
    }, EXIT_AT_MS);
    const complete = setTimeout(() => done.current(), COMPLETE_AT_MS);
    return () => {
      clearTimeout(exit);
      clearTimeout(complete);
      settle?.stop();
    };
  }, [reduce, calm]);

  // Anyone in a hurry can move on: a tap, a click, Enter or Escape.
  const skip = useCallback(() => done.current(), []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => (event.key === "Escape" || event.key === "Enter") && skip();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [skip]);

  return (
    <motion.div
      dir={direction}
      onClick={skip}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: reduce ? 0.25 : 0.6, ease: EASE_IN_OUT } }}
      className="fixed inset-0 z-[10000] isolate cursor-pointer overflow-hidden bg-white text-ink"
    >
      {reduce ? (
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_50%_at_0%_20%,rgb(191_221_225/0.55),transparent_70%),radial-gradient(60%_50%_at_100%_20%,rgb(230_213_170/0.45),transparent_70%)]" />
      ) : (
        <IntroField calm={calm} presence={presence} />
      )}

      <motion.div
        animate={{ opacity: startExit ? 0 : 1, y: startExit ? -16 : 0 }}
        transition={{ duration: 0.5, ease: EASE_IN_OUT }}
        className="relative flex h-full flex-col items-center justify-center px-6 text-center"
      >
        <IntroBrand instant />

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT }}
          className={cn(SERIF, "mt-6 max-w-[22ch] text-[clamp(1.25rem,2.6vw,2rem)] font-light leading-[1.25] tracking-[-0.02em] text-ink-soft rtl:font-sans rtl:tracking-normal sm:max-w-none")}
        >
          {copy.lineA} <span className={ACCENT_LIGHT}>{copy.lineB}</span>
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: EASE_OUT }}
          className={cn(LABEL, "mt-4 text-teal-700")}
        >
          {copy.tagline}
        </motion.p>
      </motion.div>

      <motion.div animate={{ opacity: 0 }} initial={{ opacity: 1 }} transition={{ duration: 0.6, ease: EASE_OUT }} className="absolute bottom-6 start-6 sm:bottom-9 sm:start-10">
        <IntroCounter progress={hundred} />
      </motion.div>
    </motion.div>
  );
};
