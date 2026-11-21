"use client";

import { Magnetic, WordReveal } from "@/components/home/AnimationUtilities";
import { Grain } from "@/components/home/Atmosphere";
import { ACCENT_LIGHT, BODY, SERIF } from "@/components/home/typography";
import { AgentAvatar } from "@/components/layout/site-header";
import { fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { AgentStatusPill } from "../AgentStatusPill";
import { PhoneFrame } from "../frames";
import { PillLink, StatsStrip, useAgentPage } from "../shared";
import { ChatScreen } from "./MiraScreens";

/** A glass chip that bobs gently beside the phone. */
function Floater({ children, className, delay = 0, seconds = 6, dot }: { children: ReactNode; className?: string; delay?: number; seconds?: number; dot?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.8 + delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn("absolute z-10", className)}
    >
      <motion.span
        animate={reduce ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: seconds, repeat: Infinity, ease: "easeInOut", delay }}
        className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/80 bg-white/85 px-3.5 py-2 text-[0.8125rem]  text-ink shadow-float backdrop-blur-md"
      >
        {dot ? <span className={cn("size-2 rounded-full", dot)} /> : null}
        {children}
      </motion.span>
    </motion.div>
  );
}

/** The opening: the headline and three numbers, beside a phone with the conversation, ringed by the tools she uses. */
export function MiraHero() {
  const { page, copy, identity, config, primaryHref } = useAgentPage("mira");
  const preview = copy.mira.preview;
  const reduce = useReducedMotion();

  return (
    <section
      aria-labelledby="agent-title"
      className="relative isolate overflow-hidden bg-[radial-gradient(60%_44rem_at_0%_6%,rgb(191_221_225/0.65),transparent_70%),radial-gradient(48%_36rem_at_100%_22%,rgb(230_213_170/0.36),transparent_70%),linear-gradient(180deg,#ffffff_0%,var(--color-canvas)_100%)] pb-28 pt-10 sm:pt-14 lg:pb-36 lg:pt-20"
    >
      <Grain tone="light" />
      {/* Slow aurora behind the phone */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -top-20 end-[-8%] -z-10 size-[34rem] rounded-full bg-[radial-gradient(closest-side,rgb(134_186_188/0.45),transparent)]"
        animate={reduce ? undefined : { x: [0, -40, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        aria-hidden
        className="pointer-events-none absolute bottom-[-6rem] start-[30%] -z-10 size-[26rem] rounded-full bg-[radial-gradient(closest-side,rgb(230_213_170/0.5),transparent)]"
        animate={reduce ? undefined : { x: [0, 50, 0], y: [0, -26, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="page-container grid items-center gap-16 lg:grid-cols-12 lg:gap-8">
        <motion.div variants={stagger(0.08)} initial="hidden" animate="show" className="lg:col-span-6">
          <motion.div variants={fadeUp(0, 10)} className="flex flex-wrap items-center gap-3">
            <AgentAvatar agent="mira" className="size-12 rounded-2xl ring-1 ring-line shadow-xs" />
            <AgentStatusPill agent={config} label={identity.status} />
            <span className="text-[0.8125rem] font-medium text-ink-muted">{identity.meta}</span>
          </motion.div>


          <h1 id="agent-title" className={cn(SERIF, "mt-6 text-[clamp(2.75rem,4.6vw+1rem,5rem)] font-light leading-[1.02] tracking-[-0.035em] text-ink rtl:tracking-normal")}>
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

        <figure className="mx-auto w-full max-w-lg lg:col-span-6">
          <div aria-hidden className="relative flex items-center justify-center py-10 sm:py-14">
            {/* Rings that breathe around the phone */}
            {["62%", "84%", "108%"].map((size, index) => (
              <motion.span
                key={size}
                className="absolute start-1/2 top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-200/80 rtl:translate-x-1/2"
                style={{ width: size }}
                animate={reduce ? undefined : { scale: [1, 1.04, 1], opacity: [0.9, 0.45, 0.9] }}
                transition={{ duration: 7 + index * 1.5, repeat: Infinity, ease: "easeInOut", delay: index * 0.8 }}
              />
            ))}

            <motion.div initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }} className="relative">
              <PhoneFrame className="w-[min(17rem,70vw)]">
                <ChatScreen copy={preview} />
              </PhoneFrame>
            </motion.div>

            <Floater className="start-0 top-1 sm:top-[7%]" dot="bg-teal-500" seconds={6}>
              {preview.tools[0]}
            </Floater>
            <Floater className="end-0 top-[30%] hidden sm:block" dot="bg-gold" delay={0.6} seconds={7}>
              {preview.tools[1]}
            </Floater>
            <Floater className="start-[2%] bottom-[26%] hidden sm:block" dot="bg-sage" delay={1.1} seconds={6.5}>
              {preview.tools[2]}
            </Floater>
            <Floater className="end-0 bottom-0 sm:end-[2%] sm:bottom-[7%]" delay={0.3} seconds={7.5}>
              <ShieldCheck className="size-4 text-sage-700" />
              {preview.safetyChip}
            </Floater>
          </div>
          <figcaption className="text-center text-[0.75rem] text-ink-muted">{preview.caption}</figcaption>
        </figure>
      </div>
    </section>
  );
}
