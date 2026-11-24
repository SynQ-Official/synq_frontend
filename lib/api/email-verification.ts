import { api } from "./client";

/**
 * Patient e-mail verification. The verify call is public (the token is the proof); the resend needs the patient's own
 * session, like every other patient call. The parent's equivalents live in lib/family/api.ts.
 */
export const emailVerificationApi = {
  verify: (token: string) => api.post<unknown>("/auth/verify-email", { token }, { auth: false }),
  resend: () => api.post<unknown>("/auth/verify-email/resend"),
};
