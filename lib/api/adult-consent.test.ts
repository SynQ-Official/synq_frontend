import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authApi, cancelAdultConsent, hasPendingAdultConsent } from "./auth";
import { clearTokens, getAccessToken, isAuthenticated } from "./tokens";

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const session = { access_token: "access-1", user: { id: "u1", nickname: "Ana" } };
const consentChallenge = { requires_adult_consent: true, adult_consent_token: "consent-1" };

let fetchMock: ReturnType<typeof vi.fn>;
const bodyOf = (call: number) => JSON.parse(String((fetchMock.mock.calls[call][1] as RequestInit).body));

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  clearTokens();
  cancelAdultConsent();
});
afterEach(() => vi.unstubAllGlobals());

describe("sign-in of an adult account that has to consent first", () => {
  it("answers `adult_consent_required` and opens NO session", async () => {
    fetchMock.mockResolvedValueOnce(reply(consentChallenge));
    await expect(authApi.login("ana@example.com", "Real-pass-1")).resolves.toBe("adult_consent_required");
    expect(hasPendingAdultConsent()).toBe(true);
    expect(getAccessToken()).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it("accepts the consent and opens the session with the returned tokens", async () => {
    fetchMock.mockResolvedValueOnce(reply(consentChallenge));
    await authApi.login("ana@example.com", "Real-pass-1");
    fetchMock.mockResolvedValueOnce(reply(session));
    await authApi.acceptAdultConsent();

    expect(fetchMock.mock.calls[1][0]).toBe("/api/session/adult-consent");
    expect(bodyOf(1)).toEqual({ token: "consent-1", accept: true });
    expect(getAccessToken()).toBe("access-1");
    expect(hasPendingAdultConsent()).toBe(false);
  });

  it("drops the token when the API refuses it as expired (401)", async () => {
    fetchMock.mockResolvedValueOnce(reply(consentChallenge));
    await authApi.login("ana@example.com", "Real-pass-1");
    fetchMock.mockResolvedValueOnce(reply({ message: "Invalid or expired adult consent token" }, 401));
    await expect(authApi.acceptAdultConsent()).rejects.toMatchObject({ status: 401 });
    expect(hasPendingAdultConsent()).toBe(false);
    expect(isAuthenticated()).toBe(false);
  });

  it("refuses to accept when no consent is held (no request is sent)", async () => {
    await expect(authApi.acceptAdultConsent()).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("the same-origin gateway for the adult consent", () => {
  it("forwards to the API, moves the refresh token into the cookie, and never sends a 2FA challenge as a session", async () => {
    const { POST } = await import("@/app/api/session/[action]/route");
    const { apiUrl } = await import("./config");
    const origin = "http://localhost:3001";
    fetchMock.mockResolvedValueOnce(reply({ access_token: "access-1", refresh_token: "refresh-1", user: { id: "u1", nickname: "Ana" } }));
    const res = await POST(
      new Request(`${origin}/api/session/adult-consent`, {
        method: "POST",
        headers: { origin, "content-type": "application/json", "x-forwarded-for": "10.9.9.9" },
        body: JSON.stringify({ token: "consent-1", accept: true }),
      }),
      { params: Promise.resolve({ action: "adult-consent" }) },
    );
    expect(fetchMock.mock.calls[0][0]).toBe(apiUrl("/auth/login/adult-consent"));
    expect(res.status).toBe(200);
    expect(await res.json()).not.toHaveProperty("refresh_token");
    expect(res.headers.get("set-cookie") ?? "").toContain("synq_rt=refresh-1");

    fetchMock.mockResolvedValueOnce(reply({ requires_2fa: true, temp_token: "t" }));
    const challenge = await POST(
      new Request(`${origin}/api/session/adult-consent`, {
        method: "POST",
        headers: { origin, "content-type": "application/json", "x-forwarded-for": "10.9.9.10" },
        body: JSON.stringify({ token: "consent-1", accept: true }),
      }),
      { params: Promise.resolve({ action: "adult-consent" }) },
    );
    expect(challenge.headers.get("set-cookie")).toBeNull();
    expect(await challenge.json()).toEqual({ requires_2fa: true, temp_token: "t" });
  });
});
