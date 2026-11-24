import { describe, expect, it } from "vitest";
import type { SosResult, SosStatus } from "@/lib/api/patient-types";
import { bubbleKind, sosIsOpen, sosSentKey, sosStatusKey, sosUnrouted, unreadBadge } from "./messages";

const status = (state: SosStatus["state"]): SosStatus => ({ crisisEventId: "c1", state, raisedAt: "2026-11-22T10:00:00Z", careTeamAlerted: true, acknowledgedAt: null, clinicianName: null });

describe("bubbleKind", () => {
  it("draws SYSTEM messages as their own neutral kind, never as the clinician", () => {
    expect(bubbleKind("PATIENT")).toBe("mine");
    expect(bubbleKind("CLINICIAN")).toBe("clinician");
    expect(bubbleKind("SYSTEM")).toBe("system");
  });
});

describe("unreadBadge", () => {
  it("shows nothing at zero and caps the count", () => {
    expect(unreadBadge(0)).toBeNull();
    expect(unreadBadge(undefined)).toBeNull();
    expect(unreadBadge(3)).toBe("3");
    expect(unreadBadge(9)).toBe("9");
    expect(unreadBadge(10)).toBe("9+");
  });
});

describe("SOS status", () => {
  it("follows an SOS until it is closed", () => {
    expect(sosIsOpen(null)).toBe(false);
    expect(sosIsOpen(status("TRANSMITTED"))).toBe(true);
    expect(sosIsOpen(status("ESCALATED"))).toBe(true);
    expect(sosIsOpen(status("RESOLVED"))).toBe(false);
  });

  it("maps every state to its own wording key", () => {
    expect(sosStatusKey(status("TRANSMITTED"))).toBe("transmitted");
    expect(sosStatusKey(status("ACKNOWLEDGED"))).toBe("acknowledged");
    expect(sosStatusKey(status("ESCALATED"))).toBe("escalated");
    expect(sosStatusKey(status("RESOLVED"))).toBe("resolved");
  });

  it("shows an alert with no clinician recipient as unrouted, never as sent to the team", () => {
    expect(sosStatusKey({ ...status("TRANSMITTED"), recipientAssigned: false })).toBe("unrouted");
    expect(sosStatusKey({ ...status("TRANSMITTED"), delivery: "ALERT_UNROUTED" })).toBe("unrouted");
    expect(sosStatusKey({ ...status("TRANSMITTED"), recipientAssigned: true })).toBe("transmitted");
    expect(sosStatusKey({ ...status("ESCALATED"), recipientAssigned: false })).toBe("escalated");
    expect(sosStatusKey(status("TRANSMITTED"))).toBe("transmitted");
    expect(sosUnrouted({ careTeamAlerted: true, recipientAssigned: false })).toBe(true);
    expect(sosUnrouted({ careTeamAlerted: false, delivery: "NO_CLINICAL_ALERT" })).toBe(false);
  });
});

describe("SOS sent line", () => {
  const sent = (over: Partial<SosResult>): SosResult => ({ crisisEventId: "c1", alreadyOpen: false, careTeamAlerted: true, emergencyResources: [], ...over });

  it("says unrouted before anything else", () => {
    expect(sosSentKey(sent({ recipientAssigned: false, alreadyOpen: true }))).toBe("unrouted");
    expect(sosSentKey(sent({ delivery: "ALERT_UNROUTED" }))).toBe("unrouted");
  });

  it("chooses the line from the alert's routing", () => {
    expect(sosSentKey(sent({ alreadyOpen: true }))).toBe("already");
    expect(sosSentKey(sent({ alreadyOpen: true, careTeamAlerted: true, recipientAssigned: true }))).toBe("already");
    expect(sosSentKey(sent({ alreadyOpen: true, careTeamAlerted: false, recipientAssigned: false, delivery: "NO_CLINICAL_ALERT" }))).toBe("sentSupport");
    expect(sosSentKey(sent({ recipientAssigned: true, delivery: "RECIPIENT_ASSIGNED" }))).toBe("sentTeam");
    expect(sosSentKey(sent({ careTeamAlerted: false, delivery: "NO_CLINICAL_ALERT" }))).toBe("sentSupport");
    expect(sosSentKey(sent({}))).toBe("sentTeam");
  });
});
