import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LOCALIZED_PATHS, followsSavedArabic, isLocalizedPath, localizedHref, localizedPath, splitLangPrefix } from "@/lib/i18n/routing";
import { languageAlternates } from "@/lib/config/site";

describe("localized URLs", () => {
  it("puts Arabic under /ar and leaves English at the root", () => {
    expect(localizedPath("/mira", "ar")).toBe("/ar/mira");
    expect(localizedPath("/", "ar")).toBe("/ar");
    expect(localizedPath("/mira", "en")).toBe("/mira");
  });
  it("never prefixes app routes", () => {
    expect(isLocalizedPath("/dashboard")).toBe(false);
    expect(localizedPath("/dashboard", "ar")).toBe("/dashboard");
  });
  it("splits the prefix back off, without matching look-alike paths", () => {
    expect(splitLangPrefix("/ar/care-paths")).toEqual({ lang: "ar", path: "/care-paths" });
    expect(splitLangPrefix("/ar")).toEqual({ lang: "ar", path: "/" });
    expect(splitLangPrefix("/arabic")).toEqual({ lang: "en", path: "/arabic" });
  });
  it("round-trips every public page", () => {
    for (const path of LOCALIZED_PATHS) expect(splitLangPrefix(localizedPath(path, "ar"))).toEqual({ lang: "ar", path });
  });
  it("lists en, ar and x-default as hreflang alternates", () => {
    expect(languageAlternates("/support")).toEqual({ en: "/support", ar: "/ar/support", "x-default": "/support" });
  });
});

describe("localized links", () => {
  it("keeps the query and hash, and leaves English, app routes and external URLs alone", () => {
    expect(localizedHref("/mira#flow", "ar")).toBe("/ar/mira#flow");
    expect(localizedHref("/?from=x", "ar")).toBe("/ar?from=x");
    expect(localizedHref("/mira#flow", "en")).toBe("/mira#flow");
    expect(localizedHref("/dashboard", "ar")).toBe("/dashboard");
    expect(localizedHref("https://example.com/mira", "ar")).toBe("https://example.com/mira");
    expect(localizedHref("#cta", "ar")).toBe("#cta");
  });
});

describe("saved Arabic on an English URL", () => {
  const origin = "https://synq.test";
  it("always follows on the home page", () => {
    expect(followsSavedArabic("/", null, origin)).toBe(true);
  });
  it("lets a deep link opened directly stay English", () => {
    expect(followsSavedArabic("/mira", null, origin)).toBe(false);
    expect(followsSavedArabic("/mira", "https://www.google.com/", origin)).toBe(false);
    expect(followsSavedArabic("/mira", "not a url", origin)).toBe(false);
  });
  it("keeps the language of the page the link was followed from", () => {
    expect(followsSavedArabic("/mira", `${origin}/ar/lumina`, origin)).toBe(true);
    expect(followsSavedArabic("/help", `${origin}/dashboard`, origin)).toBe(true);
    expect(followsSavedArabic("/mira", `${origin}/lumina`, origin)).toBe(false);
  });
  it("treats a page's own Arabic twin as the language switch, not a link", () => {
    expect(followsSavedArabic("/privacy", `${origin}/ar/privacy`, origin)).toBe(false);
  });
});

describe("proxy matcher", () => {
  // Next only accepts literal matchers, so the list in proxy.ts is a copy: it must cover every localized page.
  it("matches every localized path and its Arabic twin", () => {
    const source = readFileSync("proxy.ts", "utf8");
    for (const path of LOCALIZED_PATHS) expect(source).toContain(`"${path}"`);
    expect(source).toContain('"/ar/:path*"');
  });
});
