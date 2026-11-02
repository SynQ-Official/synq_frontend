"use client";

import { WordReveal } from "@/components/home/AnimationUtilities";
import { Grain } from "@/components/home/Atmosphere";
import { homeSerif } from "@/components/home/fonts";
import { ACCENT_LIGHT, BODY, BODY_SM, DISPLAY_L, DISPLAY_S, LABEL } from "@/components/home/typography";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { SiteHeader } from "@/components/layout/site-header";
import { EmergencyNote } from "@/components/legal/EmergencyNote";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { CONTACT } from "@/lib/config/brand";
import { ROUTES } from "@/lib/config/routes";
import { trustCopy, type TrustId } from "@/lib/i18n/trust";
import { REVEAL_VIEWPORT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ArrowRight, BadgeCheck, Check, Database, LifeBuoy, Lock, Mail, MapPin, Phone, ScrollText, ShieldCheck, type LucideIcon } from "lucide-react";
import { MotionConfig, motion, useScroll, useSpring } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TrustSeal } from "./TrustSeal";

const ICONS: Record<TrustId, LucideIcon> = {
  privacy: Lock,
  security: ShieldCheck,
  "responsible-ai": BadgeCheck,
  "data-handling": Database,
  terms: ScrollText,
  contact: Mail,
};

const reveal = {
  variants: fadeUp(0, 18),
  initial: "hidden",
  whileInView: "show",
  viewport: REVEAL_VIEWPORT,
} as const;

