import type { Metadata } from "next";
import { BRAND, CONTACT, SOCIAL_PROFILES } from "@/lib/config/brand";
import { ROUTES } from "@/lib/config/routes";
import type { Lang } from "@/lib/i18n/config";
import { isLocalizedPath, localizedPath } from "@/lib/i18n/routing";

/**
 * Public origin used for canonical URLs, the sitemap and social previews.
 * Set NEXT_PUBLIC_SITE_URL in Vercel (no trailing slash); the fallback is the production domain.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.synqae.com/").replace(/\/+$/, "");

/** Build date (YYYY-MM-DD, set in next.config.ts): when this version of the site shipped. Used as lastmod / dateModified. */
export const SITE_MODIFIED = process.env.NEXT_PUBLIC_BUILD_DATE ?? new Date().toISOString().slice(0, 10);

export const OG_SIZE = { width: 1200, height: 630 } as const;

/**
 * Home title and description per language. "Clinic-led", not "wellbeing": SynQ is care a clinic offers, not a
 * consumer wellness app. Descriptions stay <= 160 chars so results do not cut them; orientation is never a diagnosis.
 */
export const SITE_COPY: Record<Lang, { title: string; description: string }> = {
  en: {
    title: `${BRAND.name} — Clinic-led support for ADHD, bipolar and psychosis`,
    description:
      "Support between appointments for people living with ADHD, bipolar disorder or psychosis. Start on your own; connect your clinician when you choose.",
  },
  ar: {
    title: `${BRAND.name} — متابعة بإشراف العيادة لفرط الحركة وثنائي القطب والذهان`,
    description:
      "دعم بين المواعيد للأشخاص المصابين باضطراب فرط الحركة وتشتت الانتباه أو الاضطراب ثنائي القطب أو الذهان. ابدأ بنفسك، واربط حسابك بمختصك متى اخترت.",
  },
};

export const SITE = { url: SITE_URL, ...SITE_COPY.en } as const;

export const NO_INDEX: Metadata["robots"] = { index: false, follow: false };

/** Indexable pages: also allow full-size image previews and unrestricted snippets in results. */
export const INDEX_ROBOTS: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
};

/**
 * schema.org nodes shared by every page's JSON-LD, so each page's graph stands on its own (a crawler reads one
 * page at a time and cannot follow an @id that is only defined on the home page).
 */
export const ORGANIZATION_NODE = {
  "@type": "Organization",
  "@id": `${SITE.url}/#organization`,
  name: BRAND.name,
  url: SITE.url,
  description: BRAND.description,
  logo: { "@type": "ImageObject", url: `${SITE.url}/assets/icon-512.png`, width: 512, height: 512 },
  // The support page is the real contact channel; the email is added only once the owner provides it.
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    url: `${SITE.url}${ROUTES.support}`,
    availableLanguage: ["English", "Arabic"],
    ...(CONTACT.email ? { email: CONTACT.email } : {}),
  },
  ...(SOCIAL_PROFILES.length ? { sameAs: [...SOCIAL_PROFILES] } : {}),
} as const;

export const WEBSITE_NODE = {
  "@type": "WebSite",
  "@id": `${SITE.url}/#website`,
  url: SITE.url,
  name: BRAND.name,
  description: SITE.description,
  inLanguage: ["en", "ar"],
  dateModified: SITE_MODIFIED,
  publisher: { "@id": ORGANIZATION_NODE["@id"] },
} as const;

/** A SynQ agent as a web application, for its own page. No price or rating: only what the page states. */
export function softwareApplicationNode({ path, name, description }: { path: string; name: string; description: string }) {
  return {
    "@type": "SoftwareApplication",
    "@id": `${SITE.url}${path}#app`,
    name,
    description,
    url: `${SITE.url}${path}`,
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    inLanguage: ["en", "ar"],
    dateModified: SITE_MODIFIED,
    publisher: { "@id": ORGANIZATION_NODE["@id"] },
  };
}

/** Next replaces (does not merge) `openGraph`/`twitter` when a page sets them, so each page restates the shared parts. */
const OG_IMAGE = { url: "/og", ...OG_SIZE, alt: SITE.title };

/** Open Graph wants underscores (ar_AE); <html lang> uses the short form. */
const OG_LOCALE: Record<Lang, string> = { en: "en_US", ar: "ar_AE" };

