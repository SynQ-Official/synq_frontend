"use client";

import { HomeSection } from "@/components/home/HomeSection";
import { SectionHeader } from "@/components/home/SectionHeader";
import { BODY_SM, DISPLAY_S, LABEL } from "@/components/home/typography";
import { EASE_OUT, REVEAL_VIEWPORT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { useId, useState } from "react";
import { useAgentPage } from "../shared";
import { AGENT_THEME } from "../theme";

/**
 * What Mira does, as a quiet index: six titles, one open at a time with its single line, and beside it a large
 * mark that follows the open row. Titles are the content; the line is only there for the one you are reading.
 */
export function MiraRoles() {
  const { page } = useAgentPage("mira");
  const reduce = useReducedMotion();
  const baseId = useId();
  const [open, setOpen] = useState(0);
  const theme = AGENT_THEME.mira;
  const Icon = theme.icons[open % theme.icons.length];
  const current = page.role.items[open];

  return (
    <HomeSection id="role" labelledBy="role-title">
      <SectionHeader variant="editorial" id="role-title" counter="01 / 03" eyebrow={page.role.eyebrow} titleA={page.role.titleA} titleB={page.role.titleB} />

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
                    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,color,transform] duration-500 ease-out-soft", isOpen ? "rotate-45 border-teal-700 bg-teal-700 text-white" : "border-line-strong bg-white text-teal-700")}>
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
                  <p className={cn(BODY_SM, "pb-6 ps-5 pe-6 text-[1.0625rem] ")}>{line}</p>
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
          className="hidden lg:col-span-5 lg:block lg:sticky lg:top-28"
        >
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[2.5rem] border border-teal-200 bg-[linear-gradient(155deg,var(--color-teal-100),#ffffff_92%)]">
            {[0, 1, 2].map((ring) => (
              <motion.span
                key={ring}
                className="absolute rounded-full border border-teal-300/70"
                style={{ width: `${46 + ring * 24}%`, aspectRatio: "1" }}
              />
            ))}
            <AnimatePresence mode="wait">
              <motion.div
                key={open}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8, rotate: -8 }}
                animate={{ opacity: 1, scale: 1, rotate: 0, transition: { duration: 0.5, ease: EASE_OUT } }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                className="relative flex flex-col items-center gap-5"
              >
                <span className="flex size-32 items-center justify-center rounded-[2rem] bg-white text-teal-700 shadow-float ring-1 ring-white">
                  <Icon className="size-14" strokeWidth={1.25} />
                </span>
                <span className={cn(LABEL, "rounded-full border border-teal-200 bg-white/80 px-4 py-1.5 text-teal-700")}>{current[2]}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </HomeSection>
  );
}
