import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { apiUrl } from "@/lib/api/config";
import { sosApi } from "@/lib/api/patient";
import { clearTokens, saveTokens } from "@/lib/api/tokens";
import { sosFailureOf, telHref } from "./sos";

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("sosFailureOf", () => {
  it("tells the throttle, a connection that never reached the API, and everything else apart", () => {
    expect(sosFailureOf(new ApiError("Too many", 429))).toBe("rateLimited");
    expect(sosFailureOf(new ApiError("Network error", 0))).toBe("offline");
    expect(sosFailureOf(new ApiError("Slow", 0, "TIMEOUT"))).toBe("other"); // may have been sent: a retry is safe, not "offline"
    expect(sosFailureOf(new ApiError("Down", 503))).toBe("other");
    expect(sosFailureOf(new Error("boom"))).toBe("other");
  });
});

describe("telHref", () => {
  it("links the first phone number of a resource line", () => {
    expect(telHref("Clinique Lumière: +216 12 345 678")).toBe("tel:+21612345678");
    expect(telHref("SAMU 190 (24/7)")).toBe("tel:190");
    expect(telHref("Hotline 3114 (open 24/7)")).toBe("tel:3114");
    expect(telHref("Urgences: +33 1 23 45 67 89 (24h/24)")).toBe("tel:+33123456789");
    expect(telHref("Line: (01) 23-45-67-89")).toBe("tel:0123456789");
  });

  it("leaves a line without a number as plain text", () => {
    expect(telHref("Your local emergency services")).toBeNull();
    expect(telHref("Open 24h")).toBeNull();
  });
});

describe("sosApi.raise", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    saveTokens({ access_token: "access-1", user: { id: "u1", nickname: "Ana" } });
  });
  afterEach(() => {
    clearTokens();
    vi.unstubAllGlobals();
  });

  it("is one authenticated POST with no body of its own: who is asking comes from the token, never from the request", async () => {
    fetchMock.mockResolvedValueOnce(reply({ data: { crisisEventId: "c1", alreadyOpen: false, careTeamAlerted: true, emergencyResources: ["Clinic: 190"], notice: "..." } }));
    const { data } = await sosApi.raise();

    expect(data).toMatchObject({ crisisEventId: "c1", alreadyOpen: false, careTeamAlerted: true, emergencyResources: ["Clinic: 190"] });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(apiUrl("/me/sos"));
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer access-1");
    expect(JSON.parse(String(init.body))).toEqual({});
  });

  it("surfaces the throttle as a 429 the app can explain", async () => {
    fetchMock.mockResolvedValueOnce(reply({ message: "Too Many Requests" }, 429));
    const error = await sosApi.raise().catch((reason) => reason);
    expect(error).toBeInstanceOf(ApiError);
    expect(sosFailureOf(error)).toBe("rateLimited");
  });
});
