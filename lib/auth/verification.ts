import { ApiError } from "@/lib/api/errors";

/**
 * E-mail verification outcomes, shared by the verify page and the "resend" banner (patient and parent alike).
 * Pure apart from `runResend`, which only awaits the caller's request.
 */
export type ResendResult = "sent" | "alreadyVerified" | "throttled" | "error";

/** What the API answered to a resend: `{ sent: true }` or `{ alreadyVerified: true }`; anything else is a contract break. */
export function resendAnswer(body: unknown): "sent" | "alreadyVerified" | null {
  if (!body || typeof body !== "object") return null;
  const answer = body as { sent?: unknown; alreadyVerified?: unknown };
  if (answer.alreadyVerified === true) return "alreadyVerified";
  if (answer.sent === true) return "sent";
  return null;
}

/** Runs one resend request and reports it as a banner outcome. 429 is the API's throttle. */
export async function runResend(send: () => Promise<unknown>): Promise<ResendResult> {
  try {
    return resendAnswer(await send()) ?? "error";
  } catch (error) {
    return error instanceof ApiError && error.status === 429 ? "throttled" : "error";
  }
}

/** A verify refusal is "invalid" when the API names the token as invalid/expired or answers 400; 5xx and network failures are an outage. */
export function verifyFailure(error: unknown): "invalid" | "unavailable" {
  if (!(error instanceof ApiError)) return "unavailable";
  return error.code === "VERIFICATION_TOKEN_INVALID" || error.status === 400 ? "invalid" : "unavailable";
}
