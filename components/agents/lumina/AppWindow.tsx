"use client";

import { AgentAvatar, type AgentId } from "@/components/layout/site-header";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { BookHeart, BookOpen, FileText, HeartPulse, House, Settings, type LucideIcon } from "lucide-react";
import { useId, type ReactNode } from "react";

/** The screens of the real app, in its own order: home, check-in, journal, library, reports, settings. */
export const APP_NAV = [House, HeartPulse, BookOpen, BookHeart, FileText, Settings] as const;
export type AppScreen = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Lumina's own app, drawn as a window: the dark rail of the patient's screens on one side, the screen on the other, lit by
 * the same morning light. The rail follows `active` with a marker that glides between items. Decorative: the page that
 * uses it carries the words. `agent` and `nav` let another app (the clinician's) wear the same window with its own rail.
 */
export function AppWindow({ active, children, className, agent = "lumina", nav = APP_NAV }: { active: AppScreen; children: ReactNode; className?: string; agent?: AgentId; nav?: readonly LucideIcon[] }) {
  const reduce = useReducedMotion();
  const marker = useId();

  return (
    <div
      aria-hidden
      className={cn(
        "relative flex overflow-hidden rounded-[1.75rem] border border-white bg-[radial-gradient(70%_55%_at_100%_0%,rgb(230_213_170/0.45),transparent),radial-gradient(60%_50%_at_0%_100%,rgb(191_221_225/0.6),transparent),linear-gradient(180deg,#ffffff,var(--color-canvas))] shadow-float ring-1 ring-line",
        className,
      )}
    >
      <nav className="flex w-11 shrink-0 flex-col items-center gap-1 bg-teal-900 py-3.5 sm:w-14 sm:gap-1.5 sm:py-4">
        <AgentAvatar agent={agent} className="mb-2 size-7 rounded-lg sm:mb-3 sm:size-9 sm:rounded-xl" />
        {nav.map((Icon, index) => (
          <span key={index} className={cn("relative flex size-8 items-center justify-center rounded-xl sm:size-10", index === active ? "text-gold-100" : "text-teal-200/70")}>
            {index === active && (
              <motion.span
                layoutId={`${marker}-rail`}
                className="absolute inset-0 rounded-xl bg-white/15 ring-1 ring-white/20"
                transition={reduce ? { duration: 0 } : { duration: 0.5, ease: EASE_OUT }}
              />
            )}
            <Icon className="relative size-[1.0625rem] sm:size-[1.1875rem]" strokeWidth={1.75} />
          </span>
        ))}
        <span className="mt-auto flex size-8 items-center justify-center rounded-full bg-white/10 sm:size-9">
          <span className="relative flex size-2">
            <span className="relative size-2 rounded-full bg-sage" />
          </span>
        </span>
      </nav>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
