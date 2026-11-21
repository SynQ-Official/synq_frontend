"use client";

import { Magnetic, WordReveal } from "@/components/home/AnimationUtilities";
import { Grain } from "@/components/home/Atmosphere";
import { ACCENT_DARK, BODY, SERIF } from "@/components/home/typography";
import { AgentAvatar } from "@/components/layout/site-header";
import { EASE_OUT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, BellRing, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { AgentStatusPill } from "../AgentStatusPill";
import { PillLink, StatsStrip, useAgentPage } from "../shared";
import { OverviewScreen, PatientScreen, ReportsScreen } from "./PsyScreens";
import { PsyWindow } from "./PsyWindow";

/** A note pinned beside the window: it arrives once with the stage, then stays put. */
function Floater({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.1 + delay, ease: EASE_OUT }}
      className={cn("absolute z-20 rounded-xl border border-white/15 bg-teal-950/90 px-3.5 py-2.5 text-white shadow-[0_16px_32px_-16px_rgb(0_0_0/0.6)]", className)}
    >
      {children}
    </motion.div>
  );
}

/** A screen of the app standing on the stage, drawn at its own size and turned a few degrees towards the centre. */
function Panel({ children, className, tilt, delay }: { children: ReactNode; className: string; tilt: string; delay: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      initial={reduce ? false : { opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay, ease: EASE_OUT }}
      className={cn("absolute top-[8%] z-0 hidden w-[46%] md:block", className)}
    >
      <div className={cn("opacity-90 saturate-[0.9] [mask-image:linear-gradient(to_bottom,#000_55%,transparent)]", tilt)}>{children}</div>
    </motion.div>
  );
}

/**
 * The stage: three screens of the app fanned like a hand of cards, the main one in front. It holds still: a clinician reads
 * it as a working tool, not a show.
 */
function Stage() {
  const { copy } = useAgentPage("psy");
  const preview = copy.psy.preview;
  const reduce = useReducedMotion();

  const [alertTitle, alertMeta] = preview.attention.items[0];

  return (
    <figure className="mx-auto mt-16 w-full max-w-5xl lg:mt-20">
      <div className="relative px-1 pb-10 pt-6 sm:px-6 sm:pb-14">
        <div className="relative">
          <Panel className="start-[-2%]" tilt="[transform:perspective(1200px)_rotateY(16deg)_scale(0.9)] rtl:[transform:perspective(1200px)_rotateY(-16deg)_scale(0.9)]" delay={0.6}>
            <PsyWindow screen="patient" copy={preview} crop={520} className="border-white/10">
              {(compact) => <PatientScreen copy={preview} compact={compact} />}
            </PsyWindow>
          </Panel>
          <Panel className="end-[-2%]" tilt="[transform:perspective(1200px)_rotateY(-16deg)_scale(0.9)] rtl:[transform:perspective(1200px)_rotateY(16deg)_scale(0.9)]" delay={0.75}>
            <PsyWindow screen="reports" copy={preview} crop={520} className="border-white/10">
              {(compact) => <ReportsScreen copy={preview} compact={compact} />}
            </PsyWindow>
          </Panel>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 48, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.35, ease: EASE_OUT }}
            className="relative z-10 mx-auto w-full md:w-[74%]"
          >
            <div className="rounded-[2rem] bg-deep shadow-[0_40px_80px_-40px_rgb(0_0_0/0.7)] ring-1 ring-white/15">
              <PsyWindow screen="overview" copy={preview} crop={640} className="!rounded-[2rem] !border-0 !ring-0">
                {(compact) => <OverviewScreen copy={preview} compact={compact} />}
              </PsyWindow>
            </div>
          </motion.div>
        </div>

        <Floater className="start-2 bottom-[14%] hidden sm:block" delay={0.2}>
          <p className="flex items-center gap-2 text-[0.75rem] ">
            <BellRing className="size-4 text-red-300" aria-hidden />
            {alertMeta.split(" · ")[0]}
          </p>
          <p className="mt-1 w-[13rem] text-[0.75rem] leading-snug text-teal-100 rtl:leading-relaxed">{alertTitle}</p>
        </Floater>

        <Floater className="end-2 bottom-[6%] hidden sm:block" delay={0.4}>
          <p className="flex items-center gap-2 text-[0.75rem] ">
            <ShieldCheck className="size-4 text-gold-100" aria-hidden />
            {preview.shared}
          </p>
        </Floater>
      </div>
      <figcaption className="text-center text-[0.75rem] text-teal-100/80">{preview.caption}</figcaption>
    </figure>
  );
}

/**
 * The opening of the clinician workspace: a dark, centred stage, unlike /mira and /lumina's light split. The headline sits
 * over a hand of three app screens.
 */
export function PsyHero() {
  const { page, identity, config, primaryHref, heroPrimary } = useAgentPage("psy");

  return (
    <section
      aria-labelledby="agent-title"
      className="relative isolate overflow-hidden bg-[radial-gradient(70%_40rem_at_50%_0%,rgb(74_124_124/0.55),transparent_70%),linear-gradient(180deg,var(--color-teal-950)_0%,var(--color-teal-900)_100%)] pb-28 pt-12 text-white sm:pt-16 lg:pb-36 lg:pt-24"
    >
      <Grain />
      <div className="page-container">
        <motion.div variants={stagger(0.08)} initial="hidden" animate="show" className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <motion.div variants={fadeUp(0, 10)} className="flex flex-wrap items-center justify-center gap-3">
            <AgentAvatar agent="psy" className="size-12 rounded-2xl ring-1 ring-white/20" />
            <AgentStatusPill agent={config} label={identity.status} />
            <span className="text-[0.8125rem] font-medium text-teal-100">{identity.meta}</span>
          </motion.div>


          <h1 id="agent-title" className={cn(SERIF, "mt-6 text-[clamp(2.75rem,5vw+1rem,5.25rem)] font-light leading-[1.02] tracking-[-0.035em] text-white rtl:tracking-normal")}>
            <span className="block">
              <WordReveal>{page.hero.titleA}</WordReveal>
            </span>
            <span className="block">
              <WordReveal className={ACCENT_DARK} delay={0.12}>
                {page.hero.titleB}
              </WordReveal>
            </span>
          </h1>

          <motion.p variants={fadeUp()} className={cn(BODY, "mt-6 max-w-xl !text-teal-100")}>
            {page.hero.body}
          </motion.p>

          <motion.div variants={fadeUp(0, 14)} className="mt-9 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <Magnetic strength={0.12}>
              <PillLink href={primaryHref} tone="white">
                {heroPrimary}
              </PillLink>
            </Magnetic>
            <a
              href="#flow"
              className="group inline-flex min-h-11 items-center gap-2 rounded-md text-[0.9375rem]  text-teal-100 transition-colors duration-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-300"
            >
              <span className="home-link-line">{page.hero.secondary}</span>
              <ArrowDown className="size-4 transition-transform duration-300 ease-out-soft group-hover:translate-y-0.5" aria-hidden />
            </a>
          </motion.div>
        </motion.div>

        <Stage />

        <motion.div variants={fadeUp(0, 12)} initial="hidden" animate="show" className="mx-auto mt-6 max-w-xl">
          <StatsStrip stats={page.stats} tone="dark" />
        </motion.div>
      </div>
    </section>
  );
}
