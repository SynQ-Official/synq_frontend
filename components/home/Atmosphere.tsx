"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Fine film grain: a tiled noise tile, tinted white on deep surfaces and ink on light ones. */
const GRAIN = {
  deep: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .6 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  light: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .17 0 0 0 0 .24 0 0 0 0 .23 0 0 0 .6 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
} as const;

export function Grain({ tone = "deep", className }: { tone?: keyof typeof GRAIN; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 -z-10", tone === "deep" ? "opacity-[0.07]" : "opacity-[0.05]", className)}
      style={{ backgroundImage: GRAIN[tone] }}
    />
  );
}

type Wave = { y: number; amp: number; period: number; seconds: number; className: string };

const VIEW_W = 1440;
const VIEW_H = 480;

/** The wave lines — hairlines at different depths, each drifting at its own slow pace. */
const WAVES: Record<"light" | "deep", Wave[]> = {
  light: [
    { y: 120, amp: 26, period: 960, seconds: 90, className: "text-teal-300/60" },
    { y: 170, amp: 34, period: 720, seconds: 74, className: "text-teal-400/40" },
    { y: 225, amp: 22, period: 1200, seconds: 110, className: "text-gold-300/70" },
    { y: 280, amp: 38, period: 840, seconds: 82, className: "text-teal-300/50" },
    { y: 335, amp: 24, period: 1080, seconds: 100, className: "text-sage/40" },
    { y: 385, amp: 30, period: 780, seconds: 88, className: "text-teal-300/40" },
  ],
  deep: [
    { y: 120, amp: 26, period: 960, seconds: 90, className: "text-teal-300/18" },
    { y: 175, amp: 34, period: 720, seconds: 74, className: "text-teal-200/20" },
    { y: 230, amp: 22, period: 1200, seconds: 110, className: "text-gold-300/35" },
    { y: 285, amp: 38, period: 840, seconds: 82, className: "text-teal-300/25" },
    { y: 340, amp: 24, period: 1080, seconds: 100, className: "text-sage/25" },
  ],
};

/** A sine ribbon as smooth quadratics, long enough to slide exactly one period and loop seamlessly. */
function wavePath({ y, amp, period }: Wave) {
  const half = period / 2;
  const count = Math.ceil((VIEW_W + period * 2) / half);
  let d = `M ${-period} ${y} Q ${-period + half / 2} ${y - amp} ${-period + half} ${y}`;
  for (let k = 2; k <= count; k += 1) d += ` T ${-period + k * half} ${y}`;
  return d;
}

/**
 * Flowing hairlines for a section background. Pure SVG transforms — pauses off-screen and
 * holds still under `prefers-reduced-motion`.
 */
export function WaveLines({ tone = "light", className }: { tone?: "light" | "deep"; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const visible = useInView(ref, { margin: "20% 0px 20% 0px" });
  const run = visible && !reduce;

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("pointer-events-none absolute inset-x-0 -z-10 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_22%,black_72%,transparent)]", className)}
    >
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none" className="h-full w-full">
        {WAVES[tone].map((wave) => (
          <motion.g
            key={wave.y}
            className={wave.className}
            animate={run ? { x: [0, -wave.period] } : { x: 0 }}
            transition={run ? { duration: wave.seconds, ease: "linear", repeat: Infinity } : { duration: 0 }}
          >
            <path d={wavePath(wave)} fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </motion.g>
        ))}
      </svg>
    </div>
  );
}

/** Motes of light rising through the landscape: [left %, size px, seconds, delay, gold?]. */
const MOTES = [
    [8, 4, 13, 0, true], [16, 3, 16, 3, false], [24, 5, 12, 6, true], [33, 3, 18, 1, false],
    [41, 4, 14, 8, true], [52, 3, 17, 4, false], [60, 5, 12, 9, true], [69, 3, 15, 2, false],
    [77, 4, 13, 7, true], [85, 3, 19, 5, false], [92, 5, 14, 10, true],
] as const;

export function Motes({ className }: { className?: string } = {}) {
    const reduce = useReducedMotion();
    if (reduce) return null;
    return (
        <div aria-hidden className={cn("pointer-events-none absolute inset-x-0 bottom-0 top-1/3 -z-10 overflow-hidden", className)}>
            {MOTES.map(([left, size, seconds, delay, gold], index) => (
                <motion.span
                    key={left}
                    className={cn("absolute bottom-0 rounded-full", index % 2 === 1 && "max-sm:hidden", gold ? "bg-gold shadow-[0_0_14px_3px_rgb(201_175_111/0.45)]" : "bg-teal-300 shadow-[0_0_12px_3px_rgb(134_186_188/0.45)]")}
                    style={{ left: `${left}%`, width: size, height: size }}
                    initial={{ y: 0, opacity: 0 }}
                    animate={{ y: [0, -420], opacity: [0, 0.9, 0] }}
                    transition={{ duration: seconds, delay, repeat: Infinity, ease: "easeOut" }}
                />
            ))}
        </div>
    );
}

/** A single brush stroke drawn under the accent phrase once the headline has landed. */
export function Swash({ delay = 2.1 }: { delay?: number }) {
    return (
        <svg aria-hidden viewBox="0 0 400 16" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 -bottom-[0.14em] h-[0.16em] w-full overflow-visible text-gold">
            <motion.path
                d="M2 10 C 70 2, 150 15, 230 7 S 350 11, 398 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.9 }}
                transition={{ duration: 1.4, delay, ease: EASE_OUT }}
            />
        </svg>
    );
}
