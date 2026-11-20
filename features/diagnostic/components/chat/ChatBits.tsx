"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { copy, type Lang } from "@/lib/i18n/config";
import { fill } from "@/lib/i18n/format";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { MiraPhase } from "../../hooks/useMiraChat";
import { MiraAvatar } from "../MiraMessage";
import { TypingIndicator } from "../TypingIndicator";

/** Mira preparing a reply: avatar + dots + the current beat (reading → reflecting → typing). */
export function MiraTyping({ phase, language }: { phase: MiraPhase | null; language: Lang }) {
  const diagnostic = copy[language].diagnostic;
  const label = phase ? diagnostic.phases[phase] : diagnostic.thinking;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, transition: { duration: 0.15 } }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      className="flex items-center gap-3 sm:gap-3.5"
      role="status"
      aria-live="polite"
    >
      <MiraAvatar size="md" />
      <span className="inline-flex min-h-11 items-center gap-3 rounded-[1.25rem] rounded-ss-md border border-sage-100 bg-sage-50/60 px-4 sm:px-5">
        <TypingIndicator />
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={label}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.2 }}
            className="text-[0.875rem] text-ink-muted"
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.div>
  );
}

export function GreetingPill({ name, language, className }: { name: string; language: Lang; className?: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-sage-100 bg-white px-4 py-2 text-[0.875rem] font-medium text-ink-soft",
        className,
      )}
    >
      <span aria-hidden className="h-2 w-2 rounded-full bg-sage shadow-[0_0_0_3px_rgb(120_174_170/0.2)]" />
      {fill(copy[language].diagnostic.greetingPill, { name })}
    </motion.p>
  );
}

/** The account already finished its orientation: the conversation is read-only. */
export function CompletedNote({ language }: { language: Lang }) {
  const diagnostic = copy[language].diagnostic;
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-[1.375rem] border border-gold-100 bg-gold-50/60 px-6 py-8 text-center sm:px-10"
    >
      <MiraAvatar size="xl" />
      <div className="min-w-0">
        <p className="flex items-center justify-center gap-2 text-lg font-semibold text-ink">
          <ShieldCheck className="h-5 w-5 shrink-0 text-teal-700" aria-hidden />
          {diagnostic.completed.title}
        </p>
        <p className="mx-auto mt-2 max-w-md text-[0.9375rem] leading-7 text-ink-soft">{diagnostic.completed.body}</p>
      </div>
    </motion.div>
  );
}
