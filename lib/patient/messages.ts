import type { SecureMessage, SosDelivery, SosResult, SosStatus } from "@/lib/api/patient-types";

/**
 * How one message of the care thread is drawn. SYSTEM messages come from the platform, never from a person: they get a
 * neutral bubble with no clinician name, so a clinician is never made to "say" something they did not write.
 */
export function bubbleKind(role: SecureMessage["senderRole"]): "mine" | "clinician" | "system" {
  if (role === "PATIENT") return "mine";
  return role === "SYSTEM" ? "system" : "clinician";
}

/** The count shown on the Care tab: nothing at zero, "9+" beyond nine so it never widens the tab. */
export function unreadBadge(count: number | null | undefined): string | null {
  if (!count || count < 1) return null;
  return count > 9 ? "9+" : String(count);
}

/** An SOS still worth following: it exists and has not been closed. */
export function sosIsOpen(status: SosStatus | null | undefined): status is SosStatus {
  return !!status && status.state !== "RESOLVED";
}

/** An alert on record that no clinician was given: never shown as sent to the care team. */
export function sosUnrouted(sos: { careTeamAlerted: boolean; recipientAssigned?: boolean; delivery?: SosDelivery }): boolean {
  return sos.delivery === "ALERT_UNROUTED" || (sos.careTeamAlerted && sos.recipientAssigned === false);
}

/** The wording key of an SOS state (`copy.sos.status[key]`): never anything that says help is on its way. */
export function sosStatusKey(status: Pick<SosStatus, "state" | "careTeamAlerted" | "recipientAssigned" | "delivery">): "transmitted" | "unrouted" | "acknowledged" | "escalated" | "resolved" {
  if (status.state === "TRANSMITTED" && sosUnrouted(status)) return "unrouted";
  return status.state.toLowerCase() as "transmitted" | "acknowledged" | "escalated" | "resolved";
}

/** The line shown right after sending (`copy.sos[key]`, or `copy.sos.status.unrouted`). */
export function sosSentKey(result: Pick<SosResult, "alreadyOpen" | "careTeamAlerted" | "recipientAssigned" | "delivery">): "unrouted" | "already" | "sentTeam" | "sentSupport" {
  if (sosUnrouted(result)) return "unrouted";
  // No clinical alert at all: "already" would claim the team was notified.
  if (!result.careTeamAlerted) return "sentSupport";
  return result.alreadyOpen ? "already" : "sentTeam";
}
