/**
 * Example data for the SynQ Psy illustrations. Nothing here is real: it only has to look like a calm practice.
 * Colours are the clinician app's own (clinical teal, slate ink, a risk scale from emerald to red) written as hex because the
 * site's `teal-*` tokens are the brand's, not the app's.
 */

export const PSY_COLOR = {
  brand: "#0f766e",
  teal: "#0d9488",
  tealSoft: "#99f6e4",
  tealFaint: "#f0fdfa",
  indigo: "#6366f1",
  slate: "#cbd5e1",
  red: "#ef4444",
  amber: "#f59e0b",
  orange: "#f97316",
  green: "#10b981",
} as const;

/** The traffic light of a patient, most urgent first: priority, watch, stable. */
export const TRAFFIC = [
  { color: PSY_COLOR.red, chip: "bg-red-50 text-red-700 ring-red-200" },
  { color: PSY_COLOR.amber, chip: "bg-amber-50 text-amber-700 ring-amber-200" },
  { color: PSY_COLOR.green, chip: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
] as const;

/** Change against the previous period for the first three KPIs, and whether a fall is the good direction. */
export const KPI_DELTAS: readonly { pct: number | null; goodWhen: "up" | "down" }[] = [
  { pct: -12, goodWhen: "down" },
  { pct: 8, goodWhen: "up" },
  { pct: 5, goodWhen: "up" },
  { pct: null, goodWhen: "down" },
];

/** Thirty days of sessions: completed, scheduled and missed, with the calm rhythm of a working month (no weekends). */
export const ACTIVITY: readonly (readonly [completed: number, scheduled: number, missed: number])[] = Array.from({ length: 30 }, (_, day) => {
  const weekend = day % 7 === 5 || day % 7 === 6;
  if (weekend) return [0, 0, 0] as const;
  const completed = day > 22 ? 0 : 1 + ((day * 7 + 3) % 4);
  const scheduled = day > 22 ? 1 + ((day * 5 + 1) % 3) : (day * 3) % 2;
  const missed = (day * 11) % 9 === 0 ? 1 : 0;
  return [completed, scheduled, missed] as const;
});

/** Caseload split in the order priority, watch, stable. */
export const RISK_VALUES = [2, 3, 7] as const;

/** Priority patients: [traffic light index, open alerts, worsened]. Alerts add up to DEMO_OPEN_ALERTS (KPI, rail, triage). */
export const PATIENT_ROWS: readonly (readonly [light: 0 | 1 | 2, alerts: number, worsened: boolean])[] = [
  [0, 2, true],
  [1, 1, false],
  [1, 0, false],
  [2, 0, false],
];

/** Attention items by kind: an alert, an alert, a priority report, an assessment to review. */
export const ATTENTION_KINDS = ["alert", "alert", "report", "assessment"] as const;
/** One colour per kind, so the same kind always reads the same: safety in red, a report in amber, routine review in slate. */
export const ATTENTION_BADGES = {
  alert: "bg-red-50 text-red-700 ring-red-200",
  report: "bg-amber-50 text-amber-700 ring-amber-200",
  assessment: "bg-slate-50 text-slate-700 ring-slate-200",
} as const;
export const ATTENTION_TONES = {
  alert: "bg-red-50 text-red-600",
  report: "bg-orange-50 text-orange-600",
  assessment: "bg-sky-50 text-sky-600",
} as const;

/** Rail item lit for each screen: [group, item]. */
export const ACTIVE_NAV = {
  overview: [0, 0],
  requests: [0, 1],
  patient: [0, 3],
  reports: [1, 1],
} as const;
export type PsyScreen = keyof typeof ACTIVE_NAV;
