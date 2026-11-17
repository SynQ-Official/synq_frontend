/**
 * The patient's refresh token never reaches browser JavaScript: it lives in this cookie, set and read only by
 * the `/api/session/*` route handlers. HttpOnly keeps XSS from reading it, Secure keeps it off plain HTTP in
 * production, SameSite=Strict keeps other sites from riding it, and the narrow Path means it is sent to the
 * session routes and nowhere else.
 */
export const REFRESH_COOKIE = "vitamind_rt";
const COOKIE_PATH = "/api/session";
const FALLBACK_TTL_S = 7 * 24 * 60 * 60;

const secure = () => process.env.NODE_ENV === "production";

/** Remaining life of a JWT in seconds (the cookie must not outlive the token it holds). */
function ttlSeconds(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8")) as { exp?: number };
    if (typeof payload.exp === "number") return Math.max(0, Math.floor(payload.exp - Date.now() / 1000));
  } catch {
    /* not a readable JWT: use the default */
  }
  return FALLBACK_TTL_S;
}

/**
 * A presence-only hint that a session exists, readable by `proxy.ts` on /dashboard and /welcome (the refresh cookie's
 * narrow Path never reaches those routes). It carries no token and grants nothing: the API still decides.
 */
export const SESSION_HINT_COOKIE = "vitamind_s";

const attrs = (path: string, maxAge: number, sameSite: "Strict" | "Lax") =>
  [`Path=${path}`, `Max-Age=${maxAge}`, "HttpOnly", `SameSite=${sameSite}`, secure() ? "Secure" : ""].filter(Boolean).join("; ");

/** `Set-Cookie` values that open a session: the refresh token and the presence hint (same lifetime). */
export function refreshCookie(token: string): string[] {
  const ttl = ttlSeconds(token);
  return [`${REFRESH_COOKIE}=${token}; ${attrs(COOKIE_PATH, ttl, "Strict")}`, `${SESSION_HINT_COOKIE}=1; ${attrs("/", ttl, "Lax")}`];
}

/** `Set-Cookie` values that end it. */
export function clearedCookie(): string[] {
  return [`${REFRESH_COOKIE}=; ${attrs(COOKIE_PATH, 0, "Strict")}`, `${SESSION_HINT_COOKIE}=; ${attrs("/", 0, "Lax")}`];
}

export function readRefreshCookie(request: Request): string | null {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === REFRESH_COOKIE) return value.join("=") || null;
  }
  return null;
}
