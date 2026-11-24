import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authApi, cancelPasswordChange, hasPendingPasswordChange } from "./auth";
import { ApiError } from "./errors";
import { clearTokens, getAccessToken, isAuthenticated } from "./tokens";

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const session = { access_token: "access-1", user: { id: "u1", nickname: "Ana" } };
const challenge = { requires_password_change: true, password_change_token: "proof-1" };

let fetchMock: ReturnType<typeof vi.fn>;
const bodyOf = (call: number) => JSON.parse(String((fetchMock.mock.calls[call][1] as RequestInit).body));

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  clearTokens();
  cancelPasswordChange();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("sign-in of a clinician-created account", () => {
  it("answers `password_change_required` and opens NO session", async () => {
    fetchMock.mockResolvedValueOnce(reply(challenge));
    await expect(authApi.login("ana@example.com", "Temp-pass-1")).resolves.toBe("password_change_required");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/session/login");
    expect(hasPendingPasswordChange()).toBe(true);
    // The proof of the temporary password is not a session: nothing for the API client to send, nothing to restore.
    expect(getAccessToken()).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it("opens a session for an ordinary account and holds no password change", async () => {
    fetchMock.mockResolvedValueOnce(reply(session));
    await expect(authApi.login("ana@example.com", "Real-pass-1")).resolves.toBe("signed_in");
    expect(isAuthenticated()).toBe(true);
    expect(getAccessToken()).toBe("access-1");
    expect(hasPendingPasswordChange()).toBe(false);
  });

  it("refuses a two-factor challenge: the patient app has no such flow", async () => {
    fetchMock.mockResolvedValueOnce(reply({ requires_2fa: true, temp_token: "t" }));
    await expect(authApi.login("ana@example.com", "pw")).rejects.toThrow("This account cannot sign in here.");
    expect(isAuthenticated()).toBe(false);
    expect(hasPendingPasswordChange()).toBe(false);
  });

  it("passes the API's own refusal on (an expired temporary password is a 401 with its code)", async () => {
    fetchMock.mockResolvedValueOnce(reply({ message: "expired", code: "TEMPORARY_PASSWORD_EXPIRED" }, 401));
    const error = await authApi.login("ana@example.com", "Temp-pass-1").catch((reason) => reason);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, code: "TEMPORARY_PASSWORD_EXPIRED" });
    expect(hasPendingPasswordChange()).toBe(false);
  });
});

describe("mandatory password change", () => {
  const holdProof = async () => {
    fetchMock.mockResolvedValueOnce(reply(challenge));
    await authApi.login("ana@example.com", "Temp-pass-1");
    fetchMock.mockClear();
  };

  it("trades the proof and the new password for a session, once", async () => {
    await holdProof();
    fetchMock.mockResolvedValueOnce(reply(session));
    await authApi.completePasswordChange("My-new-pass-1!", "My-new-pass-1!");

    expect(fetchMock.mock.calls[0][0]).toBe("/api/session/change-password");
    expect(bodyOf(0)).toEqual({ password_change_token: "proof-1", password: "My-new-pass-1!", confirmPassword: "My-new-pass-1!" });
    expect(isAuthenticated()).toBe(true);
    expect(hasPendingPasswordChange()).toBe(false);

    // Single use: a second attempt never reaches the network.
    const again = await authApi.completePasswordChange("Another-pass-1!", "Another-pass-1!").catch((reason) => reason);
    expect(again).toMatchObject({ status: 401, code: "PASSWORD_CHANGE_EXPIRED" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("without a proof (a reload, a direct visit) sends nothing and says to sign in again", async () => {
    const error = await authApi.completePasswordChange("My-new-pass-1!", "My-new-pass-1!").catch((reason) => reason);
    expect(error).toMatchObject({ status: 401, code: "PASSWORD_CHANGE_EXPIRED" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(isAuthenticated()).toBe(false);
  });

  it("keeps the proof when the API rejects the PASSWORD (400), so another one can be tried", async () => {
    await holdProof();
    fetchMock.mockResolvedValueOnce(reply({ message: "must differ from the temporary password" }, 400));
    await expect(authApi.completePasswordChange("Temp-pass-1", "Temp-pass-1")).rejects.toMatchObject({ status: 400 });
    expect(hasPendingPasswordChange()).toBe(true);
    expect(isAuthenticated()).toBe(false);
  });

  it("drops the proof when the API says it is spent or expired (401)", async () => {
    await holdProof();
    fetchMock.mockResolvedValueOnce(reply({ message: "Invalid or expired" }, 401));
    await expect(authApi.completePasswordChange("My-new-pass-1!", "My-new-pass-1!")).rejects.toMatchObject({ status: 401 });
    expect(hasPendingPasswordChange()).toBe(false);
    expect(isAuthenticated()).toBe(false);
  });

  it("lets the proof lapse with the API's 15 minutes", async () => {
    vi.useFakeTimers();
    await holdProof();
    expect(hasPendingPasswordChange()).toBe(true);
    vi.advanceTimersByTime(15 * 60_000);
    expect(hasPendingPasswordChange()).toBe(false);
  });

  it("a new sign-in attempt can drop a half-finished change", async () => {
    await holdProof();
    cancelPasswordChange();
    expect(hasPendingPasswordChange()).toBe(false);
  });
});

describe("invitation acceptance", () => {
  const input = { token: "t".repeat(43), email: "ana@example.com", nickname: "Ana", birthDate: "1990-05-17", password: "My-new-pass-1!", confirmPassword: "My-new-pass-1!", lang: "en" as const };

  it("creates the session and says where the patient goes next", async () => {
    fetchMock.mockResolvedValueOnce(reply({ ...session, assignmentId: "a1", next: "TRACK" }));
    await expect(authApi.acceptInvitation(input)).resolves.toBe("TRACK");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/session/accept-invitation");
    expect(bodyOf(0)).toMatchObject({ token: input.token, email: "ana@example.com", nickname: "Ana", birthDate: "1990-05-17" });
    expect(isAuthenticated()).toBe(true);
  });

  it("sends the consent only when it was given", async () => {
    fetchMock.mockResolvedValueOnce(reply({ ...session, next: "MIRA_ORIENTATION" }));
    await authApi.acceptInvitation({ ...input, consentVersion: undefined });
    expect(bodyOf(0)).not.toHaveProperty("consentVersion");
    fetchMock.mockResolvedValueOnce(reply({ ...session, next: "MIRA_ORIENTATION" }));
    await authApi.acceptInvitation({ ...input, consentVersion: "2026-10" });
    expect(bodyOf(1)).toMatchObject({ consentVersion: "2026-10" });
  });

  it("falls back to Mira's orientation when the API does not say (or says something unknown)", async () => {
    fetchMock.mockResolvedValueOnce(reply({ ...session, next: "SOMETHING_NEW" }));
    await expect(authApi.acceptInvitation(input)).resolves.toBe("MIRA_ORIENTATION");
  });

  it("surfaces the API's refusals with their codes and opens no session", async () => {
    for (const [status, code] of [[400, "INVITATION_INVALID"], [409, "ACCOUNT_EXISTS"], [409, "NICKNAME_TAKEN"]] as const) {
      fetchMock.mockResolvedValueOnce(reply({ message: "no", code }, status));
      await expect(authApi.acceptInvitation(input)).rejects.toMatchObject({ status, code });
      expect(isAuthenticated()).toBe(false);
    }
  });
});
