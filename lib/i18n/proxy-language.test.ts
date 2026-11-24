import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "@/proxy";

const ORIGIN = "http://localhost:3001";
const get = (path: string, cookie?: string) =>
  proxy(new NextRequest(`${ORIGIN}${path}`, { headers: cookie ? { cookie } : {} }));

describe("language cookie through the proxy", () => {
  it("follows a legacy-only vitamind-language=ar to the Arabic home page", () => {
    const res = get("/", "vitamind-language=ar");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(`${ORIGIN}/ar`);
  });

  it("expires the legacy language cookie on a localized page that sets the new one", () => {
    const res = get("/ar/mira", "vitamind-language=ar");
    expect(res.headers.get("x-middleware-rewrite")).toBe(`${ORIGIN}/mira`);
    const cookies = res.headers.getSetCookie();
    expect(cookies.some((c) => c.startsWith("vitamind-language=;") && c.includes("Max-Age=0"))).toBe(true);
    expect(cookies.some((c) => c.startsWith("synq-language=ar"))).toBe(true);
  });
});
