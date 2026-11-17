import type { PatientTrack } from "@/lib/api/patient-types";

/**
 * The home tour. One registry, filtered twice: by the patient's track (`tracks`) and by what is really on
 * screen (a step whose `[data-tour]` target is missing or hidden is skipped), so the tour can never point at
 * something this patient does not have. Copy lives in `copy.tour.steps[id]` (lib/i18n/patient.ts).
 *
 * Targets: `data-tour="<id>"` on the cards of the home page and `data-tour="nav-<key>"` on the navigation links
 * (the rail and the tab bar carry the same id; only the visible one is used).
 */
export type TourStepId =
  | "welcome" | "spark" | "reads" | "wellbeing" | "trend" | "plan" | "goals"
  | "nav-checkin" | "nav-journal" | "nav-spark" | "nav-library" | "nav-reports";

export type TourStep = {
  id: TourStepId;
  /** Only for these tracks; absent = every track. */
  tracks?: readonly PatientTrack[];
};

const READING_TRACKS: readonly PatientTrack[] = ["BIPOLAR", "SCHIZOPHRENIA"];

export const TOUR_STEPS: readonly TourStep[] = [
  { id: "welcome" },
  { id: "spark", tracks: ["ADHD"] },
  { id: "wellbeing" },
  { id: "trend" },
  { id: "plan" },
  { id: "goals" },
  { id: "reads", tracks: READING_TRACKS },
  { id: "nav-checkin" },
  { id: "nav-journal" },
  { id: "nav-spark", tracks: ["ADHD"] },
  { id: "nav-library", tracks: READING_TRACKS },
  { id: "nav-reports" },
];

/** The visible element carrying `data-tour="id"`, if any (the rail and the tab bar share ids; one is always hidden). */
export function findTourTarget(id: TourStepId): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const candidates = document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`);
  for (const element of candidates) {
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return element;
  }
  return null;
}

/** The steps that apply to this track and whose targets are on screen right now. */
export function resolveTourSteps(track: PatientTrack): TourStep[] {
  return TOUR_STEPS.filter((step) => (!step.tracks || step.tracks.includes(track)) && findTourTarget(step.id));
}

// "Seen" is remembered per patient on this device (there is no backend flag for it).
const TOUR_SEEN_KEY = "vitamind_tour_seen";

export function hasSeenTour(userId: string): boolean {
  try {
    return window.localStorage.getItem(`${TOUR_SEEN_KEY}:${userId}`) === "1";
  } catch {
    return true; // storage blocked: never nag on every visit
  }
}

export function markTourSeen(userId: string) {
  try {
    window.localStorage.setItem(`${TOUR_SEEN_KEY}:${userId}`, "1");
  } catch {
    /* storage unavailable — nothing is remembered, nothing breaks */
  }
}
