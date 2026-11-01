"use client";

/**
 * Patient session, split the safe way:
 * - the short-lived ACCESS token lives only in this module's memory: no storage, nothing for an injected
 *   script to read at rest, gone on reload;
 * - the long-lived REFRESH token lives in an HttpOnly cookie that JavaScript cannot see at all
 *   (see `app/api/session/[action]/route.ts`). On load, `ensureSession` trades it for a fresh access token.
 * Only the non-secret `{ id, nickname }` of the user is kept in localStorage (the profile cache and greetings
 * need it before the first network answer).
 */
const USER_KEY = "vitamind_user";
/** The last loaded profile (see lib/patient/profile-cache.ts); it never outlives the session. */
export const PROFILE_CACHE_KEY = "vitamind_profile_cache";
/** The last account that signed in on this device (an id, not a secret): a different id arriving means the device changed hands. */
const OWNER_KEY = "vitamind_device_owner";
/** Keys of the old localStorage sessions and of retired features: removed on first load, so nothing stale is left lying in storage. */
const LEGACY_KEYS = [
  "vitamind_token",
  "vitamind_refresh_token",
  // `lib/storage/storage.ts` (removed) kept a user record with a hardcoded disease, and its own journal and chat copies.
  "vitamind_disease",
  "vitamind_journal_entries",
  "vitamind_chat_messages",
  "vitamind_journal_ratings",
  // Not tied to an account before: whoever signed in next inherited them. They now live under `key:<userId>`
  // (or, for the track, come from the profile) — the unscoped copies are dropped rather than guessed at.
  "vitamind_journal_draft",
  "vitamind_track",
  "vitamind_reminder_prefs",
  "vitamind_notifications_read",
  "vitamind-visitor-name",
];
/**
 * Everything that is one patient's own content (health, writing, conversation) and so must not outlive them on a
 * shared device. Harmless per-user preferences (reminder time, read notifications, language) are not listed: they
 * are keyed by user id and simply stay with that user.
 */
const PATIENT_DATA_PREFIXES = [
  PROFILE_CACHE_KEY,
  "vitamind_journal_draft",
  "vitamind-mira-session:", // `:<userId>:<chatId>` → the open Mira conversation's id (the conversation itself lives server-side)
  "vitamind-visitor-name", // `:<userId>` → the first name typed to Mira (sessionStorage)
  "mira:last-attempt-notice:", // sessionStorage
];

export type SessionUser = { id: string; nickname: string; tier?: string };

/** What the session routes hand to the browser: the refresh token is never part of it. */
export type AuthTokens = {
  access_token: string;
  user?: SessionUser;
};

/** `null` until the first answer from the session route (a reload has no access token yet), then signed in or out. */
export type SessionState = boolean | null;

let accessToken: string | null = null;
let state: SessionState = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(next: SessionState) {
  if (state === next) return;
  state = next;
  emit();
}

if (typeof window !== "undefined") {
  try {
    LEGACY_KEYS.forEach((key) => window.localStorage.removeItem(key));
    // The retired user record shared this key with the session identity and added the email (and a password field).
    const raw = window.localStorage.getItem(USER_KEY);
    if (raw && /"(email|password|disease)"/.test(raw)) window.localStorage.removeItem(USER_KEY);
  } catch {
    /* storage unavailable: nothing to clean */
  }
}

/** `base:<userId>` for this patient's own data; `null` when nobody is signed in (nothing personal may be stored then). */
export function patientKey(base: string): string | null {
  const id = getSessionUser()?.id;
  return id ? `${base}:${id}` : null;
}

/**
 * Removes every trace of the previous patient's content from this device: their profile, journal draft and Mira
 * conversation pointers, and the anonymous visitor's first name. Called on sign-out and when another account signs in.
 */
export function purgePatientData() {
  if (typeof window === "undefined") return;
  // Only listed prefixes: the language, theme, device fingerprint and other people's server records are untouched.
  for (const [store, extra] of [[() => window.localStorage, [USER_KEY, OWNER_KEY]], [() => window.sessionStorage, []]] as const) {
    try {
      const storage = store();
      const doomed: string[] = [...extra];
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (key && PATIENT_DATA_PREFIXES.some((prefix) => key.startsWith(prefix))) doomed.push(key);
      }
      doomed.forEach((key) => storage.removeItem(key));
    } catch {
      /* storage unavailable: nothing was stored */
    }
  }
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAccessToken() {
  return accessToken;
}

export function getSessionState(): SessionState {
  return state;
}

export function getSessionUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    const user = raw ? (JSON.parse(raw) as Partial<SessionUser>) : null;
    // Only the identity this module writes: anything else under the key is not a session.
    return user && typeof user.id === "string" && typeof user.nickname === "string" ? (user as SessionUser) : null;
  } catch {
    return null;
  }
}

/** `exp` of a JWT in ms; `undefined` when it has none, `null` when the token cannot be read. */
function jwtExpiry(token: string): number | undefined | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const payload = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : undefined;
  } catch {
    return null;
  }
}

/** A signed-in session whose access token has not run out (an expired one is renewed on the next call). */
export function hasValidSession() {
  if (!accessToken || state !== true) return false;
  const exp = jwtExpiry(accessToken);
  return exp === undefined || (exp !== null && exp > Date.now());
}

export function isAuthenticated() {
  return state === true;
}

export function saveTokens(tokens: AuthTokens) {
  accessToken = tokens.access_token;
  if (tokens.user && typeof window !== "undefined") {
    try {
      // A different patient than the last one on this device (e.g. the previous session simply expired): nothing of
      // theirs may carry over. The same patient coming back keeps their draft and preferences.
      const owner = window.localStorage.getItem(OWNER_KEY);
      if (tokens.user.id && owner && owner !== tokens.user.id) purgePatientData();
      if (tokens.user.id) window.localStorage.setItem(OWNER_KEY, tokens.user.id);
      window.localStorage.setItem(USER_KEY, JSON.stringify(tokens.user));
    } catch {
      /* storage unavailable — greetings fall back to the profile */
    }
  }
  if (state === true) emit();
  else setState(true);
}

/** Forget the session in this tab. (The cookie itself is cleared by the server: logout, or a failed refresh.) */
export function clearTokens() {
  accessToken = null;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(USER_KEY);
      window.localStorage.removeItem(PROFILE_CACHE_KEY);
    } catch {
      /* ignore */
    }
  }
  if (state === false) emit();
  else setState(false);
}

/** Marks a reload that found no usable session (no cookie, or the network was down) without touching the cookie. */
export function markSignedOut() {
  accessToken = null;
  setState(false);
}
