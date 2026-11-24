import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ cookies: new Map<string, string>(), lang: null as string | null }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (state.cookies.has(name) ? { name, value: state.cookies.get(name) } : undefined) }),
  headers: async () => ({ get: (name: string) => (name === "x-lang" ? state.lang : null) }),
}));

import { requestLanguage } from "./request-language";

beforeEach(() => {
  state.cookies.clear();
  state.lang = null;
});

describe("requestLanguage", () => {
  it("resolves a visitor whose only language cookie is the legacy vitamind-language=ar to ar", async () => {
    state.cookies.set("vitamind-language", "ar");
    expect(await requestLanguage()).toBe("ar");
  });

  it("prefers the synq cookie over the legacy one", async () => {
    state.cookies.set("synq-language", "en");
    state.cookies.set("vitamind-language", "ar");
    expect(await requestLanguage()).toBe("en");
  });

  it("defaults to en without any cookie", async () => {
    expect(await requestLanguage()).toBe("en");
  });
});
