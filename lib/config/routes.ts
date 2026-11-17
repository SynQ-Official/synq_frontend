/** Public routes referenced across headers, CTAs and funnels — one place to rename a URL. */
export const ROUTES = {
  home: "/",
  orientation: "/orientation",
  mira: "/mira",
  lumina: "/lumina",
  psy: "/clinician",
  tracks: "/tracks",
  trust: "/trust",
  support: "/support",
  signIn: "/auth/signin",
  signUp: "/auth/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  dashboard: "/dashboard",
} as const;

/**
 * until then the page's button leads to the support page, where a clinician can ask for access.
 */
export const PSY_APP_URL = (process.env.NEXT_PUBLIC_PSY_URL ?? "").replace(/\/+$/, "");

export type AgentEntry = "mira" | "lumina" | "psy";

/**
 * Where an agent's button leads. Both agents are members-only: a signed-in patient goes straight in (Mira's
 * orientation, which sends an account that already finished to the dashboard; Lumina's dashboard), anyone else
 * is asked to sign up (Mira) or sign in (Lumina) first, with a `from` hint so the form can say why.
 */
export function agentEntryHref(agent: AgentEntry, signedIn: boolean) {
  if (agent === "psy") return PSY_APP_URL ? `${PSY_APP_URL}/signin` : ROUTES.support;
  if (agent === "mira") {
    return signedIn ? ROUTES.orientation : `${ROUTES.signUp}?from=orientation&redirect=${encodeURIComponent(ROUTES.orientation)}`;
  }
  return signedIn ? ROUTES.dashboard : `${ROUTES.signIn}?from=lumina&redirect=${encodeURIComponent(ROUTES.dashboard)}`;
}
