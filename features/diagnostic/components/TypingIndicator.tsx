"use client";

import { motion, useReducedMotion } from "framer-motion";

export function TypingIndicator() {
  const reduce = useReducedMotion();
  return (
    <span className="flex h-6 items-center gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-sage-700"
          animate={reduce ? { opacity: 0.7 } : { opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={reduce ? undefined : { duration: 1, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}
