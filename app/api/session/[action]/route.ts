import { apiUrl } from "@/lib/api/config";
import { unwrapEnvelope } from "@/lib/api/errors";
import { clearedCookie, readRefreshCookie, refreshCookie } from "@/lib/server/session-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin session gateway: `/api/session/{login,register,refresh,logout,change-password,accept-invitation,adult-consent}`.
 * The browser sends credentials here; the Nest API's tokens come back split in two: the short-lived access token
 * in the JSON body (kept in memory by the client) and the refresh token in an HttpOnly cookie it cannot read.
 */
type Tokens = { access_token?: string; refresh_token?: string; [key: string]: unknown };

const json = (body: unknown, status: number, cookies: string[] = []) => {
  const headers = new Headers({ "Cache-Control": "no-store" });
  cookies.forEach((cookie) => headers.append("Set-Cookie", cookie));
  return Response.json(body, { status, headers });
};

/** A browser POST from another site must not drive the session: browsers always send Origin on POST, and it has to be ours. */
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) return origin === new URL(request.url).origin;
  return request.headers.get("sec-fetch-site") === "same-origin";
}

/**
 * Per-IP throttle in front of the API's own (it answers 429 too). shortcut: in-memory, so per server instance and
 * keyed on x-forwarded-for, which is only trustworthy behind a proxy that overwrites it; move to a shared store
 * (Redis/edge KV) if the app runs on several instances.
 */
const WINDOW_MS = 5 * 60_000;
const LIMITS: Record<string, number> = { login: 10, register: 10, refresh: 60, "change-password": 10, "accept-invitation": 10, "adult-consent": 10 };
const hits = new Map<string, { count: number; resetAt: number }>();

function retryAfter(request: Request, action: string): number {
  const limit = LIMITS[action];
  if (!limit) return 0;
  const now = Date.now();
  for (const [key, hit] of hits) if (hit.resetAt <= now) hits.delete(key);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `${action}:${ip}`;
  const hit = hits.get(key) ?? { count: 0, resetAt: now + WINDOW_MS };
  hit.count += 1;
  hits.set(key, hit);
  return hit.count > limit ? Math.ceil((hit.resetAt - now) / 1000) : 0;
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

/** The tokens inside the `{ success, data }` envelope or a raw payload; `null` when it is not an object. */
function unwrap(payload: unknown): Tokens | null {
  const body = unwrapEnvelope(payload);
  return body && typeof body === "object" ? (body as Tokens) : null;
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
  const wait = retryAfter(request, action);
  if (wait) return Response.json({ message: "Too many requests. Please wait a moment and retry." }, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(wait) } });

  try {
    if (action === "login" || action === "register") {
      const input = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const { res, payload } = await call(request, action === "login" ? "/auth/login" : "/auth/register", input);
      if (!res.ok) return json(payload ?? { message: "Request failed" }, res.status);
      const issued = session(payload);
      // e.g. an account that answers with a two-factor challenge cannot open the patient app
      return issued ? json(issued.body, 200, issued.cookie) : json(unwrap(payload) ?? {}, 200);
    }

    // These two end in a real session just like login does, so the refresh token is split off into the cookie here too.
    // (login of a clinician-created account answers a `password_change_token` instead of tokens: no cookie, no session.)
    if (action === "change-password" || action === "accept-invitation") {
      const input = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const { res, payload } = await call(request, action === "change-password" ? "/auth/login/change-password" : "/auth/invitations/accept", input);
      if (!res.ok) return json(payload ?? { message: "Request failed" }, res.status);
      const issued = session(payload);
      // A success that carries no session is a contract break, never a quiet success.
      return issued ? json(issued.body, 200, issued.cookie) : json({ message: "The SynQ API answered without a session." }, 502);
    }

    // Accepting an adult account's consent ends in a session too; a two-factor challenge (no session) goes back as is, like login.
    if (action === "adult-consent") {
      const input = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const { res, payload } = await call(request, "/auth/login/adult-consent", input);
      if (!res.ok) return json(payload ?? { message: "Request failed" }, res.status);
      const issued = session(payload);
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
        // 401/403 means the API already treats this session as dead (expired, rotated, revoked): nothing left to revoke,
        // so the cookie goes too instead of leaving the patient unable to sign out.
        if (!res.ok && res.status !== 401 && res.status !== 403) return json({ message: "Could not sign out. Please try again." }, res.status >= 500 ? 502 : res.status);
      }
      return json({ message: "Logged out" }, 200, clearedCookie());
    }
  } catch {
    return json({ message: "The SynQ API is unreachable." }, 502);
  }
  return json({ message: "Not found" }, 404);
}
