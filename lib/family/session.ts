"use client";

import { apiUrl } from "@/lib/api/config";
import { ApiError, apiErrorFrom, readJson, unwrapEnvelope } from "@/lib/api/errors";

/**
 * The parent's session, kept apart from the patient's (`lib/api/tokens.ts`): its own in-memory access token, its own
 * refresh cookie (via `/api/family-session/*`), its own state. Signing in as a parent never touches a patient session.
 */
type State = boolean | null; // null until the first answer, then signed in or out
let accessToken: string | null = null;
let state: State = null;
let refreshing: Promise<boolean> | null = null;
const listeners = new Set<() => void>();

const set = (next: State) => {
  state = next;
  listeners.forEach((l) => l());
};

export const familySession = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  state: (): State => state,
};

async function gateway(action: "login" | "register" | "refresh" | "logout", body?: unknown) {
  let res: Response;
  try {
    res = await fetch(`/api/family-session/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}), cache: "no-store" });
  } catch {
    throw new ApiError("Network error — check your connection and retry.", 0);
  }
  const payload = await readJson(res);
  if (!res.ok) throw apiErrorFrom(payload, res.status);
  return unwrapEnvelope(payload) as { access_token?: string };
}

export async function familySignIn(email: string, password: string) {
  const { access_token } = await gateway("login", { email, password });
  accessToken = access_token ?? null;
  set(!!accessToken);
}

export async function familyRegister(input: { email: string; password: string; firstName: string; lastName: string; phone?: string; lang: "en" | "ar"; termsVersion: string }) {
  const { access_token } = await gateway("register", input);
  accessToken = access_token ?? null;
  set(!!accessToken);
}

export async function familySignOut() {
  await gateway("logout");
  accessToken = null;
  set(false);
}

/** One refresh at a time (the rotating refresh token must not be spent twice at once). */
export function refreshFamilySession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const { access_token } = await gateway("refresh");
      accessToken = access_token ?? null;
      set(!!accessToken);
      return !!accessToken;
    } catch (error) {
      accessToken = null;
      // An outage is not a sign-out: only a refused refresh ends the session in this tab.
      set(error instanceof ApiError && error.status === 0 ? null : false);
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export function ensureFamilySession(): Promise<boolean> {
  return state === null ? refreshFamilySession() : Promise.resolve(state === true);
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** A parent API call: bearer from memory, one refresh-and-retry on 401, ApiError on failure. */
export async function familyRequest<T>(method: Method, path: string, body?: unknown, query?: Record<string, string | number | undefined>): Promise<T> {
  await ensureFamilySession();
  const qs = query ? new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)])).toString() : "";
  const send = () => fetch(`${apiUrl(path)}${qs ? `?${qs}` : ""}`, {
    method,
    headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  let res: Response;
  try {
    res = await send();
    if (res.status === 401 && accessToken && (await refreshFamilySession())) res = await send();
  } catch {
    throw new ApiError("Network error — check your connection and retry.", 0);
  }
  const payload = await readJson(res);
  if (!res.ok) throw apiErrorFrom(payload, res.status);
  return unwrapEnvelope(payload) as T;
}
