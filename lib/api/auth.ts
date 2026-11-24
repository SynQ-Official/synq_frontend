import type { z } from "zod";
import { unwrap } from "./client";
import { ApiError, apiErrorFrom, readJson } from "./errors";
import { authTokensSchema, invitationAcceptedSchema, loginResponseSchema, type Schema } from "./schemas";
import { clearTokens, purgePatientData, saveTokens, type AuthTokens } from "./tokens";

/** Patient auth — `/api/v1/auth/*` (UserAuthController). */

export type RegisterInput = {
  email: string;
  password: string;
  nickname: string;
  phone?: string;
  lang?: "en" | "ar";
  /** Version of the consent text accepted at signup; the API stores it with the account. */
  consentVersion?: string;
  /** "YYYY-MM-DD". The API refuses anyone under 18 (UNDER_18) and an impossible date (INVALID_BIRTH_DATE). */
  birthDate: string;
  /** ISO 3166-1 alpha-2, uppercase. */
  country: string;
};

/** The patient app has no two-factor flow: an account that answers with a challenge cannot sign in here. */
type LoginResponse = z.infer<typeof loginResponseSchema>;

/**
 * `password_change_required`: a clinician-created account just proved its temporary password. There is NO session yet.
 * `adult_consent_required`: an adult account must accept its own account first (family access ends). No session yet either.
 */
export type LoginOutcome = "signed_in" | "password_change_required" | "adult_consent_required";

export type AcceptInvitationInput = {
  token: string;
  /** The address the invitation was sent to: the API refuses any other. */
  email: string;
  nickname: string;
  /** "YYYY-MM-DD". The API refuses anyone under 18 (UNDER_18) and an impossible date (INVALID_BIRTH_DATE). */
  birthDate: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  lang?: "en" | "ar";
  /** Only when the patient ticked the orientation consent; it can also be given later, in Mira. */
  consentVersion?: string;
};

/** Where the API says the patient goes after accepting: their track is already set (`TRACK`) or Mira's orientation is next. */
export type InvitationNext = "TRACK" | "MIRA_ORIENTATION";

/**
 * Proof that the temporary password was right: good for ONE password change and nothing else (the API refuses it on every
 * other route). It lives in this module's memory only: never in storage, never in a URL, gone on reload, so a patient who
 * reloads simply signs in again. It is deliberately not part of the session in `tokens.ts`.
 */
const PASSWORD_CHANGE_WINDOW_MS = 14 * 60_000; // the API's token lasts 15 minutes
let passwordChange: { token: string; expiresAt: number } | null = null;

/** True while a password change is waiting to be completed (the change screen asks; with none it sends the patient to sign in). */
export function hasPendingPasswordChange(): boolean {
  if (passwordChange && passwordChange.expiresAt <= Date.now()) passwordChange = null;
  return passwordChange !== null;
}

/** Drops the proof (the patient left the change screen, or the API refused it). */
export function cancelPasswordChange(): void {
  passwordChange = null;
}

/** The adult-consent token, held exactly like the password-change proof: memory only, short-lived, single use. */
let adultConsent: { token: string; expiresAt: number } | null = null;
// shortcut: lifetime assumed equal to the password-change token (15 min), upgrade if the API documents another value.
const ADULT_CONSENT_WINDOW_MS = 14 * 60_000;

/** True while the adult consent waits to be accepted (the consent screen asks; with none it sends the patient to sign in). */
export function hasPendingAdultConsent(): boolean {
  if (adultConsent && adultConsent.expiresAt <= Date.now()) adultConsent = null;
  return adultConsent !== null;
}

export function cancelAdultConsent(): void {
  adultConsent = null;
}

function withoutEmpty<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined && v !== null && v !== "")) as Partial<T>;
}

