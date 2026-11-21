/**
 * Emergency and crisis numbers shown on every page (footer banner, "Need help now" panel, /help, support FAQ).
 * The one place these numbers live: no component may write a number by hand.
 *
 * Every entry names its public source and the date it was last checked. 197 (Tunisian police) is NOT a crisis line
 * and must never appear here (see lib/emergency.test.ts).
 */

export type EmergencyCountry = "AE" | "TN";

export type EmergencyLine = {
  id: "ae-ambulance" | "ae-sakina" | "ae-hope" | "tn-samu";
  country: EmergencyCountry;
  /** Set when the line only serves part of the country. */
  region?: "abu-dhabi";
  /** Who answers, in English, as the source names it. The shown label comes from `labelKey`. */
  service: string;
  /** Digits as people dial them, grouped for reading. Always rendered left-to-right. */
  display: string;
  /** Memorable alias printed by the source, when it has one ("800-SAKINA"). */
  alias?: string;
  telHref: `tel:${string}`;
  /** "24/7", or opening hours in 24-hour local time. */
  hours: string;
  /** Key in lib/i18n/help.ts `lines`. */
  labelKey: "ambulance" | "sakina" | "hope" | "samu";
  /** Lines in the one-sentence footer banner; the others appear in the panel and on /help only. */
  inBanner: boolean;
  sourceUrl: string;
  /** YYYY-MM-DD. */
  lastVerified: string;
};

export const EMERGENCY_LINES: readonly EmergencyLine[] = [
  {
    id: "ae-ambulance",
    country: "AE",
    service: "Ambulance",
    display: "998",
    telHref: "tel:998",
    hours: "24/7",
    labelKey: "ambulance",
    inBanner: true,
    sourceUrl: "https://u.ae/en/information-and-services/justice-safety-and-the-law/handling-emergencies",
    lastVerified: "2026-11-20",
  },
  {
    id: "ae-sakina",
    country: "AE",
    region: "abu-dhabi",
    service: "SAKINA psychological support line",
    display: "800 725462",
    alias: "800-SAKINA",
    telHref: "tel:800725462",
    hours: "24/7",
    labelKey: "sakina",
    inBanner: true,
    sourceUrl: "https://www.doh.gov.ae/",
    lastVerified: "2026-11-20",
  },
  {
    id: "ae-hope",
    country: "AE",
    service: "HOPE national psychological support line",
    display: "800 4673",
    telHref: "tel:8004673",
    hours: "8:00–20:00",
    labelKey: "hope",
    inBanner: false,
    sourceUrl: "https://hw.gov.ae/",
    lastVerified: "2026-11-20",
  },
  {
    id: "tn-samu",
    country: "TN",
    service: "SAMU (emergency medical service)",
    display: "190",
    telHref: "tel:190",
    hours: "24/7",
    labelKey: "samu",
    inBanner: true,
    sourceUrl: "https://www.gov.uk/foreign-travel-advice/tunisia/safety-and-security",
    lastVerified: "2026-11-20",
  },
];

/**
 * Country order by interface language. Never by IP geolocation: a person in crisis must not be routed by a guess.
 * Both languages are used in both markets, so the order is a product choice, kept here to change in one place.
 */
export const COUNTRY_ORDER: Record<"en" | "ar", readonly EmergencyCountry[]> = {
  en: ["AE", "TN"],
  ar: ["AE", "TN"],
};

export function linesByCountry(language: "en" | "ar") {
  return COUNTRY_ORDER[language].map((country) => ({ country, lines: EMERGENCY_LINES.filter((line) => line.country === country) }));
}
