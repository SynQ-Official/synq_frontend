"use client";

import { Grain } from "@/components/home/Atmosphere";
import { homeSerif } from "@/components/home/fonts";
import { BODY, DISPLAY_L, DISPLAY_M, DISPLAY_S } from "@/components/home/typography";
import { EmergencyNumbers } from "@/components/help/EmergencyNumbers";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { LEGAL } from "@/config/legal";
import { useLanguage } from "@/contexts/LanguageContext";
import { CONTACT } from "@/lib/config/brand";
import { ROUTES } from "@/lib/config/routes";
import { legalDocuments, legalUi, type LegalFact, type LegalSection } from "@/lib/i18n/legal";
import { trustCopy } from "@/lib/i18n/trust";
import { REVEAL_VIEWPORT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ArrowRight, BadgeCheck, Check, Database, FileText, LifeBuoy, Lock, Mail, MapPin, Phone, Scale, ScrollText, ShieldCheck, type LucideIcon } from "lucide-react";
import { MotionConfig, motion, useScroll, useSpring } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PendingLegalField } from "./PendingLegalField";
import { TrustSeal } from "./TrustSeal";

/** The seal around the hero: the sections a reader looks for first. */
const SEAL: Record<string, LucideIcon> = {
  "privacy-who-sees": Lock,
  "privacy-ai": BadgeCheck,
  "privacy-collect": Database,
  "privacy-security": ShieldCheck,
  "privacy-rights": Scale,
  "terms-scope": ScrollText,
  "privacy-contact": Mail,
};

const reveal = { variants: fadeUp(0, 18), initial: "hidden", whileInView: "show", viewport: REVEAL_VIEWPORT } as const;

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

/** Which section is being read: drives the highlighted entry of the index and the seal. */
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

function factValue(fact: LegalFact): string | null {
  const value = LEGAL[fact];
  return Array.isArray(value) ? (value.length ? value.join(", ") : null) : (value as string | null);
}

/** A fact from config/legal.ts, or the pending line when it is still null. */
function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="py-2.5">
      {value === null ? (
        <PendingLegalField label={label} />
      ) : (
        <p className="text-base leading-7 text-ink">
          <span className="">{label}: </span>
          <span dir="auto">{value}</span>
        </p>
      )}
    </div>
  );
}

function SectionCard({ section }: { section: LegalSection }) {
  const { language } = useLanguage();
  const ui = legalUi[language];
  const trust = trustCopy[language];
  const training = LEGAL.journalsUsedForModelTraining;

  return (
    <motion.section id={section.id} aria-labelledby={`${section.id}-title`} {...reveal} className="scroll-mt-28 rounded-panel border border-line bg-white p-6 shadow-[var(--shadow-soft)] sm:p-9">
      <h3 id={`${section.id}-title`} className={cn(DISPLAY_S, "text-ink")}>
        {section.title}
      </h3>

      {section.points.length > 0 ? (
        <motion.ul variants={stagger(0.07, 0.1)} initial="hidden" whileInView="show" viewport={REVEAL_VIEWPORT} className="mt-5 space-y-1 border-t border-line pt-5">
          {section.points.map((point) => (
            <motion.li key={point} variants={fadeUp(0, 12)} className="flex items-start gap-3 py-2 text-base leading-7 text-ink-soft">
              <span aria-hidden className="mt-1.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                <Check className="size-3" strokeWidth={2.75} />
              </span>
              {point}
            </motion.li>
          ))}
        </motion.ul>
      ) : null}

      {section.facts || section.retention || section.pending ? (
        <div className={cn("mt-5", section.points.length > 0 ? "" : "border-t border-line pt-3")}>
          {section.facts?.map((fact) => <Fact key={fact} label={ui.facts[fact]} value={factValue(fact)} />)}
          {section.retention ? LEGAL.retentionPeriods.map(({ category, period }) => <Fact key={category} label={ui.retention[category]} value={period} />) : null}
          {section.pending ? <Fact label={section.pending} value={null} /> : null}
        </div>
      ) : null}

      {/* Shown only once the legal owner has answered it: either answer, stated wrongly, would mislead. */}
      {section.training && training !== null ? <p className="mt-4 text-base font-medium leading-7 text-ink">{training ? ui.training.yes : ui.training.no}</p> : null}

      {section.emergency ? <EmergencyNumbers language={language} className="mt-6" /> : null}

      {section.contact ? (
        <>
          <ContactDetails labels={trust.contact} />
          {CONTACT.email ? null : <Fact label={trust.contact.emailLabel} value={null} />}
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Button asChild size="lg" className="group min-h-12 px-7 shadow-brand">
              <Link href={ROUTES.support}>
                {trust.contact.formCta}
                <ArrowRight className="transition-transform duration-300 ease-out-soft group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden />
              </Link>
            </Button>
            <span className="text-sm text-ink-muted">{trust.contact.formHint}</span>
          </div>
        </>
      ) : null}
    </motion.section>
  );
}

