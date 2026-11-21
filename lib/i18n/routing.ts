import { ROUTES } from "@/lib/config/routes";
import type { Lang } from "@/lib/i18n/config";

/**
 * Public pages that exist in both languages on their own URL: English at the root, Arabic under /ar. Signed-in app
 * routes stay unprefixed and follow the language cookie. Client-safe (no server imports).
 */
export const LOCALIZED_PATHS: readonly string[] = [
  ROUTES.home,
  ROUTES.mira,
  ROUTES.lumina,
  ROUTES.psy,
  ROUTES.tracks,
  ROUTES.privacy,
  ROUTES.help,
  ROUTES.invite,
  ROUTES.clinicAccess,
  ROUTES.support,
];

/** Request header the proxy sets on a localized page: the URL decides its language, not the cookie. */
export const LANG_HEADER = "x-synq-lang";

export const AR_PREFIX = "/ar";

export function isLocalizedPath(path: string) {
  return LOCALIZED_PATHS.includes(path);
}

/** `/mira` → `/ar/mira` in Arabic; `/` → `/ar`. Non-localized paths are returned unchanged. */
export function localizedPath(path: string, lang: Lang) {
  if (lang !== "ar" || !isLocalizedPath(path)) return path;
  return path === "/" ? AR_PREFIX : `${AR_PREFIX}${path}`;
}

/** `/ar/mira` → { lang: "ar", path: "/mira" }; `/mira` → { lang: "en", path: "/mira" }. */
export function splitLangPrefix(pathname: string): { lang: Lang; path: string } {
  if (pathname === AR_PREFIX || pathname.startsWith(`${AR_PREFIX}/`)) {
    return { lang: "ar", path: pathname.slice(AR_PREFIX.length) || "/" };
  }
  return { lang: "en", path: pathname };
}

/** `localizedPath` for a link target that may carry `?query` or `#hash`: `/mira#flow` → `/ar/mira#flow`. */
export function localizedHref(href: string, lang: Lang) {
  if (lang !== "ar" || !href.startsWith("/")) return href;
  const cut = href.search(/[?#]/);
  const path = cut === -1 ? href : href.slice(0, cut);
  return localizedPath(path, lang) + (cut === -1 ? "" : href.slice(cut));
}

/**
 * Whether an English public URL should send a visitor who reads in Arabic (cookie) to its Arabic twin. The URL decides on
 * a deep link opened directly (shared, searched, typed): it stays English. Only the home page follows the saved choice,
 * and a link followed from inside the site keeps the language of the page it came from: Arabic pages and the app
 * (whose language is the cookie). A link from an English public page stays English.
 */
export function followsSavedArabic(path: string, referer: string | null, origin: string) {
  if (path === "/") return true;
  if (!referer) return false;
  let from: URL;
  try {
    from = new URL(referer);
  } catch {
    return false;
  }
  if (from.origin !== origin) return false;
  const source = splitLangPrefix(from.pathname);
  // From a page to its own English twin is the language switch itself (also when Forward replays it), never a link.
  if (source.lang === "ar" && source.path === path) return false;
  return source.lang === "ar" || !isLocalizedPath(from.pathname);
}
