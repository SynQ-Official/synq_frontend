import { describe, expect, it } from "vitest";
import { ageOn, birthDateFailure, birthDateStatus, birthYearReady, isValidIsoDay } from "./birth-date";

describe("ageOn", () => {
  it("counts 18 on the 18th birthday itself", () => {
    expect(ageOn("2008-11-22", "2026-11-22")).toBe(18);
  });

  it("counts 17 the day before the 18th birthday", () => {
    expect(ageOn("2008-11-23", "2026-11-22")).toBe(17);
  });

  it("treats a 29 February birthday as 1 March in a non-leap year", () => {
    expect(ageOn("2008-02-29", "2026-02-28")).toBe(17);
    expect(ageOn("2008-02-29", "2026-03-01")).toBe(18);
  });

  it("keeps 29 February on a leap year", () => {
    expect(ageOn("2008-02-29", "2028-02-28")).toBe(19);
    expect(ageOn("2008-02-29", "2028-02-29")).toBe(20);
  });

  it("returns null for future, malformed or impossible dates", () => {
    expect(ageOn("2026-11-23", "2026-11-22")).toBeNull();
    expect(ageOn("2008-02-30", "2026-11-22")).toBeNull();
    expect(ageOn("22/11/2008", "2026-11-22")).toBeNull();
    expect(ageOn("", "2026-11-22")).toBeNull();
  });
});

describe("birthDateStatus", () => {
  const today = "2026-11-22";
  it("reports each state", () => {
    expect(birthDateStatus("", today)).toBe("empty");
    expect(birthDateStatus("2026-13-01", today)).toBe("invalid");
    expect(birthDateStatus("2026-11-23", today)).toBe("future");
    expect(birthDateStatus("2008-11-23", today)).toBe("minor");
    expect(birthDateStatus("2008-11-22", today)).toBe("adult");
  });
});

describe("isValidIsoDay", () => {
  it("accepts real days only", () => {
    expect(isValidIsoDay("2024-02-29")).toBe(true);
    expect(isValidIsoDay("2023-02-29")).toBe(false);
    expect(isValidIsoDay("2024-04-31")).toBe(false);
    expect(isValidIsoDay("2024-1-05")).toBe(false);
  });
});

describe("birthYearReady", () => {
  it("waits for a plausible four-digit year before judging age live", () => {
    expect(birthYearReady("0002-01-01")).toBe(false);
    expect(birthYearReady("1899-12-31")).toBe(false);
    expect(birthYearReady("1900-01-01")).toBe(true);
    expect(birthYearReady("2012-05-05")).toBe(true);
    expect(birthYearReady("")).toBe(false);
    expect(birthYearReady("201")).toBe(false);
  });
});

describe("birthDateFailure", () => {
  it("maps the API's sign-up codes to the birth date field only", () => {
    expect(birthDateFailure("UNDER_18")).toBe("minor");
    expect(birthDateFailure("INVALID_BIRTH_DATE")).toBe("invalid");
    expect(birthDateFailure("TEMPORARY_PASSWORD_EXPIRED")).toBeNull();
    expect(birthDateFailure(undefined)).toBeNull();
  });
});
