"use client";

import { HomeSection } from "@/components/home/HomeSection";
import { SectionHeader } from "@/components/home/SectionHeader";
import { BODY_SM, DISPLAY_S, LABEL, SERIF } from "@/components/home/typography";
import { AgentAvatar } from "@/components/layout/site-header";
import type { LuminaPreviewCopy } from "@/lib/i18n/agents";
import { EASE_OUT, REVEAL_VIEWPORT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, FileText, LockKeyhole, Plus } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { useAgentPage } from "../shared";
import { AGENT_THEME } from "../theme";
import { SIGNAL_LEVELS } from "./chartData";
import { BaselineChart } from "./LuminaHome";

const rise = (delay: number) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease: EASE_OUT, delay } });

/** The week as seven dots: five kept, one gap, today ringed. */
function WeekDots() {
  return (
    <ul className="flex gap-1.5 sm:gap-2" aria-hidden>
      {[1, 1, 1, 0, 1, 1, 2].map((state, index) => (
        <motion.li
          key={index}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.25 + index * 0.06 }}
          className={cn("size-6 rounded-full sm:size-7", state === 1 && "bg-gold", state === 0 && "border border-dashed border-ink-subtle/50", state === 2 && "bg-gold ring-2 ring-ink ring-offset-2 ring-offset-white")}
        />
      ))}
    </ul>
  );
}

/** One small picture per thing Lumina holds: the screen's own card, drawn with example content. */
function RoleVisual({ index, preview }: { index: number; preview: LuminaPreviewCopy }) {
  const reduce = useReducedMotion();
  switch (index) {
    case 0:
      return (
        <div className="space-y-5">
          <p className="flex items-center gap-3">
            <AgentAvatar agent="lumina" className="size-11 rounded-2xl ring-1 ring-gold-100" />
            <span className={cn(SERIF, "text-[1.5rem] font-light leading-tight tracking-[-0.02em] text-ink rtl:font-normal rtl:tracking-normal")}>{preview.greeting}</span>
          </p>
          <div>
            <p className="mb-2.5 text-[0.75rem] font-medium text-ink-muted">{preview.bento.week}</p>
            <WeekDots />
          </div>
        </div>
      );
    case 1:
      return (
        <ul className="space-y-3.5">
          {preview.signals.map((signal, row) => (
            <motion.li key={signal} {...rise(0.1 + row * 0.07)} className="grid grid-cols-[4.5rem_1fr] items-center gap-3">
              <span className="truncate text-[0.8125rem] font-medium text-ink-soft">{signal}</span>
              <span className="relative h-2 rounded-full bg-line">
                <motion.span
                  className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-r from-teal-300 via-teal-500 to-gold"
                  initial={reduce ? false : { width: 0 }}
                  animate={{ width: `${(SIGNAL_LEVELS[row] / 5) * 100}%` }}
                  transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.25 + row * 0.1 }}
                >
                  <span className="absolute -end-1 top-1/2 size-3.5 -translate-y-1/2 rounded-full border-2 border-gold bg-white" />
                </motion.span>
              </span>
            </motion.li>
          ))}
        </ul>
      );
    case 2:
      return (
        <div className="space-y-4">
          <p className={cn(SERIF, "text-[1.0625rem] font-light leading-[1.55] text-ink rtl:font-normal")}>{preview.views.journal.entry}</p>
          <ul className="flex flex-wrap gap-2">
            {preview.views.journal.themes.map((theme, index) => (
              <motion.li
                key={theme}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.4 + index * 0.14 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-gold-100 bg-gold-50 px-3 py-1 text-[0.8125rem] font-medium text-gold-700"
              >
                <span className="size-1.5 rounded-full bg-gold" />
                {theme}
              </motion.li>
            ))}
          </ul>
        </div>
      );
    case 3:
      return (
        <div>
          <BaselineChart delay={0.1} />
          <p className="mt-3 flex items-center gap-2 text-[0.75rem]  text-teal-700">
            <span className="size-2 rounded-full bg-teal-500" />
            {preview.views.trend.verdict}
          </p>
        </div>
      );
    case 4:
      return (
        <div className="flex items-center gap-5">
          <span className="relative flex size-24 shrink-0 items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90 rtl:rotate-90 rtl:-scale-x-100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-line)" strokeWidth="9" />
              <motion.circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-gold)" strokeWidth="9" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 0.8 }} transition={{ duration: 1.2, ease: EASE_OUT, delay: 0.15 }} />
            </svg>
            <span className="flex size-10 items-center justify-center rounded-full bg-gold-50 text-gold-700 ring-1 ring-gold-100">
              <Check className="size-5" strokeWidth={2.5} />
            </span>
          </span>
          <div className="min-w-0 space-y-3">
            <p className={cn(SERIF, "text-[1.25rem] font-light leading-snug tracking-[-0.02em] text-ink rtl:font-normal rtl:tracking-normal")}>{preview.bento.goals}</p>
            <WeekDots />
          </div>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-5">
          <div className="relative h-24 w-32 shrink-0" aria-hidden>
            {[2, 1, 0].map((layer) => (
              <motion.span
                key={layer}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: EASE_OUT, delay: 0.1 + (2 - layer) * 0.12 }}
                className="absolute inset-y-0 w-20 rounded-xl border border-gold-100 bg-white shadow-soft"
                style={{ insetInlineStart: `${layer * 1.75}rem`, transform: `rotate(${(layer - 1) * 4}deg)` }}
              >
                {layer === 0 && <FileText className="m-3 size-5 text-gold-700" strokeWidth={1.5} />}
              </motion.span>
            ))}
          </div>
          <div className="min-w-0 space-y-2">
            <p className="text-[0.9375rem]  text-ink">{preview.views.report.title}</p>
            <p className="flex items-center gap-2 text-[0.8125rem] text-ink-soft">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-white">
                <LockKeyhole className="size-3.5" strokeWidth={1.75} />
              </span>
              {preview.views.report.consent}
            </p>
          </div>
        </div>
      );
  }
}

