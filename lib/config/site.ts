import type { Metadata } from "next";
import { BRAND, CONTACT, SOCIAL_PROFILES } from "@/lib/config/brand";
import { ROUTES } from "@/lib/config/routes";

/**
 * Public origin used for canonical URLs, the sitemap and social previews.
 * Set NEXT_PUBLIC_SITE_URL in Vercel (no trailing slash); the fallback is the production domain.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.synqae.com/").replace(/\/+$/, "");

/** Build date (YYYY-MM-DD, set in next.config.ts): when this version of the site shipped. Used as lastmod / dateModified. */
export const SITE_MODIFIED = process.env.NEXT_PUBLIC_BUILD_DATE ?? new Date().toISOString().slice(0, 10);

export const OG_SIZE = { width: 1200, height: 630 } as const;

export const SITE = {
  url: SITE_URL,
  title: `${BRAND.name} — Guided mental wellbeing`,
  /** Plain, claim-free definition (<= 160 chars so it is not cut in results): orientation is never a diagnosis. */
  description:
    "SynQ is a guided mental wellbeing platform for people living with ADHD, bipolar disorder or psychosis: orientation, daily follow-up and clinician support.",
} as const;

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

function social(title: string, description: string, path: string): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website",
      siteName: BRAND.name,
      locale: "en_US",
      alternateLocale: ["ar_AR"],
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
  /** Route path, e.g. ROUTES.support — used for the canonical URL and og:url. */
  path: string;
  noindex?: boolean;
};

/** One place that builds a page's title, description, canonical and social tags so they never drift apart. */
export function pageMetadata({ title, description, path, noindex = false }: PageMetaInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    ...social(`${title} | ${BRAND.name}`, description, path),
    robots: noindex ? NO_INDEX : INDEX_ROBOTS,
  };
}

/** Pages that belong in the sitemap, in priority order. Private/app routes are intentionally absent. */
export const SITEMAP_ROUTES: ReadonlyArray<{ path: string; priority: number; changeFrequency: "weekly" | "monthly" }> = [
  { path: ROUTES.home, priority: 1, changeFrequency: "weekly" },
  { path: ROUTES.mira, priority: 0.8, changeFrequency: "monthly" },
  { path: ROUTES.lumina, priority: 0.8, changeFrequency: "monthly" },
  { path: ROUTES.psy, priority: 0.7, changeFrequency: "monthly" },
  { path: ROUTES.tracks, priority: 0.8, changeFrequency: "monthly" },
  { path: ROUTES.privacy, priority: 0.7, changeFrequency: "monthly" },
  { path: ROUTES.terms, priority: 0.4, changeFrequency: "monthly" },
  { path: ROUTES.support, priority: 0.6, changeFrequency: "monthly" },
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
