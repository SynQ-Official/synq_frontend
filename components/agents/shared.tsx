"use client";

import { Magnetic, WordReveal } from "@/components/home/AnimationUtilities";
import { Grain } from "@/components/home/Atmosphere";
import { homeSerif } from "@/components/home/fonts";
import { Footer } from "@/components/home/Footer";
import { CURTAIN, HomeSection } from "@/components/home/HomeSection";
import { SectionHeader } from "@/components/home/SectionHeader";
import { BODY_SM, DISPLAY_M, LABEL, SERIF } from "@/components/home/typography";
import { AGENTS, AgentAvatar, SiteHeader, type AgentId } from "@/components/layout/site-header";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useLanguageTransition } from "@/hooks/useLanguageTransition";
import { PSY_APP_URL, agentEntryHref } from "@/lib/config/routes";
import { agentPagesCopy } from "@/lib/i18n/agents";
import { REVEAL_VIEWPORT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { MotionConfig, motion } from "framer-motion";
import { ArrowRight, Check, ShieldCheck, X } from "lucide-react";
import { LocaleLink as Link } from "@/components/shared/LocaleLink";
import type { ReactNode } from "react";

const OTHER: Record<AgentId, AgentId> = { mira: "lumina", lumina: "mira", psy: "lumina" };
const ARROW = "size-4 transition-transform duration-300 ease-out-soft group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5";

/** Everything a page needs about its agent: copy in the visitor's language, identity, tokens and where the button leads. */
export function useAgentPage(agent: AgentId) {
  const { dictionary, language } = useLanguage();
  const { signedIn } = useAuthSession();
  const copy = agentPagesCopy[language];
  // Without the clinician app's URL the button opens the access form: its label must say so.
  const requestAccess = agent === "psy" && !PSY_APP_URL;
  return {
    copy,
    page: copy[agent],
    heroPrimary: requestAccess ? copy.psy.requestAccess : copy[agent].hero.primary,
    ctaPrimary: requestAccess ? copy.psy.requestAccess : copy[agent].cta.primary,
    identity: dictionary.header.agents.items[agent],
    config: AGENTS.find((candidate) => candidate.id === agent)!,
    primaryHref: agentEntryHref(agent, signedIn),
  };
}

/** The header, the page's content and the footer, with the home page's smooth scroll and language re-settle. */
export function AgentShell({ children }: { children: ReactNode }) {
  const { direction } = useLanguage();
  const contentRef = useLanguageTransition<HTMLElement>();

  return (
    <MotionConfig reducedMotion="user">
      <div dir={direction} className={cn(homeSerif.variable, "home-page relative flex min-h-dvh flex-col overflow-x-clip bg-white text-ink selection:bg-teal-200 selection:text-ink")}>
        <SmoothScrollProvider>
          <SiteHeader variant="public" />
          <main ref={contentRef} className="flex-1">
            {children}
          </main>
          <Footer />
        </SmoothScrollProvider>
      </div>
    </MotionConfig>
  );
}

/** The pill button of the header and the home page: a label and a round arrow that warms to gold on hover. */
export function PillLink({ href, children, tone = "ink" }: { href: string; children: string; tone?: "ink" | "white" }) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex min-h-14 items-center gap-3 rounded-full py-1.5 ps-7 pe-1.5 text-[0.9375rem]  transition-[background-color,transform] duration-300 ease-out-soft active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2",
        tone === "ink"
          ? "bg-ink text-white shadow-[0_14px_30px_-14px_rgb(17_76_97/0.7)] hover:bg-teal-800 focus-visible:outline-teal-500"
          : "bg-white text-ink shadow-[0_18px_36px_-18px_rgb(0_0_0/0.6)] hover:bg-gold-100 focus-visible:outline-gold-300",
      )}
    >
      {children}
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-full transition-[background-color,color] duration-300",
          tone === "ink" ? "bg-white/15 group-hover:bg-gold group-hover:text-ink" : "bg-ink text-white group-hover:bg-teal-800",
        )}
      >
        <ArrowRight className={ARROW} aria-hidden />
      </span>
    </Link>
  );
}

