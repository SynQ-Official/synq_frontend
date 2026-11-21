"use client";

import { pad } from "@/components/home/accents";
import { HomeSection } from "@/components/home/HomeSection";
import { SectionHeader } from "@/components/home/SectionHeader";
import { BODY, DISPLAY_M, LABEL } from "@/components/home/typography";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { useAgentPage } from "../shared";
import type { PsyScreen } from "./psyData";
import { OverviewScreen, PatientScreen, ReportsScreen, RequestsScreen } from "./PsyScreens";
import { PsyWindow } from "./PsyWindow";

/** The screen each step opens, and the rail item that lights with it. */
const SCREENS: readonly PsyScreen[] = ["requests", "overview", "patient", "reports"];
/** How long a step stays open while the workbench plays itself. */
const STEP_SECONDS = 6;

/**
 * A day in the workspace, told as a workbench rather than /lumina's scroll-pinned tour: four steps along the top, the app
 * below. The steps play by themselves while the section is on screen, each filling its own line of progress, and a click on
 * one takes over for good. The app inside a gold-edged frame redraws its screen with each step.
 */
export function PsyProcess() {
  const { page, copy } = useAgentPage("psy");
  const preview = copy.psy.preview;
  const reduce = useReducedMotion();
  const baseId = useId();
  const area = useRef<HTMLDivElement>(null);
  const inView = useInView(area, { margin: "-20% 0px -20% 0px" });
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);
  const steps = page.flow.steps;
  const playing = inView && !touched && !reduce;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setActive((value) => (value + 1) % steps.length), STEP_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, [playing, active, steps.length]);

  const choose = (index: number) => {
    setTouched(true);
    setActive(index);
  };

  /** Arrow keys move between the steps, like any tab list. */
  const onKeyDown = (event: React.KeyboardEvent) => {
    const forward = event.key === (document.dir === "rtl" ? "ArrowLeft" : "ArrowRight");
    const back = event.key === (document.dir === "rtl" ? "ArrowRight" : "ArrowLeft");
    if (!forward && !back) return;
    event.preventDefault();
    const next = (active + (forward ? 1 : -1) + steps.length) % steps.length;
    choose(next);
    document.getElementById(`${baseId}-tab-${next}`)?.focus();
  };

  const view = (screen: PsyScreen, compact: boolean) => {
    switch (screen) {
      case "requests":
        return <RequestsScreen copy={preview} compact={compact} />;
      case "overview":
        return <OverviewScreen copy={preview} compact={compact} />;
      case "patient":
        return <PatientScreen copy={preview} compact={compact} />;
      default:
        return <ReportsScreen copy={preview} compact={compact} />;
    }
  };

  const [title, line] = steps[active];

  return (
    <HomeSection id="flow" labelledBy="flow-title" tone="deep">
      <span aria-hidden className="pointer-events-none absolute -top-40 end-[-12%] -z-10 size-[44rem] rounded-full bg-[radial-gradient(closest-side,rgb(127_176_174/0.26),transparent)]" />
      <span aria-hidden className="pointer-events-none absolute bottom-[-12rem] start-[-10%] -z-10 size-[36rem] rounded-full bg-[radial-gradient(closest-side,rgb(201_175_111/0.14),transparent)]" />
      <SectionHeader variant="editorial" tone="dark" id="flow-title" counter="02 / 03" eyebrow={page.flow.eyebrow} titleA={page.flow.titleA} titleB={page.flow.titleB} />

      <div ref={area} className="mt-12 lg:mt-16">
        <div role="tablist" aria-label={page.flow.eyebrow} onKeyDown={onKeyDown} className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4 lg:gap-x-8">
          {steps.map(([stepTitle], index) => {
            const isActive = index === active;
            return (
              <button
                key={stepTitle}
                id={`${baseId}-tab-${index}`}
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-controls={`${baseId}-panel`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => choose(index)}
                className="group flex cursor-pointer flex-col justify-start rounded-md text-start outline-none focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-gold-300"
              >
                <span className="relative block h-0.5 w-full overflow-hidden rounded-full bg-white/15">
                  {isActive ? (
                    <motion.span
                      key={`${active}-${playing}`}
                      className="absolute inset-0 origin-left bg-gold rtl:origin-right"
                      initial={{ scaleX: playing ? 0 : 1 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: playing ? STEP_SECONDS : 0.4, ease: playing ? "linear" : EASE_OUT }}
                    />
                  ) : null}
                </span>
                <span dir="ltr" className={cn("mt-4 block font-mono text-[0.8125rem] tabular-nums transition-colors duration-300", isActive ? "text-gold-100" : "text-teal-200/70")}>
                  {pad(index + 1)}
                </span>
                <span className={cn(LABEL, "mt-1.5 block transition-colors duration-300 rtl:!tracking-normal", isActive ? "text-white" : "text-teal-200/70 group-hover:text-white")}>{stepTitle}</span>
              </button>
            );
          })}
        </div>

        <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${active}`} className="mt-10 grid items-center gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4" aria-live={playing ? "off" : "polite"}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                <p className={cn(LABEL, "text-gold-100")}>
                  {page.flow.stepLabel} {pad(active + 1)}
                </p>
                <h3 className={cn(DISPLAY_M, "mt-4 text-white")}>{title}</h3>
                <p className={cn(BODY, "mt-5 !text-teal-100")}>{line}</p>
              </motion.div>
            </AnimatePresence>
            <p className="mt-8 text-[0.75rem] leading-relaxed text-teal-200/80">{preview.caption}</p>
          </div>

          <div className="lg:col-span-8">
            <div className="rounded-[2rem] bg-deep shadow-[0_40px_80px_-40px_rgb(0_0_0/0.7)] ring-1 ring-white/15">
              <div>
                <PsyWindow screen={SCREENS[active]} copy={preview} crop={820} className="!rounded-[2rem] !border-0 !ring-0">
                  {(compact) => (
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={active}
                        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } }}
                        exit={{ opacity: 0, transition: { duration: 0.16 } }}
                      >
                        {view(SCREENS[active], compact)}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </PsyWindow>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HomeSection>
  );
}
