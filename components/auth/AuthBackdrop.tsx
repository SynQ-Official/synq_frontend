"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Grain, Motes } from "@/components/home/Atmosphere";
import { EASE_OUT } from "@/lib/motion";

/**
 * The auth canvas, in the home hero's light: teal mist from one edge, champagne from the other, a warm first light
 * rising from below, fine grain and a few motes drifting up. Fixed behind the page, decorative, never printed;
 * still under reduced motion.
 */
export function AuthBackdrop() {
  const reduce = useReducedMotion();
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden bg-[radial-gradient(60%_46rem_at_0%_12%,rgb(191_221_225/0.5),transparent_70%),radial-gradient(55%_42rem_at_100%_16%,rgb(230_213_170/0.42),transparent_70%),linear-gradient(180deg,#ffffff_0%,var(--color-canvas)_100%)] print:hidden"
    >
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.8, y: 120 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 3, delay: 0.2, ease: EASE_OUT }}
        className="absolute inset-x-[-10%] bottom-[-40vh] -z-20 h-[80vh] rounded-[50%] bg-[radial-gradient(closest-side,rgb(243_232_198/0.8),rgb(230_213_170/0.4)_44%,rgb(201_175_111/0.14)_70%,transparent_84%)]"
      />
      <Grain tone="light" />
      <Motes className="top-1/4" />
    </div>
  );
}
