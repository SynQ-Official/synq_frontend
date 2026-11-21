"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizedHref } from "@/lib/i18n/routing";

/**
 * `next/link` that keeps the reader in their language: in Arabic, a link to a public page (`/mira`) opens its Arabic twin
 * (`/ar/mira`) directly, instead of relying on a redirect. App routes, external URLs and URL objects pass through as given.
 */
export function LocaleLink({ href, ...props }: ComponentProps<typeof Link>) {
  const { language } = useLanguage();
  return <Link href={typeof href === "string" ? localizedHref(href, language) : href} {...props} />;
}
