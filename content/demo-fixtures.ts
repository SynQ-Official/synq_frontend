/**
 * Example data for every public mock-up (home hero, /mira, /lumina, /clinician). One fictional patient, the same on
 * every screen, always labelled "Example". No diagnosis is shown anywhere, and every number is ordinary.
 * Nothing here is real.
 */

type Localized = { en: string; ar: string };

export const DEMO_PATIENT = {
  firstName: { en: "Sara", ar: "سارة" } satisfies Localized,
  /** First name + initial: how a clinician sees the patient once care has started. */
  shortName: { en: "Sara K.", ar: "سارة ك." } satisfies Localized,
  /** Before the clinician accepts the request, only this pseudonymous code is shown. */
  code: "SK-014",
} as const;

export const DEMO_CLINICIAN = {
  /** As the patient sees them ("Shared with Dr Rania"). */
  shortName: { en: "Dr Rania", ar: "د. رانيا" } satisfies Localized,
  fullName: { en: "Dr Rania Haddad", ar: "د. رانيا حداد" } satisfies Localized,
  firstName: { en: "Rania", ar: "رانيا" } satisfies Localized,
  role: { en: "Psychiatrist", ar: "طبيبة نفسية" } satisfies Localized,
} as const;

/** The mood scale every public mock-up uses: centred on the person's usual, never "Great" as the top. */
export const DEMO_MOOD_SCALE: Record<"en" | "ar", readonly string[]> = {
  en: ["Much lower", "Lower", "Usual", "Higher", "Much higher"],
  ar: ["أقل بكثير", "أقل", "كالمعتاد", "أعلى", "أعلى بكثير"],
};

/** Today's example check-in: mood on "Usual" (index in DEMO_MOOD_SCALE). */
export const DEMO_CHECKIN = { moodIndex: 2, sleepHours: 7 } as const;

/** Shared observations, written the way the clinician sees them: what changed, by how much, for how long. */
export const DEMO_OBSERVATIONS = {
  sleep: { en: "Sleep 2 h below usual, 5 nights in a row", ar: "النوم أقل من المعتاد بساعتين، 5 ليالٍ متتالية" },
  checkinsPaused: { en: "No check-in for 7 days", ar: "لا فحص يومي منذ 7 أيام" },
  moodLower: { en: "Mood lower than usual, 3 days", ar: "المزاج أقل من المعتاد، 3 أيام" },
  steady: { en: "Within usual range", ar: "ضمن النطاق المعتاد" },
} as const;

/** Open alerts on the clinician screens: the KPI, the rail badge, the triage bar and the patient rows all add up to this. */
export const DEMO_OPEN_ALERTS = 3;

/** Extract of the example monthly report the clinician signs. */
export const DEMO_MONTHLY_REPORT: Record<"en" | "ar", readonly (readonly [label: string, line: string])[]> = {
  en: [
    ["Sleep", "6 h 10 on average, 1 h below usual. Lowest in week 3."],
    ["Mood", "Usual on 22 of 28 days. Lower on 6, none much lower."],
    ["Shared notes", "2 excerpts Sara chose to share, both about work."],
  ],
  ar: [
    ["النوم", "6 س و10 د في المتوسط، أقل من المعتاد بساعة. الأدنى في الأسبوع الثالث."],
    ["المزاج", "كالمعتاد في 22 من 28 يوماً. أقل في 6، ولا يوم أقل بكثير."],
    ["ملاحظات مشارَكة", "مقتطفان اختارت سارة مشاركتهما، كلاهما عن العمل."],
  ],
};
