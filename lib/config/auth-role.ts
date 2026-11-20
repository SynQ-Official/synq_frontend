import { ROUTES } from "./routes";

/**
 * The account type a visitor signs in as. It is chosen explicitly on `/auth/signin` and selects which of the two
 * independent auth systems runs (patient: `/api/session/*`, parent: `/api/family-session/*`). Never inferred.
 */
export type AuthRole = "patient" | "parent";

export const FAMILY_HOME = "/family";
export const FAMILY_REGISTER = "/family/register";

export const parseRole = (value: string | null | undefined): AuthRole | null => (value === "patient" || value === "parent" ? value : null);

/**
 * Where each role may be sent after signing in: internal paths inside its OWN area only (no open redirect, no landing
 * in the other role's app). The portal's public pages (register, the legacy sign-in alias) are excluded: they would loop.
 */
const ALLOWED: Record<AuthRole, RegExp> = {
  patient: /^\/dashboard(?:[/?]|$)/,
  parent: /^\/family(?!\/(?:sign-in|register)(?:[/?]|$))(?:[/?]|$)/,
};
const HOME: Record<AuthRole, string> = { patient: ROUTES.dashboard, parent: FAMILY_HOME };

export const roleHome = (role: AuthRole) => HOME[role];

/** The requested destination when it belongs to `role`, else `null`. */
export const roleDestination = (role: AuthRole, redirect: string | null | undefined) => (redirect && ALLOWED[role].test(redirect) ? redirect : null);

/** Canonical sign-in URL for a role, carrying a destination only if it is valid for that role. */
export function signInHref(role: AuthRole, redirect?: string | null) {
  const params = new URLSearchParams({ role });
  const target = roleDestination(role, redirect);
  if (target) params.set("redirect", target);
  return `${ROUTES.signIn}?${params}`;
}
