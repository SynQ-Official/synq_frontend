import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/session/[action]/route";
import { apiUrl } from "./config";

/**
 * The same-origin session gateway: the browser sends credentials here, the API's tokens come back split in two (the
 * access token in the body, the refresh token in an HttpOnly cookie). Tested with a fake API behind it.
 */
const ORIGIN = "http://localhost:3001";
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

let fetchMock: ReturnType<typeof vi.fn>;
let client = 0;
/** Every call comes from its own address, so the gateway's per-IP throttle never leaks between tests. */
const call = (action: string, body: unknown = {}, headers: Record<string, string> = {}) =>
  POST(
    new Request(`${ORIGIN}/api/session/${action}`, {
      method: "POST",
      headers: { origin: ORIGIN, "content-type": "application/json", "x-forwarded-for": `10.1.0.${(client += 1)}`, ...headers },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ action }) },
  );

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const issued = { access_token: "access-1", refresh_token: "refresh-1", user: { id: "u1", nickname: "Ana" } };

describe("login of a clinician-created account", () => {
  it("hands the password-change proof to the browser and sets NO cookie: there is no session yet", async () => {
    fetchMock.mockResolvedValueOnce(reply({ requires_password_change: true, password_change_token: "proof-1" }));
    const res = await call("login", { email: "ana@example.com", password: "Temp-pass-1" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ requires_password_change: true, password_change_token: "proof-1" });
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(fetchMock.mock.calls[0][0]).toBe(apiUrl("/auth/login"));
  });
});

describe.each([
  ["change-password", "/auth/login/change-password", { password_change_token: "proof-1", password: "My-new-pass-1!", confirmPassword: "My-new-pass-1!" }],
  ["accept-invitation", "/auth/invitations/accept", { token: "t".repeat(43), email: "ana@example.com", nickname: "Ana", password: "My-new-pass-1!", confirmPassword: "My-new-pass-1!" }],
] as const)("%s", (action, path, body) => {
  it("forwards the request to the API and keeps the refresh token out of the body", async () => {
    fetchMock.mockResolvedValueOnce(reply({ ...issued, next: "TRACK", assignmentId: "a1" }));
    const res = await call(action, body);

    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json).toMatchObject({ access_token: "access-1", user: { id: "u1" } });
    expect(json).not.toHaveProperty("refresh_token");
    // The refresh token goes into an HttpOnly cookie instead.
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("synq_rt=refresh-1");
    expect(cookie).toContain("HttpOnly");
    expect(fetchMock.mock.calls[0][0]).toBe(apiUrl(path));
    expect(JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body))).toEqual(body);
  });

  it("passes the API's refusal through and sets no cookie", async () => {
    fetchMock.mockResolvedValueOnce(reply({ message: "Invalid or expired", code: "X" }, 401));
    const res = await call(action, body);
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: "X" });
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("is a 502, never a quiet success, when the API answers OK without a session", async () => {
    fetchMock.mockResolvedValueOnce(reply({ access_token: "only-access" }));
    const res = await call(action, body);
    expect(res.status).toBe(502);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("refuses a request that did not come from this site, without calling the API", async () => {
    const res = await call(action, body, { origin: "https://evil.example" });
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throttles one address (10 per 5 minutes) before the API is even asked", async () => {
    const same = { "x-forwarded-for": `10.9.9.${action.length}` };
    fetchMock.mockImplementation(async () => reply({ message: "bad" }, 400));
    for (let attempt = 0; attempt < 10; attempt += 1) expect((await call(action, body, same)).status).toBe(400);
    const blocked = await call(action, body, same);
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(10);
  });
});

describe("refresh with the cookie from before the rename", () => {
  it("refreshes from a legacy vitamind_rt alone, sets synq_rt, and expires both legacy cookies", async () => {
    fetchMock.mockResolvedValueOnce(reply(issued));
    const res = await call("refresh", {}, { cookie: "vitamind_rt=legacy-refresh" });

    expect(res.status).toBe(200);
    expect(JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body))).toEqual({ refresh_token: "legacy-refresh" });
    const cookies = res.headers.getSetCookie();
    expect(cookies.some((c) => c.startsWith("synq_rt=refresh-1"))).toBe(true);
    expect(cookies.some((c) => c.startsWith("vitamind_rt=;") && c.includes("Max-Age=0") && c.includes("Path=/api/session"))).toBe(true);
    expect(cookies.some((c) => c.startsWith("vitamind_s=;") && c.includes("Max-Age=0") && c.includes("Path=/"))).toBe(true);
  });

  it("prefers the new cookie when both are present", async () => {
    fetchMock.mockResolvedValueOnce(reply(issued));
    await call("refresh", {}, { cookie: "vitamind_rt=old; synq_rt=new" });
    expect(JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body))).toEqual({ refresh_token: "new" });
  });
});
