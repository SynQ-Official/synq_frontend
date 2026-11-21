import { NextResponse, type NextRequest } from "next/server";
import { FAMILY_HINT_COOKIE, SESSION_HINT_COOKIE } from "@/lib/server/session-cookie";
import { ROUTES } from "@/lib/config/routes";
import { signInHref } from "@/lib/config/auth-role";
import { LANGUAGE_STORAGE_KEY } from "@/lib/i18n/config";
import { AR_PREFIX, LANG_HEADER, followsSavedArabic, isLocalizedPath, localizedPath, splitLangPrefix } from "@/lib/i18n/routing";

/** The parent portal's public pages: registration (and the legacy sign-in alias, which only redirects). */
const FAMILY_PUBLIC = /^\/family\/(?:register|sign-in)(?:\/|$)/;

const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Serve a localized page with its language fixed by the URL (read by lib/server/request-language.ts). */
function withLanguage(request: NextRequest, lang: "en" | "ar", rewriteTo?: URL) {
  const headers = new Headers(request.headers);
  headers.set(LANG_HEADER, lang);
  return rewriteTo ? NextResponse.rewrite(rewriteTo, { request: { headers } }) : NextResponse.next({ request: { headers } });
}

/**
 * Public pages: English at the root, Arabic under /ar (one URL per language, for hreflang). A visitor who reads in Arabic
 * (cookie) is sent to the Arabic twin of the home page, and of a page reached from inside the site in Arabic; an English
 * deep link opened directly stays English (see `followsSavedArabic`). Crawlers carry no cookie, so they see both.
 */
function localize(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { lang, path } = splitLangPrefix(pathname);
  if (lang === "ar") {
    // /ar/dashboard and friends have no Arabic URL: the app follows the cookie instead.
    if (!isLocalizedPath(path)) return NextResponse.redirect(new URL(path + search, request.url));
    const response = withLanguage(request, "ar", new URL(path + search, request.url));
    response.cookies.set(LANGUAGE_STORAGE_KEY, "ar", { path: "/", maxAge: LANGUAGE_COOKIE_MAX_AGE, sameSite: "lax" });
    return response;
  }
  const savedArabic = request.cookies.get(LANGUAGE_STORAGE_KEY)?.value === "ar";
  if (savedArabic && followsSavedArabic(path, request.headers.get("referer"), request.nextUrl.origin)) {
    return NextResponse.redirect(new URL(localizedPath(path, "ar") + search, request.url));
  }
  const response = withLanguage(request, "en");
  // The reader is on an English page now: like /ar does for Arabic, the app and the next visit follow it.
  if (savedArabic) response.cookies.set(LANGUAGE_STORAGE_KEY, "en", { path: "/", maxAge: LANGUAGE_COOKIE_MAX_AGE, sameSite: "lax" });
  return response;
}

/**
 * Each area has its own session hint cookie, so a patient session never opens the parent portal and the reverse:
 * `/dashboard` and `/welcome` need the patient's, `/family` the parent's. Without it the visitor is sent to the one
 * sign-in page with the matching role before anything renders. Presence only — a stale hint still goes through the
 * client gate and the API, which decide.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === AR_PREFIX || pathname.startsWith(`${AR_PREFIX}/`) || isLocalizedPath(pathname)) return localize(request);
  if (pathname.startsWith("/family")) {
    if (FAMILY_PUBLIC.test(pathname) || request.cookies.has(FAMILY_HINT_COOKIE)) return NextResponse.next();
    return NextResponse.redirect(new URL(signInHref("parent", pathname + search), request.url));
  }
  if (request.cookies.has(SESSION_HINT_COOKIE)) return NextResponse.next();
  const target = pathname.startsWith(ROUTES.dashboard) ? pathname + search : ROUTES.dashboard;
  const url = new URL(signInHref("patient", target), request.url);
  url.searchParams.set("from", "lumina");
  return NextResponse.redirect(url);
}

// Next needs literal matchers: keep the public list in sync with LOCALIZED_PATHS (lib/i18n/routing.ts, tested).
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/welcome",
    "/family/:path*",
    "/ar",
    "/ar/:path*",
    "/",
    "/mira",
    "/lumina",
    "/clinician",
    "/care-paths",
    "/privacy",
    "/help",
    "/invite",
    "/clinic-access",
    "/support",
  ],
};
