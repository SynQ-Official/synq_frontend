import { apiUrl } from "./config";
import { clearTokens, getAccessToken, getSessionState, markSignedOut, saveTokens, type AuthTokens } from "./tokens";

/**
 * Browser API client for the patient app. Calls the Nest API directly under
 * /api/v1, attaches the patient bearer token, refreshes it once on 401, and maps
 * failures to ApiError. Mira is the exception: it goes through the same-origin
 * `/api/mira` route so the anti-abuse identity is forwarded (see lib/api/mira.ts).
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isUnauthorized() {
    return this.status === 401;
  }
  get isConflict() {
    return this.status === 409;
  }
  /** The request never got an answer in time (slow network or a sleeping server). */
  get isTimeout() {
    return this.code === "TIMEOUT";
  }
  /** The request never reached the API (offline, DNS, CORS...). */
  get isNetwork() {
    return this.status === 0 && !this.isTimeout;
  }
}

/** Plain calls should answer quickly; anything that waits on an AI agent opts into the longer budget. */
export const DEFAULT_TIMEOUT_MS = 10_000;
export const AGENT_TIMEOUT_MS = 60_000;

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

export function toQueryString(query?: QueryParams): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

const DEFAULT_MESSAGES: Record<number, string> = {
  400: "The request was rejected. Check the values and try again.",
  401: "Your session expired. Please sign in again.",
  403: "You are not allowed to perform this action.",
  404: "This record no longer exists.",
  409: "This action is no longer possible.",
  429: "Too many requests. Please wait a moment and retry.",
  502: "The SynQ API is unreachable.",
};

export function messageFrom(payload: unknown, status: number): string {
  if (payload && typeof payload === "object") {
    const { message, error } = payload as { message?: unknown; error?: unknown };
    if (Array.isArray(message) && message.length) return message.join(", ");
    if (typeof message === "string" && message.trim()) return message;
    if (typeof error === "string" && error.trim()) return error;
  }
  return DEFAULT_MESSAGES[status] ?? `Request failed (HTTP ${status}).`;
}

/** Accept both raw payloads and the optional `{ success, data }` envelope. */
export function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "success" in payload && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export async function readJson(res: Response): Promise<unknown> {
  if (res.status === 204) return undefined;
  if (!(res.headers.get("content-type") || "").includes("application/json")) return null;
  return res.json().catch(() => null);
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestOptions = {
  method?: Method;
  query?: QueryParams;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Attach the patient bearer token (default true). */
  auth?: boolean;
  /** How long to wait for the API to answer (default 10 s; agent-backed calls pass AGENT_TIMEOUT_MS). */
  timeoutMs?: number;
};

let refreshing: Promise<boolean> | null = null;

/** Asks the same-origin session route to trade the HttpOnly refresh cookie for a new access token. */
async function requestRefresh(): Promise<"ok" | "rejected" | "unreachable"> {
  try {
    const res = await fetch("/api/session/refresh", { method: "POST", cache: "no-store" });
    if (res.ok) {
      saveTokens(unwrap<AuthTokens>(await readJson(res)));
      return "ok";
    }
    return res.status >= 500 ? "unreachable" : "rejected";
  } catch {
    return "unreachable";
  }
}

/**
 * One shared refresh at a time, and one across tabs too (the rotating refresh token must not be spent twice
 * at once). On rejection the session is cleared; if the network is down it is not (the cookie is still good).
 */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
      const outcome = locks ? await locks.request("vitamind-session-refresh", requestRefresh) : await requestRefresh();
      if (outcome === "rejected") clearTokens();
      else if (outcome === "unreachable") markSignedOut();
      return outcome === "ok";
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/** After a reload there is no access token in memory: the first caller restores the session from the cookie. */
export function ensureSession(): Promise<boolean> {
  return getSessionState() === null ? refreshSession() : Promise.resolve(getSessionState() === true);
}

async function send(path: string, options: RequestOptions, retry: boolean): Promise<Response> {
  const headers: Record<string, string> = { ...options.headers };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.auth !== false) await ensureSession();
  const token = options.auth === false ? null : getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  // One controller for both the caller's own cancel and the request timeout.
  const controller = new AbortController();
  const onCallerAbort = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  else options.signal?.addEventListener("abort", onCallerAbort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${apiUrl(path)}${toQueryString(options.query)}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (error) {
    if (timedOut) throw new ApiError("This is taking longer than usual. Please try again.", 0, "TIMEOUT");
    if ((error as Error)?.name === "AbortError") throw error;
    throw new ApiError("Network error — check your connection and retry.", 0);
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onCallerAbort);
  }

  if (res.status === 401 && retry && token && (await refreshSession())) {
    return send(path, options, false);
  }
  return res;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await send(path, options, true);
  const payload = await readJson(res);
  if (!res.ok) {
    const code = payload && typeof payload === "object" ? (payload as { code?: string }).code : undefined;
    throw new ApiError(messageFrom(payload, res.status), res.status, code, payload);
  }
  return unwrap<T>(payload);
}

/**
 * A POST that survives the page being closed, for a `pagehide` handler. Everything is synchronous on purpose: nothing
 * after an `await` is sure to run once the page is going away, so there is no session refresh here, only the token
 * already held. `keepalive` lets the browser finish the request after unload. (`navigator.sendBeacon` is the usual tool,
 * but it cannot carry the Authorization header this API needs.) The caller makes the request idempotent.
 */
export function sendOnClose(path: string, body: unknown): void {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  void fetch(apiUrl(path), { method: "POST", headers, body: JSON.stringify(body), keepalive: true, cache: "no-store" }).catch(() => undefined);
}

export const api = {
  get: <T>(path: string, query?: QueryParams, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, query }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "POST", body: body ?? {} }),
  put: <T>(path: string, body: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "PATCH", body: body ?? {} }),
  delete: <T>(path: string, options?: RequestOptions) => apiRequest<T>(path, { ...options, method: "DELETE" }),
};
