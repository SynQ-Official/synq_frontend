import { NextResponse, type NextRequest } from "next/server";
import { SESSION_HINT_COOKIE } from "@/lib/server/session-cookie";
import { ROUTES } from "@/lib/config/routes";

/**
 * Signed-out visitors never get the dashboard's frame: without the session hint cookie they are sent to sign-in
 * before anything renders. Presence only — a stale hint still goes through the client gate and the API, which decide.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_HINT_COOKIE)) return NextResponse.next();
  const { pathname } = request.nextUrl;
  const target = pathname.startsWith(ROUTES.dashboard) ? pathname + request.nextUrl.search : ROUTES.dashboard;
  const url = new URL(ROUTES.signIn, request.url);
  url.searchParams.set("from", "lumina");
  url.searchParams.set("redirect", target);
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/dashboard/:path*", "/welcome"] };