function Card({ children }: { children: ReactNode }) {
  return <div className="w-full rounded-3xl border border-white bg-white/95 p-6 shadow-float ring-1 ring-gold-100">{children}</div>;
}

/**
 * What Lumina holds, as the same quiet index /mira uses: six titles, one open at a time with its line, and beside it the
 * matching card of the app, drawn fresh each time a different row opens.
 */
export function LuminaRoles() {
  const { page, copy } = useAgentPage("lumina");
  const preview = copy.lumina.preview;
  const reduce = useReducedMotion();
  const baseId = useId();
  const [open, setOpen] = useState(0);
  const theme = AGENT_THEME.lumina;
  const Icon = theme.icons[open % theme.icons.length];
  const current = page.role.items[open];

  return (
    <HomeSection id="role" labelledBy="role-title">
      <SectionHeader variant="editorial" id="role-title" counter="01 / 04" eyebrow={page.role.eyebrow} titleA={page.role.titleA} titleB={page.role.titleB} />

      <div className="mt-12 grid items-start gap-10 lg:mt-16 lg:grid-cols-12 lg:gap-16">
        <motion.ul variants={stagger(0.09)} initial="hidden" whileInView="show" viewport={REVEAL_VIEWPORT} className="border-t border-line lg:col-span-7">
          {page.role.items.map(([title, line, tag], index) => {
            const isOpen = open === index;
            const panelId = `${baseId}-${index}`;
            return (
              <motion.li key={title} variants={fadeUp(0, 24)} className="relative border-b border-line">
                <span aria-hidden className={cn("absolute inset-y-4 start-0 w-0.5 origin-center rounded-full bg-gold transition-transform duration-500 ease-out-soft", isOpen ? "scale-y-100" : "scale-y-0")} />
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(index)}
                    onPointerEnter={(event) => event.pointerType === "mouse" && setOpen(index)}
                    className="group flex w-full cursor-pointer items-center gap-4 py-5 ps-5 text-start outline-none transition-colors focus-visible:bg-canvas focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500 sm:gap-6 sm:py-6"
                  >
                    <span className={cn(DISPLAY_S, "min-w-0 flex-1 text-[clamp(1.375rem,1.2vw+1.05rem,2.125rem)] transition-colors duration-300", isOpen ? "text-ink" : "text-ink-soft group-hover:text-ink")}>
                      {title}
                    </span>
                    <span className={cn(LABEL, "hidden shrink-0 sm:block", theme.label)}>{tag}</span>
                    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,color,transform] duration-500 ease-out-soft", isOpen ? "rotate-45 border-gold-600 bg-gold-600 text-white" : "border-line-strong bg-white text-gold-700")}>
                      <Plus className="size-4" aria-hidden />
                    </span>
                  </button>
                </h3>
                {/* Always rendered (collapsed when closed) so every line is in the server HTML for readers and search. */}
                <motion.div
                  id={panelId}
                  role="region"
                  initial={false}
                  animate={isOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: EASE_OUT }}
                  inert={!isOpen}
                  className="overflow-hidden"
                >
                  <p className={cn(BODY_SM, "pb-6 ps-5 pe-6 text-[1.0625rem]  lg:pb-6")}>{line}</p>
                  {/* Below lg the picture sits under the line it belongs to (drawn only for the open row). */}
                  {isOpen && (
                    <div aria-hidden className="mb-6 me-5 ms-[3.75rem] rounded-2xl border border-gold-100 bg-white p-4 shadow-card sm:ms-[4.75rem] lg:hidden">
                      <RoleVisual index={index} preview={preview} />
                    </div>
                  )}
                </motion.div>
              </motion.li>
            );
          })}
        </motion.ul>

        <motion.div
          aria-hidden
          initial={{ opacity: 0, y: 36, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={REVEAL_VIEWPORT}
          transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.15 }}
          className="hidden lg:sticky lg:top-28 lg:col-span-5 lg:block"
        >
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[2.5rem] border border-gold-100 bg-[linear-gradient(155deg,var(--color-gold-50),#ffffff_92%)]">
            {[0, 1, 2].map((ring) => (
              <motion.span
                key={ring}
                className="absolute rounded-full border border-gold-300/60"
                style={{ width: `${54 + ring * 22}%`, aspectRatio: "1" }}
              />
            ))}
            <AnimatePresence mode="wait">
              <motion.div
                key={open}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                className="relative flex w-[82%] flex-col items-center gap-5"
              >
                <Card>
                  <RoleVisual index={open} preview={preview} />
                </Card>
                <span className={cn(LABEL, "inline-flex items-center gap-2 rounded-full border border-gold-100 bg-white/90 px-4 py-1.5 text-gold-700")}>
                  <Icon className="size-3.5" strokeWidth={1.75} />
                  {current[2]}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </HomeSection>
  );
}
