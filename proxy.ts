import { NextResponse, type NextRequest } from "next/server";
import { FAMILY_HINT_COOKIE, SESSION_HINT_COOKIE } from "@/lib/server/session-cookie";
import { ROUTES } from "@/lib/config/routes";
import { signInHref } from "@/lib/config/auth-role";

/** The parent portal's public pages: registration (and the legacy sign-in alias, which only redirects). */
const FAMILY_PUBLIC = /^\/family\/(?:register|sign-in)(?:\/|$)/;

/**
 * Each area has its own session hint cookie, so a patient session never opens the parent portal and the reverse:
 * `/dashboard` and `/welcome` need the patient's, `/family` the parent's. Without it the visitor is sent to the one
 * sign-in page with the matching role before anything renders. Presence only — a stale hint still goes through the
 * client gate and the API, which decide.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
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

export const config = { matcher: ["/dashboard/:path*", "/welcome", "/family/:path*"] };
