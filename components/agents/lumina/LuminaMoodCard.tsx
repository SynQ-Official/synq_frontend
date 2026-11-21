"use client";

import { MoodEmoji } from "@/components/patient/ui/MoodEmoji";
import { EASE_OUT } from "@/lib/motion";
import { MOOD_LEVELS } from "@/lib/patient/moods";
import type { LuminaTracksCopy } from "@/lib/i18n/agents";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";

/**
 * The daily mood question, playable: five real emoji faces; the chosen one rises and lights the card in its own hue,
 * and one supportive line answers it. Nothing is stored — it is the same gesture the patient makes in the check-in.
 */
export function LuminaMoodCard({ copy, className }: { copy: LuminaTracksCopy["mood"]; className?: string }) {
  const reduce = useReducedMotion();
  // Starts on "Usual", the middle of a scale centred on the person's own usual.
  const [index, setIndex] = useState(2);
  const level = MOOD_LEVELS[index];

  function onKeyDown(event: React.KeyboardEvent) {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    setIndex((current) => Math.max(0, Math.min(MOOD_LEVELS.length - 1, current + step)));
  }

  return (
    <div
      className={cn("relative isolate overflow-hidden rounded-3xl border border-white/70 p-5 shadow-float transition-[background-color] duration-700 ease-out-soft sm:p-6", className)}
      style={{ background: `linear-gradient(160deg, #ffffff 0%, ${level.soft} 100%)` }}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -end-10 -top-10 -z-10 size-48 rounded-full blur-3xl"
        animate={{ backgroundColor: level.color, opacity: 0.22 }}
        transition={{ duration: 0.7 }}
      />

      <p className="text-[1.0625rem]  text-ink">{copy.title}</p>
      <p className="mt-1 text-[0.875rem] leading-6 text-ink-soft">{copy.prompt}</p>

      {/* Faces read left to right in both languages, like the patient's own check-in. */}
      <div role="radiogroup" aria-label={copy.title} onKeyDown={onKeyDown} dir="ltr" className="mt-5 grid grid-cols-5 gap-1.5 sm:gap-2.5">
        {MOOD_LEVELS.map((item, position) => {
          const active = position === index;
          return (
            <motion.button
              key={item.level}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={copy.levels[position]}
              tabIndex={active ? 0 : -1}
              onClick={() => setIndex(position)}
              whileHover={reduce ? undefined : { y: -4 }}
              whileTap={reduce ? undefined : { scale: 0.93 }}
              animate={{ scale: active && !reduce ? 1.08 : 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 24 }}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border px-1 py-3 outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
                active ? "border-transparent bg-white" : "border-white/70 bg-white/50 hover:bg-white/80",
              )}
              style={active ? { boxShadow: `0 0 0 2px ${item.color}, 0 14px 26px -14px ${item.color}` } : undefined}
            >
              <MoodEmoji level={item} className={cn("text-[2.25rem] transition-[opacity,filter] duration-300 sm:text-[2.75rem]", active ? "" : "opacity-75 grayscale-[0.2]")} />
              <span className={cn("max-w-full truncate text-[0.6875rem] font-medium sm:text-xs", active ? "" : "text-ink-muted")} style={active ? { color: item.color } : undefined}>
                {copy.levels[position]}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-5 flex min-h-[3.5rem] items-start justify-between gap-3 rounded-2xl bg-white/70 p-3.5 ring-1 ring-white" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={index}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            className="text-[0.9375rem] leading-6 text-ink-soft"
          >
            {copy.messages[index]}
          </motion.p>
        </AnimatePresence>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-sage-100 bg-sage-50 px-2.5 py-1 text-[0.6875rem]  text-sage-700">
          <Check className="size-3" strokeWidth={3} aria-hidden />
          {copy.saved}
        </span>
      </div>
    </div>
  );
}
