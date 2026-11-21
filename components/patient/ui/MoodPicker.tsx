"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MOOD_LEVELS } from "@/lib/patient/moods";
import { MoodEmoji } from "@/components/patient/ui/MoodEmoji";
import { cn } from "@/lib/utils";

/**
 * Five expressive faces. The chosen one grows, glows in its own colour and its label appears.
 * Radio semantics: arrow keys move the choice.
 */
export function MoodPicker({
  value,
  onChange,
  labels,
  ariaLabel,
  size = "lg",
}: {
  value: number | null;
  onChange: (score: number) => void;
  labels: readonly string[];
  ariaLabel: string;
  size?: "md" | "lg";
}) {
  const reduce = useReducedMotion();
  const selectedIndex = MOOD_LEVELS.findIndex((level) => level.score === value);

  function onKeyDown(event: React.KeyboardEvent) {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = Math.max(0, Math.min(MOOD_LEVELS.length - 1, (selectedIndex < 0 ? 2 : selectedIndex) + step));
    onChange(MOOD_LEVELS[next].score);
    // Roving tabindex: focus follows the selection, or it stays on a button that just left the tab order.
    event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
  }

  return (
    <div role="radiogroup" aria-label={ariaLabel} onKeyDown={onKeyDown} className="grid grid-cols-5 gap-2 sm:gap-3" dir="ltr">
      {MOOD_LEVELS.map((level, index) => {
        const active = level.score === value;
        return (
          <motion.button
            key={level.score}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active || (selectedIndex < 0 && index === 2) ? 0 : -1}
            onClick={() => onChange(level.score)}
            whileHover={reduce ? undefined : { y: -3 }}
            whileTap={reduce ? undefined : { scale: 0.94 }}
            animate={{ scale: active && !reduce ? 1.06 : 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 24 }}
            className={cn(
              "relative flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl border px-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500",
              size === "lg" ? "min-h-[5.75rem] py-3" : "min-h-20 py-2.5",
              active ? "border-transparent" : "border-white/70 bg-white/55 hover:bg-white/80",
            )}
            style={
              active
                ? { background: `linear-gradient(160deg, #fff, ${level.soft})`, boxShadow: `0 0 0 2px ${level.color}, 0 14px 28px -14px ${level.color}` }
                : undefined
            }
          >
            <MoodEmoji level={level} className={cn("transition-[filter,transform] duration-300", size === "lg" ? "text-[2.5rem]" : "text-[2rem]", active ? "scale-110" : "opacity-80 grayscale-[0.25]")} />
            <span className={cn("max-w-full truncate px-0.5 text-[0.6875rem] font-medium leading-tight sm:text-xs", active ? "text-ink" : "text-muted-foreground")} style={active ? { color: level.color } : undefined}>
              {labels[index]}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
