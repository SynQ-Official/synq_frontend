"use client";

import { motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

const LEVELS = ["LOW", "MODERATE", "HIGH"] as const;

export function MatchStrengthMeter({
  level,
  label,
  levelLabel,
  tone = "default",
  hideLabel = false,
}: {
  level: (typeof LEVELS)[number];
  label: string;
  levelLabel: string;
  /** The surrounding tile already names the metric; keep the label for assistive tech only. */
  hideLabel?: boolean;
  /** "inverse" renders light-on-dark for the result hero (prints in brand teal). */
  tone?: "default" | "inverse";
}) {
  const filled = LEVELS.indexOf(level) + 1;
  const inverse = tone === "inverse";
  return (
    <div className="min-w-0">
      <p className={cn("text-[0.8125rem]", inverse ? "text-teal-100" : "text-ink-soft", hideLabel && "sr-only")}>{label}</p>
      <div className={cn("flex items-center gap-3", !hideLabel && "mt-1.5")}>
        <div role="meter" aria-label={label} aria-valuemin={1} aria-valuemax={3} aria-valuenow={filled} aria-valuetext={levelLabel} className="flex gap-1">
          {LEVELS.map((step, i) => (
            <span key={step} className={cn("h-2 w-8 overflow-hidden rounded-full", inverse ? "bg-white/20 print:bg-teal-100" : "bg-teal-100")}>
              <motion.span
                className={cn("block h-full origin-left rounded-full rtl:origin-right", inverse ? "bg-white print:bg-teal-600" : "bg-teal-700")}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: i < filled ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.14, ease: EASE_OUT }}
              />
            </span>
          ))}
        </div>
        <span className={cn("text-[0.9375rem] font-semibold", inverse ? "text-white" : "text-ink")}>{levelLabel}</span>
      </div>
    </div>
  );
}
