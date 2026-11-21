"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { CONTACT } from "@/lib/config/brand";
import { ROUTES } from "@/lib/config/routes";
import { legalUi } from "@/lib/i18n/legal";
import { cn } from "@/lib/utils";
import { LocaleLink as Link } from "@/components/shared/LocaleLink";
import { Fragment, type ReactNode } from "react";

const LINK_CLASS =
  "inline-flex min-h-10 items-center rounded-md text-[0.875rem] text-ink-soft transition-colors duration-200 hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500";

/** Replaces `{key}` markers in a translated sentence with links, so the word order stays free in every language. */
export function LinkedText({ template, links }: { template: string; links: Record<string, ReactNode> }) {
  return (
    <>
      {template.split(/(\{\w+\})/).map((part, index) => {
        const key = /^\{(\w+)\}$/.exec(part)?.[1];
        return <Fragment key={index}>{key && key in links ? links[key] : part}</Fragment>;
      })}
    </>
  );
}

/** Privacy · Terms, and the contact email once the company has provided one. Shown in every footer. */
export function LegalLinks({ className }: { className?: string }) {
  const { language } = useLanguage();
  const ui = legalUi[language];
  return (
    <nav aria-label={ui.legalNav} className={cn("flex flex-wrap items-center justify-center gap-x-5 gap-y-0 sm:justify-start", className)}>
      <Link href={ROUTES.privacy} className={LINK_CLASS}>
        <span className="home-link-line">{ui.privacy}</span>
      </Link>
      <Link href={ROUTES.terms} className={LINK_CLASS}>
        <span className="home-link-line">{ui.terms}</span>
      </Link>
      {CONTACT.email ? (
        <a href={`mailto:${CONTACT.email}`} className={LINK_CLASS} dir="ltr">
          <span className="home-link-line">{CONTACT.email}</span>
        </a>
      ) : null}
    </nav>
  );
}
