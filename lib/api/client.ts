import { linkedAbort } from "@/lib/async";
import { apiUrl } from "./config";
import { ApiError, INVALID_RESPONSE, apiErrorFrom, readJson, unwrapEnvelope } from "./errors";
import { authTokensSchema, type Schema } from "./schemas";
import { clearTokens, getAccessToken, getSessionState, markSignedOut, saveTokens } from "./tokens";

/**
 * Browser API client for the patient app. Calls the Nest API directly under
 * /api/v1, attaches the patient bearer token, refreshes it once on 401, and maps
 * failures to ApiError. A `schema` checks the payload at runtime instead of trusting a cast.
 */

export { ApiError, INVALID_RESPONSE, messageFrom, readJson } from "./errors";

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

/**
 * Accept both raw payloads and the optional `{ success, data }` envelope. With a schema the payload is
 * validated at runtime; without one it is trusted as `T` (the remaining, non-critical endpoints).
 */
export function unwrap<T>(payload: unknown, schema?: Schema<T>, status = 200): T {
  const data = unwrapEnvelope(payload);
  if (!schema) return data as T;
  const parsed = schema.safeParse(data);
  if (parsed.success) return parsed.data;
  throw new ApiError("The SynQ API sent an answer this app cannot read.", status, INVALID_RESPONSE, payload);
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestOptions<T = unknown> = {
  method?: Method;
  query?: QueryParams;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Attach the patient bearer token (default true). */
  auth?: boolean;
  /** How long to wait for the API to answer (default 10 s; agent-backed calls pass AGENT_TIMEOUT_MS). */
  timeoutMs?: number;
  /** Validates the response body at runtime (see `unwrap`). */
  schema?: Schema<T>;
};

let refreshing: Promise<boolean> | null = null;

/** Asks the same-origin session route to trade the HttpOnly refresh cookie for a new access token. */
async function requestRefresh(): Promise<"ok" | "rejected" | "unreachable"> {
  try {
    const res = await fetch("/api/session/refresh", { method: "POST", cache: "no-store" });
    if (res.ok) {
      saveTokens(unwrap(await readJson(res), authTokensSchema));
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
      // legacy: lock name kept so tabs on the old bundle never refresh concurrently (token rotation); rename after 2026-12-22
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

/** The headers of one call: JSON when there is a body, the bearer token unless `auth: false`. */
async function requestHeaders(options: RequestOptions<unknown>): Promise<{ headers: Record<string, string>; token: string | null }> {
  const headers: Record<string, string> = { ...options.headers };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.auth !== false) await ensureSession();
  const token = options.auth === false ? null : getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return { headers, token };
}

/** One fetch under the caller's signal and the timeout; failures that never reached an answer become ApiErrors. */
async function fetchOnce(path: string, options: RequestOptions<unknown>, headers: Record<string, string>): Promise<Response> {
  const link = linkedAbort(options.signal, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    return await fetch(`${apiUrl(path)}${toQueryString(options.query)}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: link.signal,
      cache: "no-store",
    });
  } catch (error) {
    if (link.timedOut) throw new ApiError("This is taking longer than usual. Please try again.", 0, "TIMEOUT");
    if ((error as Error)?.name === "AbortError") throw error;
    throw new ApiError("Network error — check your connection and retry.", 0);
  } finally {
    link.dispose();
  }
}

/** Sends once; on a 401 with a token, renews the session (shared across callers) and sends exactly once more. */
async function send(path: string, options: RequestOptions<unknown>, retry: boolean): Promise<Response> {
  const { headers, token } = await requestHeaders(options);
  const res = await fetchOnce(path, options, headers);
  if (res.status === 401 && retry && token && (await refreshSession())) return send(path, options, false);
  return res;
}

export async function apiRequest<T>(path: string, options: RequestOptions<T> = {}): Promise<T> {
  const res = await send(path, options, true);
  const payload = await readJson(res);
  if (!res.ok) throw apiErrorFrom(payload, res.status);
  return unwrap(payload, options.schema, res.status);
}

/** A file answer (the data export): the same auth, refresh and error mapping as `apiRequest`, but the body is kept as a Blob. */
export async function apiDownload(path: string, options: RequestOptions<unknown> = {}): Promise<Blob> {
  const res = await send(path, options, true);
  if (!res.ok) throw apiErrorFrom(await readJson(res), res.status);
  return res.blob();
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
  get: <T>(path: string, query?: QueryParams, options?: RequestOptions<T>): Promise<T> =>
    apiRequest<T>(path, { ...options, query }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions<T>): Promise<T> =>
    apiRequest<T>(path, { ...options, method: "POST", body: body ?? {} }),
  put: <T>(path: string, body: unknown, options?: RequestOptions<T>): Promise<T> =>
    apiRequest<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions<T>): Promise<T> =>
    apiRequest<T>(path, { ...options, method: "PATCH", body: body ?? {} }),
  delete: <T>(path: string, options?: RequestOptions<T>): Promise<T> => apiRequest<T>(path, { ...options, method: "DELETE" }),
};
