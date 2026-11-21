/**
 * Facts the Privacy Policy & Terms of Use page renders. Only SynQ's legal owner can supply them.
 * `null` = not confirmed yet: the page shows <PendingLegalField /> ("To be confirmed before launch"), never a guess.
 */

export type RetentionPeriod = { category: "account" | "checkins" | "journal" | "orientation" | "clinicianNotes" | "accessLogs"; period: string | null };

export type LegalConfig = {
  controllerName: string | null;
  controllerAddress: string | null;
  privacyEmail: string | null;
  dpoContact: string | null;
  /** Country where personal data is stored, e.g. "United Arab Emirates". */
  hostingCountry: string | null;
  hostingProvider: string | null;
  retentionPeriods: readonly RetentionPeriod[];
  /** Companies whose AI services process text people write in SynQ. */
  aiSubprocessors: readonly string[] | null;
  /** Shown on the page only once this is set: a wrong answer either way would mislead. */
  journalsUsedForModelTraining: boolean | null;
  governingLaw: string | null;
  /** Version of the text people consent to at sign-up, e.g. "1.0". */
  version: string | null;
  /** YYYY-MM-DD. */
  lastUpdated: string | null;
};

export const LEGAL: LegalConfig = {
  controllerName: null,
  controllerAddress: null,
  privacyEmail: null,
  dpoContact: null,
  hostingCountry: null,
  hostingProvider: null,
  retentionPeriods: [
    { category: "account", period: null },
    { category: "checkins", period: null },
    { category: "journal", period: null },
    { category: "orientation", period: null },
    { category: "clinicianNotes", period: null },
    { category: "accessLogs", period: null },
  ],
  aiSubprocessors: null,
  journalsUsedForModelTraining: null,
  governingLaw: null,
  version: null,
  lastUpdated: null,
};
