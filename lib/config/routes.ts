/** Public routes referenced across headers, CTAs and funnels — one place to rename a URL. */
export const ROUTES = {
  home: "/",
  orientation: "/orientation",
  mira: "/mira",
  lumina: "/lumina",
  psy: "/clinician",
  /** The three care paths (ADHD, bipolar disorder, psychosis). Was /tracks (301 in next.config.ts). */
  tracks: "/care-paths",
  privacy: "/privacy",
  /** The Terms of Use are the second document on /privacy; /terms redirects here (next.config.ts). */
  terms: "/privacy#terms",
  support: "/support",
  /** Emergency numbers, static: the "Need help now" button's no-JavaScript target. */
  help: "/help",
  /** "I have a clinic invitation": how to open the e-mailed link, and what to do without one. */
  invite: "/invite",
  /** Short form for clinicians and clinics who want SynQ. */
  clinicAccess: "/clinic-access",
  signIn: "/auth/signin",
  /** Open patient sign-up for adults. A clinician's invitation uses ROUTES.invitation instead. */
  signUp: "/auth/signup",
  /** Parent account: registration, then a request the child's clinician approves. */
  familyRegister: "/family/register",
  /** First sign-in of an account a clinician created: replace the temporary password. */
  changePassword: "/auth/change-password",
  /** An adult account's own consent before its first session (family access ends with it). */
  adultConsent: "/auth/adult-consent",
  /** The link in a clinician's invitation e-mail (the API puts `?token=` after it). */
  invitation: "/invitation",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  /** The link in a patient's verification e-mail (the API puts `?token=` after it). */
  verifyEmail: "/verify-email",
  /** Parent counterparts of the password and e-mail links: the parent portal's own pages. */
  familyForgotPassword: "/family/forgot-password",
  familyResetPassword: "/family/reset-password",
  familyVerifyEmail: "/family/verify-email",
  dashboard: "/dashboard",
  checkIn: "/dashboard/check-in",
  welcome: "/welcome",
} as const;

/**
 * The clinician app's origin (NEXT_PUBLIC_PSY_URL). Until it is set, the clinician button asks for clinic access instead.
 */
export const PSY_APP_URL = (process.env.NEXT_PUBLIC_PSY_URL ?? "").replace(/\/+$/, "");

export type AgentEntry = "mira" | "lumina" | "psy";

/**
 * Where an agent's button leads. A signed-in patient goes straight in; a signed-out adult creates an account (Mira) or
 * signs in (Lumina) first, with a `from` hint so the form can say why. Clinicians go to their own sign-in once the
 * clinician app is live, and to the application form (reviewed by the SynQ team) until then.
 */
export function agentEntryHref(agent: AgentEntry, signedIn: boolean) {
  if (agent === "psy") return PSY_APP_URL ? `${PSY_APP_URL}/signin` : ROUTES.clinicAccess;
  if (agent === "mira") {
    return signedIn ? ROUTES.orientation : `${ROUTES.signUp}?from=orientation&redirect=${encodeURIComponent(ROUTES.orientation)}`;
  }
  return signedIn ? ROUTES.dashboard : `${ROUTES.signIn}?role=patient&from=lumina&redirect=${encodeURIComponent(ROUTES.dashboard)}`;
}
