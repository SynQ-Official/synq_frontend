/**
 * Birth dates for sign-up, as "YYYY-MM-DD" strings (what <input type="date"> gives and what the API takes). Pure: the
 * caller passes "today", so the rules are testable and the client check matches the server's answer on the same day.
 */
export const ADULT_AGE = 18;

export type BirthDateStatus = "empty" | "invalid" | "future" | "minor" | "adult";

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/** True when the string is a real calendar day (rejects 2023-02-29, 2024-13-01 and the like). */
export function isValidIsoDay(value: string): boolean {
  const match = ISO_DAY.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return false;
  const lastDay = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  return day <= lastDay;
}

/** True once the year part is complete enough to judge age live (the year is still being typed before this). */
export function birthYearReady(birthDate: string): boolean {
  const match = ISO_DAY.exec(birthDate);
  return match !== null && Number(match[1]) >= 1900;
}

/**
 * Age in whole years on `today`. A 29 February birthday counts as 1 March in years without a 29 February.
 * Returns null for an empty, malformed or future birth date.
 */
export function ageOn(birthDate: string, today: string): number | null {
  if (!isValidIsoDay(birthDate) || !isValidIsoDay(today) || birthDate > today) return null;
  const [by, bm, bd] = birthDate.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  const leapBirthday = bm === 2 && bd === 29 && !isLeapYear(ty);
  const birthdayMd = leapBirthday ? 301 : bm * 100 + bd;
  const reached = tm * 100 + td >= birthdayMd;
  return ty - by - (reached ? 0 : 1);
}

export function birthDateStatus(birthDate: string, today: string): BirthDateStatus {
  if (!birthDate) return "empty";
  if (!isValidIsoDay(birthDate)) return "invalid";
  if (birthDate > today) return "future";
  const age = ageOn(birthDate, today);
  return age !== null && age >= ADULT_AGE ? "adult" : "minor";
}

/** The API's sign-up refusal codes mapped to the birth date field. Any other code is not about the birth date (null). */
export function birthDateFailure(code: string | undefined): "minor" | "invalid" | null {
  if (code === "UNDER_18") return "minor";
  if (code === "INVALID_BIRTH_DATE") return "invalid";
  return null;
}
