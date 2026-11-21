"use client";

import { Magnetic, WordReveal } from "@/components/home/AnimationUtilities";
import { Grain } from "@/components/home/Atmosphere";
import { ACCENT_LIGHT, BODY, SERIF } from "@/components/home/typography";
import { AgentAvatar } from "@/components/layout/site-header";
import { EASE_OUT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { ArrowDown, FileText, LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";
import { AgentStatusPill } from "../AgentStatusPill";
import { PillLink, StatsStrip, useAgentPage } from "../shared";
import { AppWindow } from "./AppWindow";
import { HomeScreen } from "./LuminaHome";

/** A glass chip beside the window: it fades in once, then stays still. */
function Floater({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 1.2 + delay, ease: EASE_OUT }}
      className={cn("absolute z-10", className)}
    >
      <motion.div
        className="rounded-2xl border border-white/80 bg-white/90 px-3.5 py-2.5 text-ink shadow-float backdrop-blur-md"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/** Lumina's own app in a window, leaning a few degrees towards the pointer, with three chips drifting around it. */
function HeroWindow() {
  const { copy } = useAgentPage("lumina");
  const preview = copy.lumina.preview;
  const reduce = useReducedMotion();

  const tiltX = useSpring(useMotionValue(0), { stiffness: 90, damping: 18 });
  const tiltY = useSpring(useMotionValue(0), { stiffness: 90, damping: 18 });
  const lean = (event: React.PointerEvent<HTMLElement>) => {
    if (reduce || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    tiltY.set(((event.clientX - rect.left) / rect.width - 0.5) * 8);
    tiltX.set(-((event.clientY - rect.top) / rect.height - 0.5) * 8);
  };
  const settle = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  return (
    <figure className="mx-auto w-full max-w-xl" onPointerMove={lean} onPointerLeave={settle}>
      <div className="relative py-8 sm:py-12">
        <motion.div initial={reduce ? false : { opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3, ease: EASE_OUT }} style={{ perspective: 1200 }}>
          <motion.div style={{ rotateX: tiltX, rotateY: tiltY }}>
            <AppWindow active={0}>
              <HomeScreen copy={preview} />
            </AppWindow>
          </motion.div>
        </motion.div>

        <Floater className="-start-1 top-1 sm:-start-6 sm:top-[3%]" delay={0.2}>
          <ul className="flex flex-wrap gap-1.5">
            {preview.views.journal.themes.map((theme) => (
              <li key={theme} className="inline-flex items-center gap-1 rounded-full bg-gold-50 px-2.5 py-1 text-[0.6875rem] rtl:text-[0.75rem]  text-gold-700 ring-1 ring-gold-100">
                <span className="size-1.5 rounded-full bg-gold" />
                {theme}
              </li>
            ))}
          </ul>
        </Floater>

        <Floater className="-end-1 top-[38%] hidden sm:block lg:-end-6" delay={0.7}>
          <p className="text-[0.6875rem] rtl:text-[0.75rem] font-medium text-ink-muted">{preview.views.trend.baseline}</p>
          <p className="mt-0.5 flex items-center gap-2 text-[0.8125rem]  text-ink">
            <span className="size-2 rounded-full bg-teal-500" />
            {preview.views.trend.verdict}
          </p>
        </Floater>

        <Floater className="-end-1 bottom-1 sm:-end-3 sm:bottom-[2%]" delay={0.4}>
          <p className="flex items-center gap-2 text-[0.75rem]  text-ink">
            <FileText className="size-4 text-gold-600" aria-hidden />
            {preview.views.report.title}
            <LockKeyhole className="size-3.5 text-teal-600" aria-hidden />
          </p>
          <p className="mt-1 text-[0.6875rem] rtl:text-[0.75rem] text-ink-muted">{preview.views.report.consent}</p>
        </Floater>
      </div>
      <figcaption className="text-center text-[0.75rem] text-ink-muted">{preview.caption}</figcaption>
    </figure>
  );
}

/** The opening, on the same light ground as /mira: the headline and three numbers beside Lumina's own app. */
export function LuminaHero() {
  const { page, identity, config, primaryHref } = useAgentPage("lumina");

  return (
    <section
      aria-labelledby="agent-title"
      className="relative isolate overflow-hidden bg-[radial-gradient(60%_44rem_at_0%_6%,rgb(230_213_170/0.4),transparent_70%),radial-gradient(48%_36rem_at_100%_22%,rgb(191_221_225/0.6),transparent_70%),linear-gradient(180deg,#ffffff_0%,var(--color-canvas)_100%)] pb-24 pt-10 sm:pt-14 lg:pb-32 lg:pt-20"
    >
      <Grain tone="light" />
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -top-24 start-[-8%] -z-10 size-[32rem] rounded-full bg-[radial-gradient(closest-side,rgb(230_213_170/0.5),transparent)]"
      />
      <motion.span
        aria-hidden
        className="pointer-events-none absolute bottom-[-6rem] end-[8%] -z-10 size-[28rem] rounded-full bg-[radial-gradient(closest-side,rgb(134_186_188/0.42),transparent)]"
      />

      <div className="page-container grid items-center gap-14 lg:grid-cols-12 lg:gap-8">
        <motion.div variants={stagger(0.08)} initial="hidden" animate="show" className="lg:col-span-5">
          <motion.div variants={fadeUp(0, 10)} className="flex flex-wrap items-center gap-3">
            <AgentAvatar agent="lumina" className="size-12 rounded-2xl ring-1 ring-line shadow-xs" />
            <AgentStatusPill agent={config} label={identity.status} />
            <span className="text-[0.8125rem] font-medium text-ink-muted">{identity.meta}</span>
          </motion.div>


          <h1 id="agent-title" className={cn(SERIF, "mt-6 text-[clamp(2.75rem,4.2vw+1rem,4.75rem)] font-light leading-[1.02] tracking-[-0.035em] text-ink rtl:tracking-normal")}>
            <span className="block">
              <WordReveal>{page.hero.titleA}</WordReveal>
            </span>
            <span className="block">
              <WordReveal className={ACCENT_LIGHT} delay={0.12}>
                {page.hero.titleB}
              </WordReveal>
            </span>
          </h1>

          <motion.p variants={fadeUp()} className={cn(BODY, "mt-6 max-w-lg")}>
            {page.hero.body}
          </motion.p>

          <motion.div variants={fadeUp(0, 14)} className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Magnetic strength={0.12}>
              <PillLink href={primaryHref}>{page.hero.primary}</PillLink>
            </Magnetic>
            <a
              href="#flow"
              className="group inline-flex min-h-11 items-center gap-2 rounded-md text-[0.9375rem]  text-teal-700 transition-colors duration-200 hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500"
            >
              <span className="home-link-line">{page.hero.secondary}</span>
              <ArrowDown className="size-4 transition-transform duration-300 ease-out-soft group-hover:translate-y-0.5" aria-hidden />
            </a>
          </motion.div>

          <motion.div variants={fadeUp(0, 12)} className="mt-12 max-w-md">
            <StatsStrip stats={page.stats} />
          </motion.div>
        </motion.div>

        <div className="lg:col-span-7">
          <HeroWindow />
        </div>
      </div>
    </section>
  );
}