function social(title: string, description: string, path: string, lang: Lang = "en"): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website",
      siteName: BRAND.name,
      locale: OG_LOCALE[lang],
      alternateLocale: [OG_LOCALE[lang === "en" ? "ar" : "en"]],
      title,
      description,
      url: path,
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
  };
}

/** Root-layout defaults: the home page's title/description and its social card. */
export const ROOT_SOCIAL = social(SITE.title, SITE.description, "/");

type PageMetaInput = {
  /** Page title without the brand: the root template appends " | SynQ". */
  title: string;
  description: string;
  /** Unprefixed route path, e.g. ROUTES.support — the Arabic URL (/ar/...) is derived from it. */
  path: string;
  /** Language this response is rendered in (requestLanguage()): picks the canonical among the two URLs. */
  lang?: Lang;
  noindex?: boolean;
};

/** hreflang map of a public page: English at the root, Arabic under /ar; x-default is the English URL. */
export function languageAlternates(path: string) {
  return { en: path, ar: localizedPath(path, "ar"), "x-default": path };
}

/** One place that builds a page's title, description, canonical, hreflang and social tags so they never drift apart. */
export function pageMetadata({ title, description, path, lang = "en", noindex = false }: PageMetaInput): Metadata {
  const url = localizedPath(path, lang);
  return {
    title,
    description,
    alternates: { canonical: url, ...(isLocalizedPath(path) && !noindex ? { languages: languageAlternates(path) } : {}) },
    ...social(`${title} | ${BRAND.name}`, description, url, lang),
    robots: noindex ? NO_INDEX : INDEX_ROBOTS,
  };
}

/** The home page's metadata in one language (its title is absolute: no " | SynQ" suffix). */
export function homeMetadata(lang: Lang): Metadata {
  const { title, description } = SITE_COPY[lang];
  const url = localizedPath(ROUTES.home, lang);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url, languages: languageAlternates(ROUTES.home) },
    robots: INDEX_ROBOTS,
    ...social(title, description, url, lang),
  };
}

/**
 * The privacy policy still has fields to confirm before launch: it stays out of the index (and the sitemap) until it
 * is complete. Set to false once the lawyer has filled it in.
 */
export const PRIVACY_NOINDEX = true;

type SitemapRoute = { path: string; modified: string; priority: number; changeFrequency: "weekly" | "monthly" };

/**
 * Pages that belong in the sitemap, in priority order; each is listed in English and Arabic. Private/app routes are
 * intentionally absent. `modified` is the date the page content last changed (YYYY-MM-DD): bump it when you edit
 * that page copy, not on every deploy, or search engines learn to ignore it.
 */
export const SITEMAP_ROUTES: ReadonlyArray<SitemapRoute> = [
  { path: ROUTES.home, modified: "2026-11-21", priority: 1, changeFrequency: "weekly" },
  { path: ROUTES.mira, modified: "2026-11-21", priority: 0.8, changeFrequency: "monthly" },
  { path: ROUTES.lumina, modified: "2026-11-21", priority: 0.8, changeFrequency: "monthly" },
  { path: ROUTES.psy, modified: "2026-11-21", priority: 0.7, changeFrequency: "monthly" },
  { path: ROUTES.tracks, modified: "2026-11-21", priority: 0.8, changeFrequency: "monthly" },
  ...(PRIVACY_NOINDEX ? [] : [{ path: ROUTES.privacy, modified: "2026-11-21", priority: 0.7, changeFrequency: "monthly" } satisfies SitemapRoute]),
  { path: ROUTES.help, modified: "2026-11-21", priority: 0.5, changeFrequency: "monthly" },
  { path: ROUTES.invite, modified: "2026-11-21", priority: 0.6, changeFrequency: "monthly" },
  { path: ROUTES.clinicAccess, modified: "2026-11-21", priority: 0.6, changeFrequency: "monthly" },
  { path: ROUTES.support, modified: "2026-11-21", priority: 0.6, changeFrequency: "monthly" },
  // English only for now (no /ar twin): parents land here from the home page and search.
  { path: ROUTES.familyRegister, modified: "2026-11-21", priority: 0.6, changeFrequency: "monthly" },
];

/** Paths crawlers must not fetch: API, signed-in app, auth flows and personal orientation results. */
export const DISALLOWED_PATHS = [
  "/api/",
  "/dashboard",
  "/welcome",
  "/auth/",
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
  "/orientation/result/",
] as const;
