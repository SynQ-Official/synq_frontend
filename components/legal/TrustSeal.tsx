"use client";

import { LABEL } from "@/components/home/typography";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, type LucideIcon } from "lucide-react";

const RADIUS = 38;

/** Where each of the pillars sits on the ring, as a percentage of the square: the first at the top, then clockwise. */
function place(index: number, total: number) {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return { x: 50 + Math.cos(angle) * RADIUS, y: 50 + Math.sin(angle) * RADIUS };
}

/**
 * The pillars as a seal: each one a node on a ring around a shield, joined to it by a line that draws in. The pillar
 * being read lights up in gold, a pulse leaves the shield towards it, and its name rests under the shield. Reading the page
 * is how it moves, so the picture and the index always agree. Decorative: the sections carry the words.
 */
export function TrustSeal({ ids, icons, titles, active, className }: { ids: readonly string[]; icons: Record<string, LucideIcon>; titles: readonly string[]; active: string; className?: string }) {
  const reduce = useReducedMotion();
  const current = Math.max(0, ids.indexOf(active));

  return (
    <div aria-hidden className={cn("relative mx-auto aspect-square w-full max-w-[26rem]", className)}>
      {/* The ring and the soft light inside it */}
      <motion.span
        className="absolute inset-[12%] rounded-full border border-dashed border-teal-300/80"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
      />
      <span className="absolute inset-[26%] rounded-full bg-[radial-gradient(closest-side,rgb(191_221_225/0.7),rgb(230_213_170/0.22)_70%,transparent)]" />

      {/* Spokes: one per pillar, drawn from the shield outwards */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible">
        {ids.map((id, index) => {
          const { x, y } = place(index, ids.length);
          const on = index === current;
          return (
            <g key={id}>
              <motion.line
                x1="50"
                y1="50"
                x2={x}
                y2={y}
                className={cn("transition-[stroke] duration-500", on ? "stroke-gold" : "stroke-teal-200")}
                strokeWidth={on ? 0.7 : 0.45}
                strokeLinecap="round"
                initial={reduce ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: EASE_OUT, delay: 0.4 + index * 0.1 }}
              />
              {on && !reduce ? (
                <motion.circle
                  key={`pulse-${id}`}
                  r="1.1"
                  className="fill-gold"
                  initial={{ cx: 50, cy: 50, opacity: 0 }}
                  animate={{ cx: [50, x], cy: [50, y], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.8 }}
                />
              ) : null}
            </g>
          );
        })}
      </svg>

      {/* The shield, and the name of the pillar being read */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <motion.span
          initial={reduce ? false : { opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.2 }}
          className="relative flex size-[5.5rem] items-center justify-center rounded-[1.75rem] bg-white shadow-float ring-1 ring-teal-100 sm:size-24"
        >
          <motion.span
            className="absolute -inset-2 rounded-[2.1rem] border border-gold/50"
            animate={reduce ? undefined : { scale: [1, 1.08, 1], opacity: [0.8, 0.2, 0.8] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <ShieldCheck className="size-10 text-teal-700" strokeWidth={1.4} />
        </motion.span>
        <div className="h-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={active}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className={cn(LABEL, "text-center text-teal-700")}
            >
              {titles[current]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* The pillars */}
      {ids.map((id, index) => {
        const Icon = icons[id];
        const { x, y } = place(index, ids.length);
        const on = index === current;
        return (
          <motion.span
            key={id}
            style={{ left: `${x}%`, top: `${y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            initial={reduce ? false : { opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: on ? 1.18 : 1 }}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: reduce ? 0 : 0.5 + index * 0.1 }}
          >
            <span
              className={cn(
                "flex size-11 items-center justify-center rounded-2xl border shadow-card transition-[background-color,border-color,color] duration-500 sm:size-12",
                on ? "border-gold bg-gold-50 text-gold-700" : "border-teal-100 bg-white text-teal-700",
              )}
            >
              <Icon className="size-5" strokeWidth={1.6} />
            </span>
          </motion.span>
        );
      })}
    </div>
  );
}
