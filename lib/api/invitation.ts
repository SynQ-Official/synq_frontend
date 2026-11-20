import { apiUrl } from "./config";
import { unwrapEnvelope } from "./errors";

/**
 * Server-side check of an invitation link, run before the page renders (like `isResetLinkUsable`): the visitor is
 * signed out on purpose, so no session is involved and the link is NOT consumed. The API owns every rule (single use,
 * expiry, bound to one address); the page only reads its verdict.
 */
export type InvitationCheck =
  | { state: "usable"; email: string; expiresAt: string }
  | { state: "invalid" }
  /** The API could not answer (down, or throttling this server): say so instead of calling a good link expired. */
  | { state: "unavailable" };

export async function checkInvitation(token: string): Promise<InvitationCheck> {
  try {
    const res = await fetch(apiUrl("/auth/invitations/verify"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (res.status === 429 || res.status >= 500) return { state: "unavailable" };
    if (!res.ok) return { state: "invalid" };
    const body = unwrapEnvelope(await res.json().catch(() => null)) as { valid?: unknown; email?: unknown; expiresAt?: unknown } | null;
    if (body?.valid === true && typeof body.email === "string" && body.email) {
      return { state: "usable", email: body.email, expiresAt: typeof body.expiresAt === "string" ? body.expiresAt : "" };
    }
    return { state: "invalid" };
  } catch {
    return { state: "unavailable" };
  }
}
