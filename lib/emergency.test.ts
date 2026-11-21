import { describe, expect, it } from "vitest";
import { COUNTRY_ORDER, EMERGENCY_LINES, linesByCountry } from "@/config/emergency";

describe("config/emergency", () => {
  it("never lists 197 (Tunisian police) as a crisis line", () => {
    for (const line of EMERGENCY_LINES) {
      expect(line.display.replace(/\D/g, "")).not.toBe("197");
      expect(line.telHref).not.toBe("tel:197");
      expect(JSON.stringify(line)).not.toMatch(/(?<!\d)197(?!\d)/);
    }
  });

  it("dials exactly the digits it shows", () => {
    for (const line of EMERGENCY_LINES) {
      expect(line.telHref).toMatch(/^tel:\+?\d{3,15}$/);
      expect(line.telHref.replace(/^tel:\+?/, "")).toBe(line.display.replace(/\D/g, ""));
    }
  });

  it("names a source and a verification date for every line", () => {
    for (const line of EMERGENCY_LINES) {
      expect(line.sourceUrl).toMatch(/^https:\/\/\S+$/);
      expect(line.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(line.lastVerified))).toBe(false);
    }
  });

  it("orders every country once per language, never dropping a line", () => {
    for (const language of ["en", "ar"] as const) {
      expect(new Set(COUNTRY_ORDER[language]).size).toBe(COUNTRY_ORDER[language].length);
      expect(linesByCountry(language).flatMap((group) => group.lines)).toHaveLength(EMERGENCY_LINES.length);
    }
  });
});