/**
 * /privacy: "Privacy Policy & Terms of Use". Two separate documents on one page, anchored #privacy and #terms (/terms
 * redirects to #terms). Facts come from config/legal.ts; anything not confirmed shows "To be confirmed before launch".
 */
export function PrivacyPage() {
  const { language, direction } = useLanguage();
  const ui = legalUi[language];
  const trust = trustCopy[language];
  const docs = legalDocuments[language];
  const sectionIds = useMemo(() => docs.flatMap((doc) => doc.sections.map((section) => section.id)), [docs]);
  const active = useActiveSection(sectionIds);
  const sealIds = Object.keys(SEAL);
  const sealTitles = sealIds.map((id) => docs.flatMap((doc) => doc.sections).find((section) => section.id === id)!.title);
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
              <motion.h1 variants={fadeUp(0.05)} className={cn(DISPLAY_L, "mt-6 text-balance text-ink")}>
                {ui.title}
              </motion.h1>
              <motion.p variants={fadeUp(0.15)} className={cn(BODY, "mt-7 max-w-2xl")}>
                {ui.intro}
              </motion.p>
              <motion.dl variants={fadeUp(0.2)} className="mt-6 flex flex-wrap items-start gap-3">
                {[
                  [ui.version, LEGAL.version],
                  [ui.lastUpdated, LEGAL.lastUpdated],
                ].map(([label, value]) =>
                  value ? (
                    <div key={label} className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white px-4 py-2 text-[0.9375rem]">
                      <FileText className="size-4 text-teal-700" aria-hidden />
                      <dt className="text-ink-soft">{label}:</dt>
                      <dd className=" text-ink" dir="ltr">{value}</dd>
                    </div>
                  ) : (
                    <div key={label}>
                      <dt className="sr-only">{label}</dt>
                      <dd>
                        <PendingLegalField label={label ?? ""} />
                      </dd>
                    </div>
                  ),
                )}
              </motion.dl>
              <motion.p variants={fadeUp(0.25)} className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-teal-200 bg-white px-4 py-2 text-[0.9375rem] font-medium text-teal-800">
                <ShieldCheck className="size-4 shrink-0 text-teal-700" aria-hidden />
                {trust.principle}
              </motion.p>
            </motion.header>
            <div className="lg:col-span-5">
              <TrustSeal ids={sealIds} icons={SEAL} titles={sealTitles} active={active} />
            </div>
          </div>

          <div className="mt-14 grid gap-10 lg:mt-20 lg:grid-cols-12 lg:gap-12">
            <nav aria-label={ui.contents} className="lg:col-span-3">
              <div className="space-y-6 lg:sticky lg:top-28">
                {docs.map((doc) => (
                  <div key={doc.id}>
                    <a href={`#${doc.id}`} className="inline-flex min-h-10 items-center rounded-md text-[0.8125rem] uppercase tracking-[0.12em] text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 rtl:tracking-normal">
                      {doc.title}
                    </a>
                    <ul className="mt-1 flex flex-wrap gap-2 lg:flex-col lg:gap-0.5">
                      {doc.sections.map((section) => {
                        const current = active === section.id;
                        return (
                          <li key={section.id}>
                            <a
                              href={`#${section.id}`}
                              aria-current={current ? "location" : undefined}
                              className={cn(
                                "inline-flex min-h-10 items-center gap-2.5 rounded-full border px-4 text-[0.9375rem] font-medium transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 lg:rounded-md lg:border-transparent lg:bg-transparent lg:ps-3",
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
                  </div>
                ))}
              </div>
            </nav>

            <div className="space-y-16 lg:col-span-9">
              {docs.map((doc) => (
                <article key={doc.id} id={doc.id} aria-labelledby={`${doc.id}-title`} className="scroll-mt-28">
                  <h2 id={`${doc.id}-title`} className={cn(DISPLAY_M, "text-ink")}>
                    {doc.title}
                  </h2>
                  <div className="mt-6 space-y-6">
                    {doc.sections.map((section) => (
                      <SectionCard key={section.id} section={section} />
                    ))}
                  </div>
                </article>
              ))}

              <p role="note" className="flex items-start gap-3 rounded-2xl border border-gold-100 bg-gold-50 p-4 text-[0.9375rem] leading-6 text-ink-soft">
                <LifeBuoy className="mt-0.5 size-5 shrink-0 text-gold-700" strokeWidth={1.5} aria-hidden />
                {trust.contact.urgent}
              </p>
            </div>
          </div>

          <p className="mt-12">
            <Link href={ROUTES.home} className="inline-flex min-h-10 items-center gap-2 rounded-md text-[0.9375rem]  text-teal-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500">
              <ArrowRight className="size-4 rotate-180 rtl:rotate-0" aria-hidden />
              <span className="home-link-line">{trust.backHome}</span>
            </Link>
          </p>
        </main>

        <MinimalFooter showLanguage={false} className="border-t border-line-strong/60" />
      </div>
    </MotionConfig>
  );
}
