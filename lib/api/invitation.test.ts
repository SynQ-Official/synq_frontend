import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiUrl } from "./config";
import { checkInvitation } from "./invitation";

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const TOKEN = "a".repeat(43);

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("checkInvitation (server-side, before the page renders)", () => {
  it("asks the API about the token and reads a usable invitation", async () => {
    fetchMock.mockResolvedValueOnce(reply({ valid: true, email: "ana@example.com", expiresAt: "2026-11-22T10:00:00.000Z" }));
    await expect(checkInvitation(TOKEN)).resolves.toEqual({ state: "usable", email: "ana@example.com", expiresAt: "2026-11-22T10:00:00.000Z" });
    expect(fetchMock.mock.calls[0][0]).toBe(apiUrl("/auth/invitations/verify"));
    expect(JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body))).toEqual({ token: TOKEN });
  });

  it("opens the { success, data } envelope too", async () => {
    fetchMock.mockResolvedValueOnce(reply({ success: true, data: { valid: true, email: "ana@example.com" } }));
    await expect(checkInvitation(TOKEN)).resolves.toMatchObject({ state: "usable", email: "ana@example.com" });
  });

  it("calls an unknown, used, expired or revoked link invalid (the API answers 400 or 404 for all of them)", async () => {
    for (const status of [400, 404]) {
      fetchMock.mockResolvedValueOnce(reply({ message: "This invitation is invalid or has expired.", code: "INVITATION_INVALID" }, status));
      await expect(checkInvitation(TOKEN)).resolves.toEqual({ state: "invalid" });
    }
  });

  it("never trusts an answer that does not name the address", async () => {
    fetchMock.mockResolvedValueOnce(reply({ valid: false }));
    await expect(checkInvitation(TOKEN)).resolves.toEqual({ state: "invalid" });
    fetchMock.mockResolvedValueOnce(reply({ valid: true }));
    await expect(checkInvitation(TOKEN)).resolves.toEqual({ state: "invalid" });
  });

  it("says `unavailable`, not `invalid`, when the API cannot answer: a good link is not called expired during an outage", async () => {
    for (const status of [429, 500, 503]) {
      fetchMock.mockResolvedValueOnce(reply({ message: "down" }, status));
      await expect(checkInvitation(TOKEN)).resolves.toEqual({ state: "unavailable" });
    }
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(checkInvitation(TOKEN)).resolves.toEqual({ state: "unavailable" });
  });
});
