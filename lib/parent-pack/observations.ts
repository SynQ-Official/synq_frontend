import type { CaregiverCheckin, ContactRole, Difficulty, EmergencyState, SafetyContact, SafetyPlan } from "./types";

/** Local calendar day as YYYY-MM-DD (an evening entry belongs to today, not to UTC's date). */
export function localDay(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + n);
  return localDay(d);
};

/** One point per calendar day of the window; a day with no observation stays empty (no invented values). */
export function dailySeries(checkins: CaregiverCheckin[], days: number, field: "sleepHours" | "mood" | "energy" | "focus" | "sleepQuality", today = localDay()) {
  const byDay = new Map(checkins.map((c) => [c.date.slice(0, 10), c]));
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(today, i - days + 1);
    const value = byDay.get(day)?.[field];
    return { label: day.slice(5).replace("-", "/"), value: value ?? null };
  });
}

/** How often each difficulty was ticked in the window, most frequent first. Counts only. */
export function difficultyCounts(checkins: CaregiverCheckin[]): { label: Difficulty; count: number }[] {
  const counts = new Map<Difficulty, number>();
  checkins.forEach((c) => c.difficulties.forEach((d) => counts.set(d, (counts.get(d) ?? 0) + 1)));
  return [...counts].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  transitions: "Transitions", sleep: "Sleep", focus: "Focus", conflict: "Conflict", school: "School", routine: "Routine",
  "mood-change": "Mood change", "unusual-experiences": "Unusual experiences", other: "Other",
};

// ---------------- safety plan
/** 3 to 15 digits, as the API checks. */
export const isDialable = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return /^\+?[\d\s().-]{3,24}$/.test(phone.trim()) && digits.length >= 3 && digits.length <= 15;
};

export function contactError(contact: Pick<SafetyContact, "name" | "phone">): string | null {
  if (!contact.name.trim()) return "Add a name.";
  if (contact.name.trim().length > 80) return "Keep the name under 80 characters.";
  if (!isDialable(contact.phone)) return "Enter a phone number with 3 to 15 digits.";
  return null;
}

/** What the emergency panel can show: nothing saved yet, a plan without the local emergency number, or ready. */
export function emergencyState(plan: SafetyPlan | null): EmergencyState {
  if (!plan || (plan.contacts.length === 0 && !plan.emergencyNumber && plan.agreedActions.length === 0)) return "empty";
  return plan.emergencyNumber ? "ready" : "no-emergency-number";
}

/** A `tel:` link for a typed number, or null. */
export const telLink = (phone: string) => (isDialable(phone) ? `tel:${phone.replace(/[^\d+]/g, "")}` : null);

export const ROLE_LABELS: Record<ContactRole, string> = { trusted: "Trusted contact", professional: "Treating professional", emergency: "Emergency contact" };

export const EMPTY_PLAN: SafetyPlan = { contacts: [], emergencyNumber: null, warningSigns: [], communication: null, agreedActions: [], reviewedWithProfessional: false };
