import { describe, expect, it } from "vitest";
import { authTokensSchema, invitationAcceptedSchema, loginResponseSchema, profileSchema } from "./schemas";

const profile = {
  id: "u1",
  nickname: "Ana",
  email: "ana@example.com",
  language: "EN",
  track: "BIPOLAR",
  orientationCompleted: false,
  hasCompletedOnboarding: false,
  memberSince: "2026-10-01T00:00:00.000Z",
  careTeam: { hasClinician: true, count: 1 },
};

describe("loginResponseSchema", () => {
  it("reads a password-change challenge: a token to trade for a new password, and no session", () => {
    const parsed = loginResponseSchema.parse({ requires_password_change: true, password_change_token: "proof" });
    expect(parsed).toEqual({ requires_password_change: true, password_change_token: "proof" });
    expect(parsed.access_token).toBeUndefined();
  });

  it("still reads an ordinary session and a two-factor challenge", () => {
    expect(loginResponseSchema.parse({ access_token: "a", user: { id: "u1", nickname: "Ana" } }).access_token).toBe("a");
    expect(loginResponseSchema.parse({ requires_2fa: true, temp_token: "t" }).requires_2fa).toBe(true);
  });
});

describe("session user", () => {
  it("has no subscription tier any more: a stray one is dropped", () => {
    const parsed = authTokensSchema.parse({ access_token: "a", user: { id: "u1", nickname: "Ana", tier: "PRO" } });
    expect(parsed.user).toEqual({ id: "u1", nickname: "Ana" });
  });
});

describe("invitationAcceptedSchema", () => {
  it("keeps where the patient goes next", () => {
    expect(invitationAcceptedSchema.parse({ access_token: "a", next: "TRACK" }).next).toBe("TRACK");
    expect(invitationAcceptedSchema.parse({ access_token: "a", next: "MIRA_ORIENTATION" }).next).toBe("MIRA_ORIENTATION");
  });

  it("drops an unknown `next` instead of failing the sign-up that already succeeded", () => {
    expect(invitationAcceptedSchema.parse({ access_token: "a", next: "SOMETHING_NEW" }).next).toBeUndefined();
  });

  it("refuses an answer with no access token", () => {
    expect(invitationAcceptedSchema.safeParse({ next: "TRACK" }).success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("keeps the phone number and the clinician-assigned flag", () => {
    const parsed = profileSchema.parse({ ...profile, phoneNumber: "+216 12 345 678", trackAssignedByClinician: true });
    expect(parsed.phoneNumber).toBe("+216 12 345 678");
    expect(parsed.trackAssignedByClinician).toBe(true);
  });

  it("reads a missing or null phone number as none, so the settings form never shows 'undefined'", () => {
    expect(profileSchema.parse(profile).phoneNumber).toBeNull();
    expect(profileSchema.parse({ ...profile, phoneNumber: null }).phoneNumber).toBeNull();
  });

  it("drops subscription fields an older API might still send", () => {
    const parsed = profileSchema.parse({ ...profile, hasAccess: true, subscription: { status: "ACTIVE" } }) as Record<string, unknown>;
    expect(parsed).not.toHaveProperty("hasAccess");
    expect(parsed).not.toHaveProperty("subscription");
  });
});
