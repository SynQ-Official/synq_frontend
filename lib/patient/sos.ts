import { ApiError } from "@/lib/api/errors";

/** Why an SOS did not go through, in the three ways the patient is told apart. */
export type SosFailure = "rateLimited" | "offline" | "other";

/**
 * 429 is the API's throttle (5 per 10 minutes); a call that never reached the API is `offline`; everything else, a
 * timeout included, is `other`. A timeout is safe to repeat: the API answers a repeat with the alert already open.
 */
export function sosFailureOf(error: unknown): SosFailure {
  if (!(error instanceof ApiError)) return "other";
  if (error.status === 429) return "rateLimited";
  return error.isNetwork ? "offline" : "other";
}

/**
 * One phone number: an optional "+", an optional area code in parentheses, then digit groups joined by a space, dot or
 * dash. Parentheses are NOT allowed inside the digits: in "SAMU 190 (24/7)" the number is 190, and the opening hours
 * must never be glued onto it (a wrong dial link on an SOS screen is worse than none).
 */
const PHONE = /\+?(?:\(\d{1,5}\)[\s.-]?)?\d[\d\s.-]*\d/;

/** A `tel:` link for the first phone number in a resource line ("Clinic: +216 12 345 678"), or null when it has none. */
export function telHref(line: string): string | null {
  const match = line.match(PHONE);
  if (!match) return null;
  const digits = match[0].replace(/[^\d+]/g, "");
  return digits.replace(/\D/g, "").length >= 3 ? `tel:${digits}` : null;
}