/** Only the details the company has actually provided are shown. */
export function ContactDetails({ labels }: { labels: { emailLabel: string; phoneLabel: string; addressLabel: string } }) {
  const rows = [
    { icon: Mail, label: labels.emailLabel, value: CONTACT.email, href: CONTACT.email ? `mailto:${CONTACT.email}` : undefined },
    { icon: Phone, label: labels.phoneLabel, value: CONTACT.phone, href: CONTACT.phone ? `tel:${CONTACT.phone.replace(/\s+/g, "")}` : undefined },
    { icon: MapPin, label: labels.addressLabel, value: CONTACT.address, href: undefined },
  ].filter((row) => row.value);
  if (rows.length === 0) return null;

  return (
    <dl className="mt-6 grid gap-4 sm:grid-cols-2">
      {rows.map(({ icon: Icon, label, value, href }) => (
        <div key={label} className="flex items-start gap-3">
          <Icon className="mt-1 size-4 shrink-0 text-teal-700" aria-hidden />
          <div className="min-w-0">
            <dt className="text-[0.8125rem] text-ink-muted">{label}</dt>
            <dd className="text-[1rem] font-medium text-ink" dir="auto">
              {href ? (
                <a href={href} className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500">
                  {value}
                </a>
              ) : (
                value
              )}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

/** Which section is being read: drives the highlighted entry of the index. */
function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState(ids[0] ?? "");
  useEffect(() => {
    const nodes = ids.map((id) => document.getElementById(id)).filter((node): node is HTMLElement => node !== null);
    if (nodes.length === 0 || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-25% 0px -60% 0px" },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

/** /trust — how patient information is protected, in plain words. Trust is part of the product, so it has its own page. */
export function TrustPage() {
  const { language, direction } = useLanguage();
  const copy = trustCopy[language];
  const lead = copy.titleA;
  const sectionIds = useMemo(() => copy.sections.map((section) => section.id), [copy.sections]);
  const active = useActiveSection(sectionIds);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });

  return (
    <MotionConfig reducedMotion="user">
      <div dir={direction} className={cn(homeSerif.variable, "relative isolate flex min-h-dvh flex-col overflow-x-clip bg-canvas text-ink")}>
        <div aria-hidden className="canvas-glow pointer-events-none absolute inset-0 -z-10" />
        <Grain tone="light" />

        {/* A hairline that fills as the page is read. */}
        <motion.span aria-hidden style={{ scaleX: progress }} className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gold rtl:origin-right" />

        <SiteHeader variant="public" />

        <main className="page-container flex-1 pb-20 pt-10 sm:pt-14 lg:pb-28 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <motion.header variants={stagger(0.08)} initial="hidden" animate="show" className="lg:col-span-7">
            <motion.p variants={fadeUp()} className={cn(LABEL, "flex items-center gap-3 text-teal-700")}>
              <span aria-hidden className="h-px w-8 bg-gold" />
              {copy.eyebrow}
            </motion.p>
            <h1 aria-label={`${copy.titleA} ${copy.titleB}`} className={cn(DISPLAY_L, "mt-6 text-ink")}>
              <span aria-hidden>
                <WordReveal delay={0.1}>{lead}</WordReveal>{" "}
                <WordReveal className={ACCENT_LIGHT} delay={0.1 + lead.split(" ").length * 0.055 + 0.1}>
                  {copy.titleB}
                </WordReveal>
              </span>
            </h1>
            <motion.p variants={fadeUp(0.2)} className={cn(BODY, "mt-7 max-w-2xl")}>
              {copy.intro}
            </motion.p>
            <motion.p variants={fadeUp(0.25)} className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-teal-200 bg-white px-4 py-2 text-[0.9375rem] font-medium text-teal-800 transition-[border-color,box-shadow,transform] duration-300 ease-out-soft hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-[var(--shadow-soft-hover)]">
              <ShieldCheck className="size-4 shrink-0 text-teal-700" aria-hidden />
              {copy.principle}
            </motion.p>
          </motion.header>
          <div className="lg:col-span-5">
            <TrustSeal ids={sectionIds} icons={ICONS} titles={copy.sections.map((section) => section.title)} active={active as TrustId} />
          </div>
          </div>

          <div className="mt-14 grid gap-10 lg:mt-20 lg:grid-cols-12 lg:gap-12">
            <nav aria-label={copy.eyebrow} className="lg:col-span-3">
              <ul className="flex flex-wrap gap-2 lg:sticky lg:top-28 lg:flex-col lg:gap-1">
                {copy.sections.map((section) => {
                  const current = active === section.id;
                  return (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        aria-current={current ? "location" : undefined}
                        className={cn(
                          "group relative inline-flex min-h-10 items-center gap-2.5 rounded-full border px-4 text-[0.9375rem] font-medium transition-[background-color,border-color,color,transform] duration-300 ease-out-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 lg:rounded-md lg:border-transparent lg:bg-transparent lg:ps-3 lg:hover:translate-x-0.5 rtl:lg:hover:-translate-x-0.5",
                          current ? "border-teal-300 bg-teal-50 text-teal-900" : "border-line-strong bg-white text-ink-soft hover:border-teal-300 hover:text-teal-800",
                        )}
                      >
                        <span aria-hidden className={cn("hidden h-4 w-0.5 rounded-full bg-gold transition-transform duration-500 ease-out-soft lg:block", current ? "scale-y-100" : "scale-y-0")} />
                        {section.title}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="space-y-6 lg:col-span-9">
              {copy.sections.map((section) => {
                const Icon = ICONS[section.id];
                return (
                  <motion.section
                    key={section.id}
                    id={section.id}
                    aria-labelledby={`${section.id}-title`}
                    {...reveal}
                    className="group/card scroll-mt-28 rounded-panel border border-line bg-white p-6 shadow-[var(--shadow-soft)] transition-[border-color,box-shadow,transform] duration-500 ease-out-soft hover:-translate-y-1 hover:border-teal-200 hover:shadow-[var(--shadow-soft-hover)] sm:p-9"
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 transition-[background-color,color,transform] duration-500 ease-out-soft group-hover/card:-rotate-6 group-hover/card:scale-105 group-hover/card:bg-teal-700 group-hover/card:text-white">
                        <Icon className="size-5" strokeWidth={1.5} aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <h2 id={`${section.id}-title`} className={cn(DISPLAY_S, "text-ink")}>
                          {section.title}
                        </h2>
                        <p className={cn(BODY_SM, "mt-1.5")}>{section.summary}</p>
                      </div>
                    </div>

                    {section.points.length > 0 ? (
                      <motion.ul variants={stagger(0.07, 0.1)} initial="hidden" whileInView="show" viewport={REVEAL_VIEWPORT} className="mt-7 space-y-1 border-t border-line pt-5">
                        {section.points.map((point) => (
                          <motion.li
                            key={point}
                            variants={fadeUp(0, 12)}
                            className="group/point -mx-3 flex items-start gap-3 rounded-xl px-3 py-2.5 text-[1rem] leading-7 text-ink-soft transition-[background-color,color] duration-300 ease-out-soft hover:bg-teal-50/70 hover:text-ink"
                          >
                            <span aria-hidden className="mt-1.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700 transition-[background-color,color,transform] duration-300 ease-out-soft group-hover/point:scale-110 group-hover/point:bg-teal-700 group-hover/point:text-white">
                              <Check className="size-3" strokeWidth={2.75} />
                            </span>
                            {point}
                          </motion.li>
                        ))}
                      </motion.ul>
                    ) : null}

                    {section.id === "security" ? <EmergencyNote className="mt-6" /> : null}

                    {section.id === "contact" ? (
                      <>
                        <ContactDetails labels={copy.contact} />
                        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
                          <Button asChild size="lg" className="group min-h-12 px-7 shadow-brand">
                            <Link href={ROUTES.support}>
                              {copy.contact.formCta}
                              <ArrowRight className="transition-transform duration-300 ease-out-soft group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden />
                            </Link>
                          </Button>
                          <span className="text-[0.875rem] text-ink-muted">{copy.contact.formHint}</span>
                        </div>
                        <p role="note" className="mt-7 flex items-start gap-3 rounded-2xl border border-gold-100 bg-gold-50 p-4 text-[0.9375rem] leading-6 text-ink-soft">
                          <LifeBuoy className="mt-0.5 size-5 shrink-0 text-gold-700" strokeWidth={1.5} aria-hidden />
                          {copy.contact.urgent}
                        </p>
                      </>
                    ) : null}
                  </motion.section>
                );
              })}
            </div>
          </div>

          <p className="mt-12">
            <Link href={ROUTES.home} className="inline-flex min-h-10 items-center gap-2 rounded-md text-[0.9375rem] font-semibold text-teal-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500">
              <ArrowRight className="size-4 rotate-180 rtl:rotate-0" aria-hidden />
              <span className="home-link-line">{copy.backHome}</span>
            </Link>
          </p>
        </main>

        <MinimalFooter showLanguage={false} className="border-t border-line-strong/60" />
      </div>
    </MotionConfig>
  );
}
