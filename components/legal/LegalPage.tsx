"use client";

import { Grain } from "@/components/home/Atmosphere";
import { homeSerif } from "@/components/home/fonts";
import { BODY, BODY_SM, DISPLAY_L, DISPLAY_S, LABEL } from "@/components/home/typography";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { SiteHeader } from "@/components/layout/site-header";
import { ContactDetails } from "@/components/trust/TrustPage";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { CONTACT } from "@/lib/config/brand";
import { ROUTES } from "@/lib/config/routes";
import { legalCopy, legalUi, type LegalSection } from "@/lib/i18n/legal";
import { trustCopy } from "@/lib/i18n/trust";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, Construction } from "lucide-react";
import Link from "next/link";

/** A section whose approved text has not been supplied yet: visible on purpose, so nothing is mistaken for final wording. */
function TodoBlock({ label, detail }: { label: string; detail: string }) {
  return (
    <div role="note" data-legal-todo className="mt-6 flex items-start gap-3 rounded-2xl border-2 border-dashed border-gold-700 bg-gold-50 p-4 text-[0.9375rem] leading-6 text-ink">
      <Construction className="mt-0.5 size-5 shrink-0 text-gold-700" strokeWidth={1.5} aria-hidden />
      <p>
        <strong className="block font-semibold">{label}</strong>
        <span className="text-ink-soft">{detail}</span>
      </p>
    </div>
  );
}

function SectionCard({ section }: { section: LegalSection }) {
  const { language } = useLanguage();
  const ui = legalUi[language];
  const trust = trustCopy[language];
  const contact = trust.sections.find((item) => item.id === "contact")!;
  const todoDetail = section.todo ?? (section.contact && !CONTACT.email ? ui.contactMissing : undefined);

  return (
    <section id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-28 rounded-panel border border-line bg-white p-6 shadow-[var(--shadow-soft)] sm:p-9">
      <h2 id={`${section.id}-title`} className={cn(DISPLAY_S, "text-ink")}>
        {section.title}
      </h2>

      {section.contact ? <p className={cn(BODY_SM, "mt-1.5")}>{contact.summary}</p> : null}

      {section.points.length > 0 ? (
        <ul className="mt-5 space-y-1 border-t border-line pt-5">
          {section.points.map((point) => (
            <li key={point} className="flex items-start gap-3 py-2.5 text-[1rem] leading-7 text-ink-soft">
              <span aria-hidden className="mt-1.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                <Check className="size-3" strokeWidth={2.75} />
              </span>
              {point}
            </li>
          ))}
        </ul>
      ) : null}

      {section.contact ? (
        <>
          <ContactDetails labels={trust.contact} />
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Button asChild size="lg" className="group min-h-12 px-7 shadow-brand">
              <Link href={ROUTES.support}>
                {trust.contact.formCta}
                <ArrowRight className="transition-transform duration-300 ease-out-soft group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden />
              </Link>
            </Button>
            <span className="text-[0.875rem] text-ink-muted">{trust.contact.formHint}</span>
          </div>
        </>
      ) : null}

      {todoDetail ? <TodoBlock label={ui.todoLabel} detail={todoDetail} /> : null}
    </section>
  );
}

/** /privacy and /terms: the same layout as /trust, with the text /trust already publishes and a visible TODO wherever the legal text is still missing. */
export function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const { language, direction } = useLanguage();
  const copy = legalCopy[kind][language];
  const trust = trustCopy[language];

  return (
    <div dir={direction} className={cn(homeSerif.variable, "relative isolate flex min-h-dvh flex-col overflow-x-clip bg-canvas text-ink")}>
      <div aria-hidden className="canvas-glow pointer-events-none absolute inset-0 -z-10" />
      <Grain tone="light" />

      <SiteHeader variant="public" />

      <main className="page-container flex-1 pb-20 pt-10 sm:pt-14 lg:pb-28 lg:pt-20">
        <header className="max-w-3xl">
          <p className={cn(LABEL, "flex items-center gap-3 text-teal-700")}>
            <span aria-hidden className="h-px w-8 bg-gold" />
            {copy.eyebrow}
          </p>
          <h1 className={cn(DISPLAY_L, "mt-6 text-ink")}>{copy.title}</h1>
          <p className={cn(BODY, "mt-7 max-w-2xl")}>{copy.intro}</p>
        </header>

        <div className="mt-14 grid gap-10 lg:mt-20 lg:grid-cols-12 lg:gap-12">
          <nav aria-label={copy.title} className="lg:col-span-3">
            <ul className="flex flex-wrap gap-2 lg:sticky lg:top-28 lg:flex-col lg:gap-1">
              {copy.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="inline-flex min-h-10 items-center rounded-full border border-line-strong bg-white px-4 text-[0.9375rem] font-medium text-ink-soft transition-colors duration-300 hover:border-teal-300 hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 lg:rounded-md lg:border-transparent lg:bg-transparent lg:ps-3"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-6 lg:col-span-9">
            {copy.sections.map((section) => (
              <SectionCard key={section.id} section={section} />
            ))}
          </div>
        </div>

        <p className="mt-12">
          <Link href={ROUTES.home} className="inline-flex min-h-10 items-center gap-2 rounded-md text-[0.9375rem] font-semibold text-teal-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500">
            <ArrowRight className="size-4 rotate-180 rtl:rotate-0" aria-hidden />
            <span className="home-link-line">{trust.backHome}</span>
          </Link>
        </p>
      </main>

      <MinimalFooter showLanguage={false} className="border-t border-line-strong/60" />
    </div>
  );
}
