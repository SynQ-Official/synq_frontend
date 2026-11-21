"use client";

import { EASE_OUT } from "@/lib/motion";
import type { TrackId } from "@/lib/i18n/tracks";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";

/** Colour identity of each track: ADHD is aqua, bipolar champagne, psychosis sage — the logo's three notes. */
export const TRACK_TONE: Record<TrackId, { dot: string; text: string; soft: string; ring: string; stage: string; solid: string }> = {
  adhd: {
    dot: "bg-teal-500",
    text: "text-teal-700",
    soft: "bg-teal-50",
    ring: "ring-teal-200",
    solid: "bg-teal-600 text-white",
    stage: "bg-[linear-gradient(150deg,var(--color-teal-100),#ffffff_80%)] border-teal-200",
  },
  bipolar: {
    dot: "bg-gold",
    text: "text-gold-700",
    soft: "bg-gold-50",
    ring: "ring-gold-100",
    solid: "bg-gold text-teal-900",
    stage: "bg-[linear-gradient(150deg,var(--color-gold-50),#f3e8c6_90%)] border-gold-100",
  },
  psychosis: {
    dot: "bg-sage-700",
    text: "text-sage-700",
    soft: "bg-sage-50",
    ring: "ring-sage-100",
    solid: "bg-sage-700 text-white",
    stage: "bg-[linear-gradient(150deg,var(--color-sage-100),#ffffff_82%)] border-sage-100",
  },
};

const W = 320;
const H = 200;

/* ───────────────────────────── ADHD: scattered effort lines up into small steps ───────────────────────────── */

const SCATTER: ReadonlyArray<readonly [number, number]> = [
  [52, 52], [118, 150], [84, 98], [196, 38], [150, 112], [248, 164], [226, 86], [280, 46],
];
const LINED: ReadonlyArray<readonly [number, number]> = SCATTER.map((_, index) => [44 + index * 33, 160 - index * 15] as const);

