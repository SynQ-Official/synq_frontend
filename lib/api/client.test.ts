import { describe, expect, it } from "vitest";
import { ApiError, INVALID_RESPONSE, unwrap } from "./client";
import { authTokensSchema, profileSchema } from "./schemas";
import { classifyTurnFailure } from "@/lib/patient/turn-errors";

const profile = {
  id: "u1",
  nickname: "Ana",
  email: "ana@example.com",
  language: "EN",
  track: "ADHD",
  orientationCompleted: true,
  hasCompletedOnboarding: false,
  phoneNumber: null,
  memberSince: "2026-10-01T00:00:00.000Z",
  careTeam: { hasClinician: false, count: 0 },
};

describe("unwrap", () => {
  it("opens the { success, data } envelope and passes raw payloads through", () => {
    expect(unwrap({ success: true, data: { a: 1 } })).toEqual({ a: 1 });
    expect(unwrap({ a: 1 })).toEqual({ a: 1 });
  });

  it("returns the validated value when a schema is given", () => {
    const tokens = unwrap({ success: true, data: { access_token: "t", user: { id: "u1", nickname: "Ana" } } }, authTokensSchema);
    expect(tokens).toEqual({ access_token: "t", user: { id: "u1", nickname: "Ana" } });
  });

  it("refuses a payload that breaks the contract instead of casting it", () => {
    const attempt = () => unwrap({ access_token: "" }, authTokensSchema, 200);
    expect(attempt).toThrow(ApiError);
    try {
      attempt();
    } catch (error) {
      expect((error as ApiError).code).toBe(INVALID_RESPONSE);
      expect((error as ApiError).status).toBe(200);
    }
  });
});

describe("profileSchema", () => {
  it("keeps the fields the app reads and drops the rest", () => {
    const parsed = profileSchema.parse({ ...profile, hasAccess: true, subscription: { status: "ACTIVE" } });
    expect(parsed).toEqual(profile);
  });

  it("rejects an unknown track", () => {
    expect(profileSchema.safeParse({ ...profile, track: "OTHER" }).success).toBe(false);
  });
});

describe("classifyTurnFailure", () => {
  it("reads a 503 (MIRA_BUSY) as busy, not as a generic failure", () => {
    expect(classifyTurnFailure(new ApiError("Mira is busy", 503, "MIRA_BUSY")).kind).toBe("busy");
    expect(classifyTurnFailure(new ApiError("Too many", 429)).kind).toBe("rateLimited");
  });
});
