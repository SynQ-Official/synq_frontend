import { describe, expect, it } from "vitest";
import { COUNTRY_CODES, countryOptions } from "./countries";

describe("COUNTRY_CODES", () => {
  it("lists unique two-letter uppercase ISO codes", () => {
    expect(new Set(COUNTRY_CODES).size).toBe(COUNTRY_CODES.length);
    for (const code of COUNTRY_CODES) expect(code).toMatch(/^[A-Z]{2}$/);
  });

  it("lists the officially assigned set (249 codes)", () => {
    expect(COUNTRY_CODES.length).toBe(249);
  });

  it("contains the countries the product serves and a few majors", () => {
    for (const code of ["TN", "FR", "US", "SA", "AE"]) expect(COUNTRY_CODES).toContain(code);
  });
});

describe("countryOptions", () => {
  it("names every code, sorted by the language's collation", () => {
    const options = countryOptions("en");
    expect(options).toHaveLength(COUNTRY_CODES.length);
    const names = options.map((option) => option.name);
    expect([...names].sort(new Intl.Collator("en").compare)).toEqual(names);
    expect(options.find((option) => option.code === "TN")?.name).toBe("Tunisia");
  });

  it("names countries in Arabic for the Arabic list", () => {
    expect(countryOptions("ar").find((option) => option.code === "TN")?.name).toBe("تونس");
  });
});
