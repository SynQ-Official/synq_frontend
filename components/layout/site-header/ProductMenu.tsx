"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT, SPRING_SOFT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { AgentAvatar } from "./AgentAvatar";
import { AGENTS } from "./agents";

const OPEN_DELAY = 80;
const CLOSE_DELAY = 160;

type ProductMenuProps = {
  triggerClassName: string;
  /** Rendered inside the trigger (e.g. the shared active pill). */
  indicator?: React.ReactNode;
  /** Highlights the trigger while one of its pages is open. */
  current?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/**
 * "Companions" disclosure: a short list of the product's pages (Mira, Lumina) under a "Product" title.
 * Opens on hover intent or click; closes on Escape, outside click, focus leaving or navigation.
 * A list of links rather than an ARIA menu, so plain Tab order applies inside it.
 */
export function ProductMenu({ triggerClassName, indicator, current, onOpenChange }: ProductMenuProps) {
  const { dictionary, direction } = useLanguage();
  const copy = dictionary.header;
  const reduce = useReducedMotion();
  const panelId = useId();
  const [open, setOpenState] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | undefined>(undefined);

  const setOpen = useCallback(
    (next: boolean) => {
      window.clearTimeout(timer.current);
      setOpenState(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  const schedule = (next: boolean) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(next), next ? OPEN_DELAY : CLOSE_DELAY);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, setOpen]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div
      ref={rootRef}
      className="relative"
      onPointerEnter={(event) => event.pointerType === "mouse" && schedule(true)}
      onPointerLeave={(event) => event.pointerType === "mouse" && schedule(false)}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className={cn(triggerClassName, "gap-1.5", (open || current) && "text-ink")}
      >
        {indicator}
        <span className="relative">{copy.links.product}</span>
        <ChevronDown aria-hidden className={cn("relative h-4 w-4 transition-transform duration-300 ease-out-soft", open && "rotate-180 text-teal-700")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            dir={direction}
            role="region"
            aria-label={copy.links.product}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, transition: SPRING_SOFT }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.16, ease: EASE_OUT } }}
            style={{ transformOrigin: "top" }}
            className="absolute start-1/2 top-full z-50 w-[min(21.5rem,calc(100vw-2rem))] -translate-x-1/2 pt-3 rtl:translate-x-1/2"
          >
            {/* pt-3 above bridges the gap under the trigger so hover intent survives the trip to the panel. */}
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/85 p-2 shadow-float ring-1 ring-line/60 backdrop-blur-2xl">
              <div aria-hidden className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
              <p className="flex items-center gap-2.5 px-3.5 pb-2 pt-3 text-[0.6875rem]  uppercase leading-none tracking-[0.18em] text-ink-muted rtl:normal-case rtl:tracking-normal">
                <span aria-hidden className="h-px w-5 bg-gold" />
                {copy.menu.title}
              </p>

              <ul>
                {AGENTS.map((agent) => {
                  const item = copy.agents.items[agent.id];
                  return (
                    <li key={agent.id}>
                      <Link
                        href={agent.href}
                        onClick={() => setOpen(false)}
                        className={cn("group flex items-center gap-3.5 rounded-[1.25rem] p-3 outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-teal-500", agent.tone.hover)}
                      >
                        <AgentAvatar agent={agent.id} className="size-12 rounded-2xl ring-1 ring-line transition-transform duration-500 ease-out-soft motion-safe:group-hover:scale-105" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[1rem]  tracking-[-0.01em] text-ink">{item.name}</span>
                          <span className={cn("mt-0.5 block truncate text-[0.8125rem] font-medium", agent.tone.text)}>{item.role}</span>
                        </span>
                        <ArrowRight
                          aria-hidden
                          className="size-4 shrink-0 text-ink-subtle transition-[transform,color] duration-300 ease-out-soft group-hover:translate-x-0.5 group-hover:text-ink rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
