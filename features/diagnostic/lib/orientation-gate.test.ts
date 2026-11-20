import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiUrl } from "@/lib/api/config";
import { clearTokens, saveTokens } from "@/lib/api/tokens";
import { resolveOrientation } from "./orientation-gate";

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const status = (overrides: Record<string, unknown>) => ({
  data: { state: "NO_TRACK_ORIENTATION_REQUIRED", miraRequired: true, track: "UNSPECIFIED", trackActive: false, trackAssignedByClinician: false, ...overrides },
});

let fetchMock: ReturnType<typeof vi.fn>;
/** The fake API: `/me/orientation` and `/mira/attempts` answer what the test says; every call is recorded. */
function api(orientation: unknown, attempts: unknown = { blocked: false }) {
  fetchMock.mockImplementation(async (url: string) => {
    if (url === apiUrl("/me/orientation")) return reply(orientation);
    if (url === apiUrl("/mira/attempts")) return reply(attempts);
    return reply({ message: "unexpected call" }, 500);
  });
}
const called = (path: string) => fetchMock.mock.calls.some(([url]) => url === apiUrl(path));

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  saveTokens({ access_token: "access-1", user: { id: "u1", nickname: "Ana" } });
});
afterEach(() => {
  clearTokens();
  vi.unstubAllGlobals();
});

describe("resolveOrientation: does Mira have anything left to do?", () => {
  it("CASE A, a clinician-assigned track: done at once, and Mira is never asked about", async () => {
    api(status({ state: "CLINICIAN_TRACK_ASSIGNED", miraRequired: false, track: "BIPOLAR", trackActive: true, trackAssignedByClinician: true }));
    await expect(resolveOrientation()).resolves.toBe("done");
    expect(called("/mira/attempts")).toBe(false);
  });

  it("an orientation already completed: done, without a Mira call", async () => {
    api(status({ state: "MIRA_ORIENTATION_COMPLETED", miraRequired: false, track: "ADHD", trackActive: true }));
    await expect(resolveOrientation()).resolves.toBe("done");
    expect(called("/mira/attempts")).toBe(false);
  });

  it("CASE B, no track yet: open, once the attempts say one is left", async () => {
    api(status({}), { blocked: false, remaining: 1 });
    await expect(resolveOrientation()).resolves.toBe("open");
    expect(called("/mira/attempts")).toBe(true);
  });

  it("an interrupted orientation (CASE C) stays open so it can be resumed", async () => {
    api(status({ state: "MIRA_ORIENTATION_IN_PROGRESS" }), { blocked: false, resumableSessionId: "s1" });
    await expect(resolveOrientation()).resolves.toBe("open");
  });

  it("Mira still required but no attempt left: done (the API closes it)", async () => {
    api(status({}), { blocked: true, remaining: 0 });
    await expect(resolveOrientation()).resolves.toBe("done");
  });

  it("rejects with the API's error so the caller can tell a lost session from an outage", async () => {
    fetchMock.mockImplementation(async () => reply({ message: "Unauthorized" }, 401));
    await expect(resolveOrientation()).rejects.toMatchObject({ status: 401 });
  });
});