function AdhdVisual({ labels }: { labels: readonly string[] }) {
  const reduce = useReducedMotion();
  const line = LINED.map(([x, y], index) => `${index ? "L" : "M"}${x} ${y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="size-full" role="img" aria-label={labels.join(" → ")}>
      <motion.path
        d={line}
        fill="none"
        stroke="var(--color-teal-400)"
        strokeWidth="2"
        strokeDasharray="3 6"
        strokeLinecap="round"
        initial={reduce ? false : { pathLength: 0, opacity: 0 }}
        animate={reduce ? undefined : { pathLength: [0, 0, 1, 1, 0], opacity: [0, 0, 1, 1, 0] }}
        transition={{ duration: 9, times: [0, 0.3, 0.5, 0.85, 1], repeat: Infinity, ease: "easeInOut" }}
      />
      {SCATTER.map(([sx, sy], index) => {
        const [lx, ly] = LINED[index];
        const last = index === SCATTER.length - 1;
        return (
          <motion.circle
            key={index}
            r={last ? 9 : 6.5}
            fill={last ? "var(--color-teal-600)" : "var(--color-teal-300)"}
            initial={reduce ? { cx: lx, cy: ly } : { cx: sx, cy: sy }}
            animate={reduce ? undefined : { cx: [sx, sx, lx, lx, sx], cy: [sy, sy, ly, ly, sy] }}
            transition={{ duration: 9, times: [0, 0.2, 0.5, 0.85, 1], repeat: Infinity, ease: EASE_OUT, delay: index * 0.05 }}
          />
        );
      })}
      <text x="22" y="26" className="fill-ink-soft" fontSize="11" fontWeight="400">{labels[0]}</text>
      <text x={W - 22} y={H - 14} textAnchor="end" className="fill-teal-700" fontSize="11" fontWeight="400">{labels[1]}</text>
    </svg>
  );
}

/* ───────────────────────────── Bipolar: days drifting above and below a baseline ───────────────────────────── */

const SAMPLES = 48;
const WAVE: ReadonlyArray<readonly [number, number]> = Array.from({ length: SAMPLES }, (_, index) => {
  const t = index / (SAMPLES - 1);
  // A slow swing that grows, eases past the baseline and dips: a rhythm, not a prediction.
  const envelope = 0.4 + 0.6 * Math.sin(Math.PI * t);
  return [16 + t * (W - 32), H / 2 - Math.sin(t * Math.PI * 3.4 + 0.5) * 64 * envelope] as const;
});
const WAVE_PATH = WAVE.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

function BipolarVisual({ labels }: { labels: readonly string[] }) {
  const reduce = useReducedMotion();
  return (
    <div dir="ltr" className="relative size-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="size-full" role="img" aria-label={labels.join(" · ")}>
        <rect x="0" y={H / 2 - 16} width={W} height="32" fill="var(--color-gold)" opacity="0.18" />
        <line x1="0" x2={W} y1={H / 2} y2={H / 2} stroke="var(--color-gold-600)" strokeWidth="1.25" strokeDasharray="4 5" />
        <motion.path
          d={WAVE_PATH}
          fill="none"
          stroke="var(--color-gold-600)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.4, ease: EASE_OUT }}
        />
        {!reduce && (
          <motion.circle
            r="6"
            fill="var(--color-teal-800)"
            stroke="#fff"
            strokeWidth="2.5"
            initial={{ cx: WAVE[0][0], cy: WAVE[0][1], opacity: 0 }}
            animate={{ cx: WAVE.map(([x]) => x), cy: WAVE.map(([, y]) => y), opacity: [0, 1, 1, 1, 0] }}
            transition={{ duration: 9, ease: "linear", repeat: Infinity, repeatDelay: 1, delay: 2.4 }}
          />
        )}
      </svg>
      <span className="pointer-events-none absolute start-3 top-3 text-[0.6875rem]  text-gold-700">{labels[0]}</span>
      <span className="pointer-events-none absolute start-3 text-[0.6875rem]  text-gold-700" style={{ top: "calc(50% + 20px)" }}>{labels[1]}</span>
      <span className="pointer-events-none absolute bottom-3 start-3 text-[0.6875rem]  text-gold-700">{labels[2]}</span>
    </div>
  );
}

/* ───────────────────────────── Psychosis: grounding rings, only ever fading in (no drifting motion) ───────────────────────────── */

function PsychosisVisual({ labels }: { labels: readonly string[] }) {
  const reduce = useReducedMotion();
  const cx = W / 2;
  const cy = H / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="size-full" role="img" aria-label={labels.join(" · ")}>
      {labels.map((label, index) => {
        const r = 88 - index * 17;
        return (
          <g key={label}>
            <motion.circle
              cx={cx}
              cy={cy}
              r={r}
              fill="var(--color-sage)"
              fillOpacity={0.1 + index * 0.05}
              stroke="var(--color-sage-700)"
              strokeOpacity="0.4"
              strokeWidth="1.25"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.1, delay: 0.3 + index * 0.55, ease: "easeOut" }}
            />
            <motion.text
              x={cx}
              y={cy - r + 13}
              textAnchor="middle"
              fontSize="11"
              fontWeight="400"
              className="fill-sage-700"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.1, delay: 0.6 + index * 0.55, ease: "easeOut" }}
            >
              {label}
            </motion.text>
          </g>
        );
      })}
      <motion.circle
        cx={cx}
        cy={cy + 3}
        r="5"
        fill="var(--color-sage-700)"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 3.3 }}
      />
    </svg>
  );
}

/** The track's picture on its own soft stage, with a one-line caption. */
export function TrackVisual({ track, labels, caption }: { track: TrackId; labels: readonly string[]; caption: string }) {
  const tone = TRACK_TONE[track];
  return (
    <figure className="m-0">
      <div className={cn("relative aspect-[8/5] w-full overflow-hidden rounded-3xl border p-3 shadow-soft sm:p-5", tone.stage)}>
        {track === "adhd" ? <AdhdVisual labels={labels} /> : track === "bipolar" ? <BipolarVisual labels={labels} /> : <PsychosisVisual labels={labels} />}
      </div>
      <figcaption className="mt-3 text-[0.875rem] leading-6 text-ink-soft">{caption}</figcaption>
    </figure>
  );
}
