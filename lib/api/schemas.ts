import { z } from "zod";
import type { Profile } from "./patient-types";
import type { AuthTokens } from "./tokens";

/**
 * Runtime checks for the payloads the app cannot do without (the session, the profile, Mira's result).
 * Each schema is typed against the app's own type, so the compiler keeps the two in step.
 */
export type Schema<T> = z.ZodType<T, z.ZodTypeDef, unknown>;

const sessionUserSchema = z.object({ id: z.string(), nickname: z.string() });

export const authTokensSchema: Schema<AuthTokens> = z.object({
  access_token: z.string().min(1),
  user: sessionUserSchema.optional(),
});

/**
 * Login answers one of three things: a session, a two-factor challenge (the patient app has no such flow), or, for an
 * account a clinician created, a short-lived token that can only be traded for a new password. That token is not a
 * session: it never reaches `saveTokens`.
 */
export const loginResponseSchema = z.object({
  access_token: z.string().min(1).optional(),
  user: sessionUserSchema.optional(),
  requires_2fa: z.boolean().optional(),
  requires_password_change: z.boolean().optional(),
  password_change_token: z.string().min(1).optional(),
});

/** Accepting an invitation opens a session and says where the patient goes next (the clinician may have set the track). */
export const invitationAcceptedSchema = z.object({
  access_token: z.string().min(1),
  user: sessionUserSchema.optional(),
  next: z.enum(["TRACK", "MIRA_ORIENTATION"]).optional().catch(undefined),
});

export const profileSchema: Schema<Profile> = z.object({
  id: z.string(),
  nickname: z.string(),
  email: z.string(),
  language: z.enum(["EN", "AR"]),
  track: z.enum(["ADHD", "BIPOLAR", "SCHIZOPHRENIA", "UNSPECIFIED"]),
  orientationCompleted: z.boolean().optional(),
  hasCompletedOnboarding: z.boolean(),
  phoneNumber: z.string().nullish().transform((value) => value ?? null),
  trackAssignedByClinician: z.boolean().optional(),
  memberSince: z.string(),
  careTeam: z.object({ hasClinician: z.boolean(), count: z.number() }),
});