/** The credentials go to the same-origin session route, which keeps the refresh token in an HttpOnly cookie. */
async function session<T>(action: "login" | "register" | "logout" | "change-password" | "accept-invitation" | "adult-consent", body: unknown, schema?: Schema<T>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/session/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
  } catch {
    throw new ApiError("Network error — check your connection and retry.", 0);
  }
  const payload = await readJson(res);
  if (!res.ok) throw apiErrorFrom(payload, res.status);
  return unwrap(payload, schema, res.status);
}

export const authApi = {
  async register(input: RegisterInput): Promise<AuthTokens> {
    const res = await session("register", withoutEmpty(input), authTokensSchema);
    // The nickname chosen at signup is the name Mira uses, even if the response carries no user.
    const nickname = input.nickname.trim();
    const withUser: AuthTokens = res.user ? res : { ...res, user: { id: "", nickname } };
    if (withUser.user && !withUser.user.nickname) withUser.user = { ...withUser.user, nickname };
    saveTokens(withUser);
    return withUser;
  },

  async login(email: string, password: string): Promise<LoginOutcome> {
    const res: LoginResponse = await session("login", { email, password }, loginResponseSchema);
    if (res.requires_password_change && res.password_change_token && !res.access_token) {
      passwordChange = { token: res.password_change_token, expiresAt: Date.now() + PASSWORD_CHANGE_WINDOW_MS };
      return "password_change_required";
    }
    if (res.requires_adult_consent && res.adult_consent_token && !res.access_token) {
      adultConsent = { token: res.adult_consent_token, expiresAt: Date.now() + ADULT_CONSENT_WINDOW_MS };
      return "adult_consent_required";
    }
    if (!res.access_token) throw new Error("This account cannot sign in here.");
    saveTokens({ access_token: res.access_token, user: res.user });
    return "signed_in";
  },

  /**
   * Accepts the adult account (single use). The API answers with a session, or with a two-factor challenge this app
   * cannot run (the same refusal as login). A 401 means the token is spent or expired: it is dropped.
   */
  async acceptAdultConsent(): Promise<void> {
    if (!hasPendingAdultConsent() || !adultConsent) throw new ApiError("Your sign-in expired. Please sign in again.", 401, "ADULT_CONSENT_EXPIRED");
    const { token } = adultConsent;
    let res: LoginResponse;
    try {
      res = await session("adult-consent", { token, accept: true }, loginResponseSchema);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) adultConsent = null;
      throw error;
    }
    adultConsent = null;
    if (!res.access_token) throw new Error("This account cannot sign in here.");
    saveTokens({ access_token: res.access_token, user: res.user });
  },

  /**
   * Trades the held proof and the patient's own new password for a real session (single use). A refusal that says the
   * proof is spent or expired (401) drops it; a rejected password (400) keeps it so the patient can try another.
   */
  async completePasswordChange(password: string, confirmPassword: string): Promise<void> {
    if (!hasPendingPasswordChange() || !passwordChange) throw new ApiError("Your sign-in expired. Please sign in again.", 401, "PASSWORD_CHANGE_EXPIRED");
    const { token } = passwordChange;
    let tokens: AuthTokens;
    try {
      tokens = await session("change-password", { password_change_token: token, password, confirmPassword }, authTokensSchema);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) passwordChange = null;
      throw error;
    }
    passwordChange = null;
    saveTokens(tokens);
  },

  /** Creates the account from an invitation (the API checks the link, the address and the single use) and opens the session. */
  async acceptInvitation(input: AcceptInvitationInput): Promise<InvitationNext> {
    clearTokens(); // nothing of a previous session rides along
    const res = await session("accept-invitation", withoutEmpty(input), invitationAcceptedSchema);
    saveTokens({ access_token: res.access_token, user: res.user });
    return res.next ?? "MIRA_ORIENTATION";
  },

  /**
   * The session route revokes the refresh token server-side and only then drops the cookie. This tab forgets the
   * session only after that succeeds: a failed call throws and leaves everything as it was, so it can be retried.
   */
  async logout(): Promise<void> {
    await session<{ message: string }>("logout", {});
    clearTokens();
    purgePatientData(); // explicit sign-out: the next person on this device inherits nothing
  },
};
