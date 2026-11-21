"use client";

import { Magnetic, WordReveal } from "@/components/home/AnimationUtilities";
import { Grain } from "@/components/home/Atmosphere";
import { ACCENT_DARK, BODY, SERIF } from "@/components/home/typography";
import { AgentAvatar } from "@/components/layout/site-header";
import { EASE_OUT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { ArrowDown, BellRing, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { AgentStatusPill } from "../AgentStatusPill";
import { PillLink, StatsStrip, useAgentPage } from "../shared";
import { OverviewScreen, PatientScreen, ReportsScreen } from "./PsyScreens";
import { PsyWindow } from "./PsyWindow";

/** A glass chip that bobs gently around the stage. */
function Floater({ children, className, delay = 0, seconds = 7 }: { children: ReactNode; className?: string; delay?: number; seconds?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 1.2 + delay, ease: EASE_OUT }}
      className={cn("absolute z-20", className)}
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: seconds, repeat: Infinity, ease: "easeInOut", delay }}
        className="rounded-2xl border border-white/20 bg-white/[0.12] px-3.5 py-2.5 text-white shadow-[0_20px_40px_-20px_rgb(0_0_0/0.6)] backdrop-blur-xl"
      >
        {children}
      </motion.div>
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
 * The stage: three screens of the app fanned like a hand of cards, the main one lit by a slow ring of gold light. The whole
 * set leans towards the pointer, and a soft spotlight follows it across the glass.
 */
function Stage() {
  const { copy } = useAgentPage("psy");
  const preview = copy.psy.preview;
  const reduce = useReducedMotion();

  const px = useSpring(useMotionValue(0), { stiffness: 70, damping: 18 });
  const py = useSpring(useMotionValue(0), { stiffness: 70, damping: 18 });
  const rotateY = useTransform(px, [-1, 1], [-5, 5]);
  const rotateX = useTransform(py, [-1, 1], [4, -4]);
  const shiftX = useTransform(px, [-1, 1], [-14, 14]);
  const spotX = useTransform(px, [-1, 1], [15, 85]);
  const spotY = useTransform(py, [-1, 1], [15, 85]);
  const spot = useMotionTemplate`radial-gradient(34rem circle at ${spotX}% ${spotY}%, rgb(201 175 111 / 0.18), transparent 60%)`;

  const lean = (event: React.PointerEvent<HTMLElement>) => {
    if (reduce || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    px.set(((event.clientX - rect.left) / rect.width - 0.5) * 2);
    py.set(((event.clientY - rect.top) / rect.height - 0.5) * 2);
  };
  const settle = () => {
    px.set(0);
    py.set(0);
  };

  const [alertTitle, alertMeta] = preview.attention.items[0];

  return (
    <figure className="mx-auto mt-16 w-full max-w-5xl lg:mt-20" onPointerMove={lean} onPointerLeave={settle}>
      <div className="relative px-1 pb-10 pt-6 sm:px-6 sm:pb-14">
        <motion.span aria-hidden className="pointer-events-none absolute -inset-x-10 inset-y-0 -z-10 rounded-[3rem]" style={{ backgroundImage: spot }} />

        <motion.div style={reduce ? undefined : { rotateX, rotateY, x: shiftX, perspective: 1400, transformStyle: "preserve-3d" }} className="relative">
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
            {/* The ring of light: a gold comet circling the window's edge. */}
            <div className="relative overflow-hidden rounded-[2rem] p-[1.5px] shadow-[0_50px_100px_-40px_rgb(0_0_0/0.75),0_0_80px_-20px_rgb(127_176_174/0.45)]">
              <motion.span
                aria-hidden
                className="absolute -inset-[60%] bg-[conic-gradient(from_0deg,transparent_0deg,rgb(201_175_111/0.95)_55deg,transparent_110deg,transparent_200deg,rgb(127_176_174/0.9)_255deg,transparent_310deg)]"
                animate={reduce ? undefined : { rotate: 360 }}
                transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
              />
              <div className="relative rounded-[calc(2rem-1.5px)] bg-deep">
                <PsyWindow screen="overview" copy={preview} crop={640} className="!rounded-[calc(2rem-1.5px)] !border-0 !ring-0">
                  {(compact) => <OverviewScreen copy={preview} compact={compact} />}
                </PsyWindow>
                {/* A single pass of light across the glass, once the stage has settled. */}
                {!reduce && (
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 -start-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    initial={{ x: "-120%" }}
                    animate={{ x: "420%" }}
                    transition={{ duration: 1.6, delay: 1.5, ease: "easeInOut" }}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>

        <Floater className="start-2 top-[2%] hidden sm:block" delay={0.2} seconds={7}>
          <p className="flex items-center gap-2 text-[0.75rem] ">
            <BellRing className="size-4 text-red-300" aria-hidden />
            {alertMeta.split(" · ")[0]}
          </p>
          <p className="mt-1 max-w-[11rem] text-[0.6875rem] leading-snug text-teal-100">{alertTitle}</p>
        </Floater>

        <Floater className="end-2 bottom-[6%] hidden sm:block" delay={0.5} seconds={8}>
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
 * over a hand of three app screens, with a ring of gold light travelling around the one in front.
 */
export function PsyHero() {
  const { page, identity, config, primaryHref } = useAgentPage("psy");
  const reduce = useReducedMotion();

  return (
    <section
      aria-labelledby="agent-title"
      className="relative isolate overflow-hidden bg-[radial-gradient(70%_40rem_at_50%_0%,rgb(74_124_124/0.55),transparent_70%),linear-gradient(180deg,var(--color-teal-950)_0%,var(--color-teal-900)_100%)] pb-28 pt-12 text-white sm:pt-16 lg:pb-36 lg:pt-24"
    >
      <Grain />
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -top-32 start-[-10%] -z-10 size-[34rem] rounded-full bg-[radial-gradient(closest-side,rgb(127_176_174/0.35),transparent)]"
        animate={reduce ? undefined : { x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        aria-hidden
        className="pointer-events-none absolute bottom-[-8rem] end-[-6%] -z-10 size-[30rem] rounded-full bg-[radial-gradient(closest-side,rgb(201_175_111/0.28),transparent)]"
        animate={reduce ? undefined : { x: [0, -50, 0], y: [0, -26, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
      <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(rgb(255_255_255/0.05)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.05)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(60%_60%_at_50%_30%,#000,transparent)]" />

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
                {page.hero.primary}
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
