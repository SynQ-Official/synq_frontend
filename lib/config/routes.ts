/** Public routes referenced across headers, CTAs and funnels — one place to rename a URL. */
export const ROUTES = {
  home: "/",
  orientation: "/orientation",
  mira: "/mira",
  lumina: "/lumina",
  psy: "/clinician",
  tracks: "/tracks",
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
  /** Adults create their own patient account here. Patients a clinic invites use ROUTES.invitation instead. */
  signUp: "/auth/signup",
  /** First sign-in of an account a clinician created: replace the temporary password. */
  changePassword: "/auth/change-password",
  /** The link in a clinician's invitation e-mail (the API puts `?token=` after it). */
  invitation: "/invitation",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
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
 * Where an agent's button leads. A signed-in patient goes straight in; an adult who is not signed in is asked to create
 * an account (Mira) or sign in (Lumina) first, with a `from` hint so the form can say why. A patient a clinic invited
 * uses the e-mailed link (ROUTES.invitation) or /invite. Clinicians go to their own sign-in.
 */
export function agentEntryHref(agent: AgentEntry, signedIn: boolean) {
  if (agent === "psy") return PSY_APP_URL ? `${PSY_APP_URL}/signin` : ROUTES.clinicAccess;
  if (agent === "mira") {
    return signedIn ? ROUTES.orientation : `${ROUTES.signUp}?from=orientation&redirect=${encodeURIComponent(ROUTES.orientation)}`;
  }
  return signedIn ? ROUTES.dashboard : `${ROUTES.signIn}?role=patient&from=lumina&redirect=${encodeURIComponent(ROUTES.dashboard)}`;
}
