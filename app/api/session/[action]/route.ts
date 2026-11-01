import { apiUrl } from "@/lib/api/config";
import { clearedCookie, readRefreshCookie, refreshCookie } from "@/lib/server/session-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin session gateway: `/api/session/{login,register,refresh,logout}`.
 * The browser sends credentials here; the Nest API's tokens come back split in two: the short-lived access token
 * in the JSON body (kept in memory by the client) and the refresh token in an HttpOnly cookie it cannot read.
 */
type Tokens = { access_token?: string; refresh_token?: string; [key: string]: unknown };

const json = (body: unknown, status: number, cookie?: string) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...(cookie ? { "Set-Cookie": cookie } : {}) } });

/** A browser POST from another site must not drive the session: the Origin has to be ours. */
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

function forwardHeaders(request: Request, extra: Record<string, string> = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...extra };
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) headers["x-forwarded-for"] = forwarded;
  return headers;
}

async function call(request: Request, path: string, body: unknown, extra?: Record<string, string>) {
  const res = await fetch(apiUrl(path), { method: "POST", headers: forwardHeaders(request, extra), body: JSON.stringify(body ?? {}), cache: "no-store" });
  const payload = (await res.json().catch(() => null)) as unknown;
  return { res, payload };
}

/** `{ success, data }` envelope or a raw payload. */
function unwrap(payload: unknown): Tokens | null {
  if (payload && typeof payload === "object") {
    const maybe = payload as { data?: unknown; success?: unknown };
    if ("success" in maybe && maybe.data && typeof maybe.data === "object") return maybe.data as Tokens;
    return payload as Tokens;
  }
  return null;
}

/** Keep the refresh token out of the response body; hand it to the cookie instead. */
function session(payload: unknown) {
  const tokens = unwrap(payload);
  if (!tokens?.access_token || !tokens.refresh_token) return null;
  const { refresh_token, ...rest } = tokens;
  return { body: rest, cookie: refreshCookie(refresh_token) };
}

export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  if (!sameOrigin(request)) return json({ message: "Forbidden" }, 403);

  try {
    if (action === "login" || action === "register") {
      const input = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const { res, payload } = await call(request, action === "login" ? "/auth/login" : "/auth/register", input);
      if (!res.ok) return json(payload ?? { message: "Request failed" }, res.status);
      const issued = session(payload);
      // e.g. an account that answers with a two-factor challenge cannot open the patient app
      return issued ? json(issued.body, 200, issued.cookie) : json(unwrap(payload) ?? {}, 200);
    }

    if (action === "refresh") {
      const token = readRefreshCookie(request);
      if (!token) return json({ message: "No session" }, 401);
      const { res, payload } = await call(request, "/auth/refresh", { refresh_token: token });
      if (!res.ok) return json(payload ?? { message: "Session expired" }, res.status, res.status === 401 || res.status === 403 ? clearedCookie() : undefined);
      const issued = session(payload);
      return issued ? json(issued.body, 200, issued.cookie) : json({ message: "Session expired" }, 401, clearedCookie());
    }

    if (action === "logout") {
      const token = readRefreshCookie(request);
      if (token) {
        // The refresh token itself authenticates the logout, so it works after the access token has expired.
        const { res } = await call(request, "/auth/logout", { refresh_token: token });
        // The cookie is only dropped once the API has revoked the session. Otherwise the visitor would look signed
        // out while a valid refresh session lives on; the cookie stays so the sign-out can simply be retried.
        if (!res.ok) return json({ message: "Could not sign out. Please try again." }, res.status >= 500 ? 502 : res.status);
      }
      return json({ message: "Logged out" }, 200, clearedCookie());
    }
  } catch {
    return json({ message: "The SynQ API is unreachable." }, 502);
  }
  return json({ message: "Not found" }, 404);
}
