import { describe, expect, it } from "vitest";
import { accountVerificationCopy } from "./accountVerification";

/** Every leaf key path of a copy object, so a key added to one language without the other fails here. */
function keyPaths(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object") return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => keyPaths(child, prefix ? `${prefix}.${key}` : key));
}

describe("accountVerificationCopy", () => {
  it("has the same keys in English and Arabic", () => {
    expect(keyPaths(accountVerificationCopy.ar).sort()).toEqual(keyPaths(accountVerificationCopy.en).sort());
  });

  it("has no empty strings in either language", () => {
    for (const lang of ["en", "ar"] as const) {
      for (const path of keyPaths(accountVerificationCopy[lang])) {
        const value = path.split(".").reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], accountVerificationCopy[lang]);
        expect(typeof value === "string" && value.trim().length > 0, `${lang}.${path}`).toBe(true);
      }
    }
  });
});
