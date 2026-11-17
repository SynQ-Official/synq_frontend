"use client";

import { SERIF } from "@/components/home/typography";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { MiraAvatar } from "./MiraMessage";
import { ESTIMATED_QUESTIONS } from "../lib/chapters";

/** How long each step of the hand-over is held. The whole sequence lasts `STEPS × STEP_MS`. */
export const FINISH_STEP_MS = 950;

/**
 * The last beat of the conversation. The last answer does not drop the visitor onto a loading pill: a ring
 * closes to all of them, three quiet steps tick off what Mira is doing, and only then does the result open.
 */
export function FinishingScreen({ total = ESTIMATED_QUESTIONS }: { total?: number }) {
  const { dictionary } = useLanguage();
  const copy = dictionary.diagnostic.finishing;
  const reduce = useReducedMotion();
  const steps = copy.steps;
  const [done, setDone] = useState(reduce ? steps.length : 0);

  useEffect(() => {
    if (reduce) return;
    const timer = window.setInterval(() => setDone((count) => Math.min(steps.length, count + 1)), FINISH_STEP_MS);
    return () => window.clearInterval(timer);
  }, [reduce, steps.length]);

  const ready = done >= steps.length;
  const radius = 54;

  return (
    <div className="relative flex min-h-[26rem] flex-1 items-center justify-center px-4 py-10" role="status" aria-live="polite">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="orientation-glass relative w-full max-w-md overflow-hidden px-6 py-10 text-center sm:px-10"
      >
        <span aria-hidden className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-teal-300 via-gold to-gold-100" />

        <div className="relative mx-auto flex size-36 items-center justify-center">
          <svg viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90 rtl:rotate-90 rtl:-scale-x-100" aria-hidden>
            <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--color-teal-100)" strokeWidth="7" />
            <motion.circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="var(--color-gold)"
              strokeWidth="7"
              strokeLinecap="round"
              initial={{ pathLength: reduce ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduce ? 0 : (steps.length * FINISH_STEP_MS) / 1000, ease: "easeInOut" }}
            />
          </svg>
          <MiraAvatar size="xl" className="relative" />
          <motion.span
            initial={false}
            animate={ready ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 18 }}
            className="absolute -bottom-1 end-2 flex size-9 items-center justify-center rounded-full bg-sage-700 text-white ring-4 ring-white"
          >
            <Check className="size-5" strokeWidth={3} aria-hidden />
          </motion.span>
        </div>

        <p dir="ltr" className={cn(SERIF, "mt-6 text-[2.25rem] font-light leading-none tracking-[-0.03em] text-ink tabular-nums")}>
          {total}
          <span className="text-ink-subtle"> / {total}</span>
        </p>
        <p className="mt-2 text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-teal-700 rtl:normal-case rtl:tracking-normal">{copy.eyebrow}</p>
        <h2 className={cn(SERIF, "mt-4 text-[1.625rem] font-light leading-tight tracking-[-0.02em] text-ink rtl:font-normal rtl:tracking-normal")}>
          {ready ? copy.ready : copy.title}
        </h2>

        <ul className="mx-auto mt-7 max-w-xs space-y-3 text-start">
          {steps.map((step, index) => {
            const complete = index < done;
            const active = index === done;
            return (
              <li key={step} className={cn("flex items-center gap-3 text-[0.9375rem] transition-colors duration-500", complete ? "text-ink" : active ? "text-ink-soft" : "text-ink-subtle")}>
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-500",
                    complete ? "border-teal-600 bg-teal-600 text-white" : active ? "border-gold bg-white" : "border-line-strong bg-white",
                  )}
                >
                  {complete ? (
                    <Check className="size-3.5" strokeWidth={3} aria-hidden />
                  ) : active ? (
                    <span className="size-2 rounded-full bg-gold motion-safe:animate-pulse" />
                  ) : null}
                </span>
                {step}
              </li>
            );
          })}
        </ul>

        <p className={cn("mt-7 text-[0.8125rem] text-ink-muted transition-opacity duration-500", ready ? "opacity-100" : "opacity-0")}>{copy.opening}</p>
      </motion.div>
    </div>
  );
}
