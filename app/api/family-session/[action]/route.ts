import { apiUrl } from "@/lib/api/config";
import { unwrapEnvelope } from "@/lib/api/errors";
import { FAMILY_HINT_COOKIE } from "@/lib/server/session-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin session gateway of the PARENT portal: `/api/family-session/{login,register,refresh,logout}`.
 * Mirrors the patient gateway but with its own cookie and path, so a parent session and a patient session never share
 * a token, a cookie or a route: the refresh token stays in an HttpOnly cookie scoped to this path only.
 */
const COOKIE = "synq_family_rt";
const COOKIE_PATH = "/api/family-session";
const FALLBACK_TTL_S = 7 * 24 * 60 * 60;
const secure = () => process.env.NODE_ENV === "production";

function ttl(token: string) {
  try {
    const { exp } = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8")) as { exp?: number };
    if (typeof exp === "number") return Math.max(0, Math.floor(exp - Date.now() / 1000));
  } catch {
    /* unreadable: default */
  }
  return FALLBACK_TTL_S;
}
const attrs = (path: string, maxAge: number, sameSite: "Strict" | "Lax") =>
  [`Path=${path}`, `Max-Age=${maxAge}`, "HttpOnly", `SameSite=${sameSite}`, secure() ? "Secure" : ""].filter(Boolean).join("; ");
/** The refresh token (this path only) plus a presence hint for `proxy.ts`, which grants nothing: the API still decides. */
const cookie = (value: string, maxAge: number) => [`${COOKIE}=${value}; ${attrs(COOKIE_PATH, maxAge, "Strict")}`, `${FAMILY_HINT_COOKIE}=${value ? "1" : ""}; ${attrs("/", maxAge, "Lax")}`];

function readCookie(request: Request) {
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === COOKIE) return value.join("=") || null;
  }
  return null;
}

const json = (body: unknown, status: number, setCookies: string[] = []) => {
  const headers = new Headers({ "Cache-Control": "no-store" });
  setCookies.forEach((c) => headers.append("Set-Cookie", c));
  return Response.json(body, { status, headers });
};

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) return origin === new URL(request.url).origin;
  return request.headers.get("sec-fetch-site") === "same-origin";
}

async function call(path: string, body: unknown, request: Request) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) headers["x-forwarded-for"] = forwarded;
  const res = await fetch(apiUrl(path), { method: "POST", headers, body: JSON.stringify(body ?? {}), cache: "no-store" });
  return { res, payload: (await res.json().catch(() => null)) as unknown };
}

/** The access token goes back in the body (kept in memory); the refresh token only into the cookie. */
function split(payload: unknown) {
  const tokens = unwrapEnvelope(payload) as { access_token?: string; refresh_token?: string; user?: unknown } | null;
  if (!tokens?.access_token || !tokens.refresh_token) return null;
  return { body: { access_token: tokens.access_token, user: tokens.user }, cookie: cookie(tokens.refresh_token, ttl(tokens.refresh_token)) };
}

export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  if (!sameOrigin(request)) return json({ message: "Forbidden" }, 403);
  try {
    if (action === "login" || action === "register") {
      const input = await request.json().catch(() => ({}));
      const { res, payload } = await call(`/parent/auth/${action}`, input, request);
      if (!res.ok) return json(payload ?? { message: "Request failed" }, res.status);
      const issued = split(payload);
      return issued ? json(issued.body, 200, issued.cookie) : json({ message: "The SynQ API answered without a session." }, 502);
    }
    if (action === "refresh") {
      const token = readCookie(request);
      if (!token) return json({ message: "No session" }, 401);
      const { res, payload } = await call("/parent/auth/refresh", { refresh_token: token }, request);
      if (!res.ok) return json(payload ?? { message: "Session expired" }, res.status, res.status === 401 || res.status === 403 ? cookie("", 0) : undefined);
      const issued = split(payload);
      return issued ? json(issued.body, 200, issued.cookie) : json({ message: "Session expired" }, 401, cookie("", 0));
    }
    if (action === "logout") {
      const token = readCookie(request);
      if (token) {
        const { res } = await call("/parent/auth/logout", { refresh_token: token }, request);
        // Only drop the cookie once the API has revoked the session (or already considers it dead).
        if (!res.ok && res.status !== 401 && res.status !== 403) return json({ message: "Could not sign out. Please retry." }, 502);
      }
      return json({ message: "Logged out" }, 200, cookie("", 0));
    }
    return json({ message: "Not found" }, 404);
  } catch {
    return json({ message: "The SynQ API is unreachable." }, 503);
  }
}