/** Three numbers that say the most: a serif figure over a small label, hairlines between. */
export function StatsStrip({ stats, tone = "light", className }: { stats: readonly (readonly [string, string])[]; tone?: "light" | "dark"; className?: string }) {
  const dark = tone === "dark";
  return (
    <dl className={cn("grid grid-cols-3", className)}>
      {stats.map(([value, label], index) => (
        <div key={label} className={cn("min-w-0", index > 0 && cn("border-s ps-4 sm:ps-7", dark ? "border-white/20" : "border-line-strong"))}>
          <dd dir="ltr" className={cn(SERIF, "text-[clamp(2rem,2vw+1.25rem,3.25rem)] font-light leading-none tracking-[-0.03em] tabular-nums rtl:text-end", dark ? "text-white" : "text-ink")}>
            {value}
          </dd>
          <dt className={cn("mt-2 text-[0.8125rem] leading-snug sm:text-[0.875rem]", dark ? "text-teal-100" : "text-ink-soft")}>{label}</dt>
        </div>
      ))}
    </dl>
  );
}

function ChipPanel({ yes, title, items, surface }: { yes: boolean; title: string; items: readonly string[]; surface: string }) {
  const Icon = yes ? Check : X;
  return (
    <motion.div variants={fadeUp(0, 22)} className={cn("rounded-panel border p-6 sm:p-8", surface, yes ? "border-teal-200" : "border-rose-100")}>
      <h3 className={cn(LABEL, yes ? "text-teal-700" : "text-rose-700")}>{title}</h3>
      <motion.ul variants={stagger(0.05, 0.12)} className="mt-5 flex flex-wrap gap-2.5">
        {items.map((item) => (
          <motion.li
            key={item}
            variants={fadeUp(0, 10)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border py-2 ps-2.5 pe-4 text-[0.9375rem] font-medium",
              yes ? "border-teal-200 bg-teal-50/70 text-teal-900" : "border-rose-100 bg-rose-50/70 text-rose-700",
            )}
          >
            <span className={cn("flex size-5 items-center justify-center rounded-full", yes ? "bg-teal-600 text-white" : "bg-rose-700/90 text-white")}>
              <Icon className="size-3" strokeWidth={3} aria-hidden />
            </span>
            {item}
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>
  );
}

/** Clear boundaries as two panels of chips — what the agent does, what she never does — then the other agent. */
export function Boundaries({ agent, counter, tone = "tint" }: { agent: AgentId; counter?: string; tone?: "tint" | "base" }) {
  const { page } = useAgentPage(agent);
  const { trust, handoff } = page;
  const otherId = OTHER[agent];
  const other = AGENTS.find((candidate) => candidate.id === otherId)!;

  return (
    <HomeSection id="trust" labelledBy="trust-title" tone={tone}>
      <SectionHeader variant="editorial" id="trust-title" counter={counter} eyebrow={trust.eyebrow} titleA={trust.titleA} titleB={trust.titleB} />
      <motion.div variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={REVEAL_VIEWPORT} className="mt-12 lg:mt-16">
        <div className="grid gap-4 md:grid-cols-2 lg:gap-5">
          <ChipPanel yes title={trust.doesTitle} items={trust.does} surface={tone === "base" ? "bg-canvas" : "bg-white"} />
          <ChipPanel yes={false} title={trust.doesNotTitle} items={trust.doesNot} surface={tone === "base" ? "bg-canvas" : "bg-white"} />
        </div>
        <motion.p variants={fadeUp(0, 10)} className="mt-6 flex items-start gap-3 text-[0.9375rem] leading-7 text-ink-soft">
          <ShieldCheck className="mt-1 size-4 shrink-0 text-teal-600" aria-hidden />
          {trust.note}
        </motion.p>

        <motion.div variants={fadeUp(0, 24)} className="mt-6 lg:mt-8">
          <Link
            href={other.href}
            className={cn(
              "group relative isolate flex flex-wrap items-center gap-x-5 gap-y-4 overflow-hidden rounded-[2rem] border p-5 outline-none transition-[transform,border-color,box-shadow] duration-500 ease-out-soft hover:-translate-y-1 hover:shadow-soft-hover focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 sm:gap-7 sm:p-8",
              other.tone.surface,
              other.tone.border,
            )}
          >
            <span aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-700 ease-out-soft group-hover:opacity-100", other.tone.wash)} />
            <span aria-hidden className={cn("pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r", other.tone.edge)} />
            <AgentAvatar agent={otherId} className="order-1 size-16 shrink-0 rounded-3xl bg-white/80 ring-1 ring-white transition-transform duration-500 ease-out-soft motion-safe:group-hover:scale-105 sm:size-20" />
            <div className="order-3 min-w-0 basis-full sm:order-2 sm:basis-0 sm:flex-1">
              <p className={cn(LABEL, other.tone.text)}>{handoff.eyebrow}</p>
              <p className={cn(DISPLAY_M, "mt-2 text-ink")}>{handoff.title}</p>
              <p className={cn(BODY_SM, "mt-2 text-[1rem]")}>{handoff.body}</p>
            </div>
            <span className={cn("order-3 hidden shrink-0 items-center gap-3 text-[0.9375rem]  sm:inline-flex", other.tone.text)}>
              {handoff.cta}
            </span>
            <span className={cn("order-2 ms-auto flex size-12 shrink-0 items-center justify-center rounded-full transition-colors duration-300 sm:order-4 sm:ms-0", other.tone.arrow)} aria-hidden>
              <ArrowRight className="size-5 transition-transform duration-300 ease-out-soft group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
            </span>
            <span className="sr-only sm:hidden">{handoff.cta}</span>
          </Link>
        </motion.div>
      </motion.div>
    </HomeSection>
  );
}

/** The last word of a page: a big two-line title, one line, the button, three reassurances. */
export function Closing({ agent, tone }: { agent: AgentId; tone: "deep" | "champagne" }) {
  const { page, primaryHref, ctaPrimary } = useAgentPage(agent);
  const { cta } = page;
  const deep = tone === "deep";

  return (
    <section
      id="start"
      aria-labelledby="start-title"
      className={cn(
        "relative isolate overflow-hidden pb-24 pt-28 md:pb-32 md:pt-40",
        CURTAIN,
        deep ? "bg-deep text-white" : "bg-[linear-gradient(180deg,var(--color-gold-50),#f3e8c6)] text-ink",
      )}
    >
      {deep ? <Grain /> : <Grain tone="light" />}
      <span aria-hidden className={cn("pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent", deep ? "via-gold" : "via-gold-600/50")} />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -bottom-[38rem] start-1/2 -z-10 size-[64rem] -translate-x-1/2 rounded-full rtl:translate-x-1/2",
          deep
            ? "bg-[radial-gradient(closest-side,rgb(230_213_170/0.4),rgb(201_175_111/0.16)_50%,transparent_72%)]"
            : "bg-[radial-gradient(closest-side,rgb(134_186_188/0.4),rgb(134_186_188/0.14)_50%,transparent_72%)]",
        )}
      />
      <div className="page-container">
        <motion.div variants={stagger(0.09, 0.05)} initial="hidden" whileInView="show" viewport={REVEAL_VIEWPORT} className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <h2 id="start-title" className={cn(SERIF, "mt-8 text-[clamp(3rem,6.6vw+0.5rem,7rem)] font-light leading-[0.98] tracking-[-0.04em] rtl:tracking-normal", deep ? "text-white" : "text-ink")}>
            <span className="block">
              <WordReveal>{cta.titleA}</WordReveal>
            </span>
            <span className="block">
              <WordReveal className={deep ? " text-white" : " text-teal-900"} delay={0.15}>
                {cta.titleB}
              </WordReveal>
            </span>
          </h2>
          <motion.p variants={fadeUp()} className={cn("mt-7 max-w-md text-[clamp(1.0625rem,0.3vw+1rem,1.25rem)] leading-[1.75]", deep ? "text-teal-100" : "text-ink-soft")}>
            {cta.body}
          </motion.p>
          <motion.div variants={fadeUp(0, 18)} className="mt-10">
            <Magnetic strength={0.12}>
              <PillLink href={primaryHref} tone={deep ? "white" : "ink"}>
                {ctaPrimary}
              </PillLink>
            </Magnetic>
          </motion.div>
          <motion.ul variants={fadeUp(0, 10)} className={cn("mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[0.9375rem]", deep ? "text-white/90" : "text-ink-soft")}>
            {cta.benefits.map((text) => (
              <li key={text} className="flex items-center gap-2.5">
                <Check className={cn("size-4", deep ? "text-gold-300" : "text-gold-600")} aria-hidden />
                {text}
              </li>
            ))}
          </motion.ul>
        </motion.div>
      </div>
    </section>
  );
}
