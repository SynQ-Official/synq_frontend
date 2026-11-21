/**
 * Clinical commitments the public site may state. `null` = not signed off by SynQ's clinical lead: the sentence that
 * depends on it is left out, never filled with a guess.
 *
 * Note for the clinical lead: the API has internal timers (crisis 15 min, clinical alert 72 h) and a cover rota
 * (ON_CALL / LEAVE_COVER). They are engineering defaults, not a published promise, so they are not copied here.
 */

export type ScreeningTool = {
  short: string;
  name: string;
  /** Who the tool was validated with, in the source's own terms. */
  validatedPopulation: string;
};

export type ClinicalConfig = {
  /** Hours within which the assigned clinician must respond to a safety alert. */
  alertResponseSlaHours: number | null;
  /** A covering clinician is alerted when the assigned one does not respond in time. */
  coveringClinicianEnabled: boolean | null;
  /** What a parent account sees about their teenager. */
  parentVisibility: "attendance_and_safety_alerts" | null;
  screeningTools: readonly ScreeningTool[];
};

export const CLINICAL: ClinicalConfig = {
  alertResponseSlaHours: null,
  coveringClinicianEnabled: null,
  parentVisibility: null,
  screeningTools: [
    { short: "ASRS v1.1", name: "Adult ADHD Self-Report Scale (World Health Organization)", validatedPopulation: "Adults aged 18 and over" },
    { short: "MDQ", name: "Mood Disorder Questionnaire", validatedPopulation: "Adults" },
    { short: "PQ-B", name: "Prodromal Questionnaire–Brief", validatedPopulation: "Adolescents and young adults" },
  ],
};
