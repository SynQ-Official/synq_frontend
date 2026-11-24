import { ApiError } from "@/lib/api/errors";
import type { CheckinInput, ObsField, Permissions, Source } from "./api";

export type FamilyTab = "overview" | "checkin" | "journal" | "guidance" | "progress" | "resources" | "room" | "safety";

/** Tabs follow what the clinician granted. Hiding is for clarity only: the API refuses anything not granted anyway. */
export function visibleTabs(p: Permissions): FamilyTab[] {
  const tabs: FamilyTab[] = ["overview"];
  if (p.canCheckin) tabs.push("checkin");
  if (p.canJournal) tabs.push("journal");
  if (p.canUseGuidance) tabs.push("guidance");
  if (p.canViewReports) tabs.push("progress");
  if (p.canViewResources) tabs.push("resources", "room"); // the API gates the room planner with the same permission
  if (p.canUseSafetyPlan) tabs.push("safety");
  return tabs;
}

export type FieldAnswer = { value: number | null; source: Exclude<Source, "UNKNOWN"> };
export type CheckinForm = Record<ObsField, FieldAnswer> & { difficulties: string[]; behaviors: string[] };

export const emptyCheckinForm = (): CheckinForm => ({
  mood: { value: null, source: "OBSERVED" }, energy: { value: null, source: "OBSERVED" }, focus: { value: null, source: "OBSERVED" },
  sleepHours: { value: null, source: "OBSERVED" }, sleepQuality: { value: null, source: "OBSERVED" }, transitions: { value: null, source: "OBSERVED" },
  difficulties: [], behaviors: [],
});

const FIELDS: ObsField[] = ["mood", "energy", "focus", "sleepHours", "sleepQuality", "transitions"];

/** "I don't know" is sent as null with no source (the server stores UNKNOWN); a known value carries who it comes from. */
export function toCheckinInput(form: CheckinForm): CheckinInput {
  const input: CheckinInput = { difficulties: form.difficulties, behaviors: form.behaviors, sources: {} };
  for (const field of FIELDS) {
    const { value, source } = form[field];
    input[field] = value;
    if (value !== null) input.sources![field] = source;
  }
  return input;
}

export const isEmptyCheckin = (form: CheckinForm) => FIELDS.every((f) => form[f].value === null) && !form.difficulties.length && !form.behaviors.length;

/** A saved observation back into the form (an UNKNOWN field stays "I don't know"). */
export function fromObservation(o: Partial<Record<ObsField, number | null>> & { sources?: Partial<Record<ObsField, Source>>; difficulties?: string[]; behaviors?: string[] }): CheckinForm {
  const form = emptyCheckinForm();
  for (const field of FIELDS) {
    const value = o[field] ?? null;
    const source = o.sources?.[field];
    form[field] = { value, source: source === "REPORTED_BY_CHILD" ? "REPORTED_BY_CHILD" : "OBSERVED" };
  }
  form.difficulties = o.difficulties ?? [];
  form.behaviors = o.behaviors ?? [];
  return form;
}

export type FamilyErrorKind = "not-active" | "denied" | "not-found" | "stale" | "clinician" | "consent" | "adult" | "legal" | "exists" | "invalid" | "network" | "unverified" | "other";

export function errorKind(error: unknown): FamilyErrorKind {
  if (!(error instanceof ApiError)) return "other";
  const code = error.code ?? "";
  if (error.status === 0) return "network";
  if (code === "FAMILY_ACCESS_NOT_ACTIVE") return "not-active";
  if (code === "FAMILY_PERMISSION_DENIED") return "denied";
  if (code === "FAMILY_LINK_STALE") return "stale";
  if (code === "CLINICIAN_NOT_FOUND") return "clinician";
  if (code === "CONSENT_REQUIRED") return "consent";
  if (code === "CHILD_IS_ADULT") return "adult";
  if (code === "LEGAL_REPRESENTATIVE_REQUIRED") return "legal";
  if (code === "EMAIL_NOT_VERIFIED") return "unverified";
  if (error.status === 404) return "not-found";
  if (error.status === 409) return "exists";
  if (error.status === 401 || error.status === 400) return "invalid";
  return "other";
}
