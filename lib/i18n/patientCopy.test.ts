import { describe, expect, it } from "vitest";
import { accountAccessCopy } from "./accountAccess";
import { patientCopy } from "./patient";

/** Every leaf key path of a copy object, so a key added to one language without the other fails here. */
function keyPaths(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object") return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => keyPaths(child, prefix ? `${prefix}.${key}` : key));
}

const valueAt = (root: unknown, path: string) => path.split(".").reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], root);

describe("patient copy added for the care relationships and the data section", () => {
  const sections = {
    "care.relationships": (lang: "en" | "ar") => patientCopy[lang].care.relationships,
    "settings.data": (lang: "en" | "ar") => patientCopy[lang].settings.data,
    "settings.privacy": (lang: "en" | "ar") => patientCopy[lang].settings.privacy,
    "sos": (lang: "en" | "ar") => patientCopy[lang].sos,
  };

  for (const [name, pick] of Object.entries(sections)) {
    it(`${name} has the same keys in English and Arabic, none empty`, () => {
      const en = keyPaths(pick("en")).sort();
      expect(keyPaths(pick("ar")).sort()).toEqual(en);
      for (const path of en) {
        const value = valueAt(pick("en"), path);
        expect(typeof value === "string" && value.trim().length > 0, `en.${name}.${path}`).toBe(true);
      }
    });
  }

  it("the paused-sharing line exists in both languages", () => {
    for (const lang of ["en", "ar"] as const) {
      expect(patientCopy[lang].settings.privacy.reconfirm.pausedBody.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("accountAccessCopy.adultConsent", () => {
  it("has the same keys in English and Arabic, and the same number of points", () => {
    expect(keyPaths(accountAccessCopy.ar.adultConsent).sort()).toEqual(keyPaths(accountAccessCopy.en.adultConsent).sort());
    expect(accountAccessCopy.ar.adultConsent.points).toHaveLength(accountAccessCopy.en.adultConsent.points.length);
  });
});
