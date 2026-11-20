"use client";

import { useId, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { scaleColor } from "@/lib/patient/moods";
import { EASE_OUT } from "@/lib/motion";

/** A 0–10 value as an animated ring with an icon in the middle. */
export function ScoreRing({
  value,
  inverted = false,
  display,
  icon,
  size = 76,
  stroke = 7,
  label,
}: {
  value: number | null;
  /** Higher is worse (stress): the colour scale flips. */
  inverted?: boolean;
  /** What to announce for the value, e.g. "4/5" (defaults to "{value}/10"). */
  display?: string;
  icon: ReactNode;
  size?: number;
  stroke?: number;
  label: string;
}) {
  const reduce = useReducedMotion();
  const gradientId = useId().replace(/:/g, "");
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = value === null ? 0 : Math.max(0, Math.min(1, value / 10));
  const color = scaleColor(value, inverted);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${value === null ? "—" : display ?? `${value}/10`}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 rtl:rotate-90" aria-hidden>
        <defs>
          {/* The arc deepens toward its end: a lighter tint where it starts, the full colour where it lands. */}
          <linearGradient id={gradientId} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.45} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="lm-ring-track" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: reduce ? circumference * (1 - fraction) : circumference }}
          animate={{ strokeDashoffset: circumference * (1 - fraction) }}
          transition={{ duration: reduce ? 0 : 0.9, ease: EASE_OUT }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center" style={{ color }}>{icon}</span>
    </div>
  );
}
