"use client";

import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_IN_OUT, EASE_OUT } from "@/lib/motion";
import { IntroBrand, IntroCounter, IntroField } from "./IntroScene";

type LoadingScreenProps = {
    onComplete: () => void;
    /** Leave the whole intro at once (the loader is only the first half of it). */
    onSkip?: () => void;
};

/** Total time the loader runs; the intro that follows takes about as long again. */
const LOAD_SECONDS = 1.6;

/**
 * First visit only, first half of the intro: colour comes up out of white — aqua and teal on one side, champagne and gold on the other —
 * the mark takes its colour, the name rises letter by letter under one sweep of gold, and the percentage fills with colour.
 * Nothing is drawn as a line or a shape; the next screen picks the same colour field up where this one stops.
 */
export const LoadingScreen = ({ onComplete, onSkip }: LoadingScreenProps) => {
    const reduce = useReducedMotion();
    const { dictionary, direction } = useLanguage();
    const copy = dictionary.homeLanding.intro;
    const progress = useMotionValue(0);
    const presence = useMotionValue(0);
    const calm = useMotionValue(0);

    // The parent passes fresh callbacks each render; keep the latest without restarting the count.
    const done = useRef(onComplete);
    const skip = useRef(onSkip);
    useEffect(() => {
        done.current = onComplete;
        skip.current = onSkip;
    }, [onComplete, onSkip]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        const counting = animate(progress, 100, {
            duration: reduce ? 0.5 : LOAD_SECONDS,
            ease: EASE_IN_OUT,
            onComplete: () => {
                timer = setTimeout(() => done.current(), reduce ? 120 : 40);
            },
        });
        const rising = animate(presence, 1, { duration: 0.9, ease: EASE_OUT });
        return () => {
            counting.stop();
            rising.stop();
            if (timer) clearTimeout(timer);
        };
    }, [progress, presence, reduce]);

    const leave = useCallback(() => (skip.current ?? done.current)(), []);
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => (event.key === "Escape" || event.key === "Enter") && leave();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [leave]);

    return (
        <motion.div
            dir={direction}
            role="status"
            aria-label={dictionary.common.loading}
            onClick={leave}
            exit={reduce ? { opacity: 0, transition: { duration: 0.3 } } : undefined}
            className="fixed inset-0 z-[10000] isolate cursor-pointer overflow-hidden bg-white text-ink"
        >
            {reduce ? (
                <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_50%_at_0%_20%,rgb(191_221_225/0.55),transparent_70%),radial-gradient(60%_50%_at_100%_20%,rgb(230_213_170/0.45),transparent_70%)]" />
            ) : (
                <IntroField calm={calm} presence={presence} />
            )}

            <div className="relative flex h-full flex-col items-center justify-center px-6">
                <IntroBrand />
            </div>

            <IntroCounter progress={progress} className="absolute bottom-6 start-6 sm:bottom-9 sm:start-10" />

            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    leave();
                }}
                className="absolute end-5 top-5 inline-flex min-h-11 items-center rounded-full border border-teal-900/15 bg-white/70 px-5 text-[0.8125rem] font-semibold text-teal-900 outline-none transition-colors duration-200 hover:bg-white focus-visible:ring-2 focus-visible:ring-teal-500 sm:end-8 sm:top-8"
            >
                {copy.skip}
            </button>
        </motion.div>
    );
};
