"use client";

import type { RoomConfig, RoomPresetId, SavedRoom } from "@/lib/parent-pack/types";
import { familyRequest } from "./session";

/** Mirrors `synq_backend/src/modules/family` (parent portal). The server is the only judge of status and permissions. */
export type FamilyStatus = "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "ACTIVE" | "REJECTED" | "SUSPENDED" | "REVOKED";
export type Relationship = "MOTHER" | "FATHER" | "LEGAL_GUARDIAN" | "OTHER_CAREGIVER";
export type NextStep = "SUBMIT_REQUEST" | "WAIT_FOR_CLINICIAN" | "REVIEW_AND_ACTIVATE" | "OPEN_DASHBOARD" | "CORRECT_AND_RESUBMIT" | "CONTACT_CLINICIAN" | "NONE";
export type Permission = "canCheckin" | "canJournal" | "canViewReports" | "canUseGuidance" | "canViewResources" | "canUseSafetyPlan" | "childSelfReport" | "viewChildSelfReport" | "showClinician";
export type Permissions = Record<Permission, boolean>;
export type Source = "OBSERVED" | "REPORTED_BY_CHILD" | "UNKNOWN";
export type ObsField = "mood" | "energy" | "focus" | "sleepHours" | "sleepQuality" | "transitions";

export interface ChildLink {
  childId: string;
  firstName: string | null;
  birthDate: string | null;
  age: number | null;
  relationship: Relationship;
  isLegalRepresentative: boolean;
  verificationNote: string | null;
  status: FamilyStatus;
  version: number;
  nextStep: NextStep;
  permissions: Permissions | null;
  clinician: { name: string } | null;
  track: string | null;
  decisionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  activatedAt: string | null;
}

export interface Observation {
  id: string;
  date: string;
  mood: number | null; energy: number | null; focus: number | null; sleepHours: number | null; sleepQuality: number | null; transitions: number | null;
  difficulties: string[]; behaviors: string[]; medication: string | null;
  sources: Partial<Record<ObsField, Source>>;
  respondent: "PARENT";
  updatedAt?: string;
}
export interface ChildSelfCheckin { id: string; date: string; mood: number; energy: number; focus: number; sleepHours: number; respondent: "CHILD" }

export interface CrisisStatus { status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "ESCALATED" | "FALSE_ALERT"; careTeamAlerted: boolean; handledAt: string | null }
export interface FamilyNote {
  id: string;
  createdAt: string;
  author: { role: "PARENT"; perspective: "THIRD_PERSON"; source: "PARENT_REPORTED_OBSERVATION" };
  reported: { title: string | null; content: string };
  analysisStatus: "PENDING" | "COMPLETED" | "FAILED";
  aiReading: { themes: string[]; emotions: string[]; heavy: boolean; safetyLevel: string; notice: string } | null;
  crisis: CrisisStatus | null;
  support?: { level: string; emergencyResources?: string[] } | null;
}

export interface Overview {
  child: { id: string; firstName: string | null; age: number | null; track: string | null };
  access: { status: FamilyStatus; version: number; permissions: Permissions; activatedAt: string | null };
  clinician: { name: string } | null;
  todayRecorded: boolean;
  lastCheckin: Observation | null;
  last7Days: { checkins: number };
  recentNotes: { id: string; title: string | null; createdAt: string; analysisStatus: string }[];
  childLastSelfCheckin: string | null;
  attention: { code: string; data?: Record<string, unknown> }[];
  nextStep: "RECORD_TODAY" | "WRITE_FIRST_NOTE" | null;
}

export interface FamilyContext {
  sources: {
    CLINICIAN_PROVIDED_CONTEXT: { available: boolean; track: string | null; setAt: string | null };
    PARENT_REPORTED_OBSERVATION: { available: boolean; days: number; unknownAnswers: Record<string, number>; recurringDifficulties: { label: string; days: number }[]; journalThemes: string[] };
    CHILD_SELF_REPORT: { available: boolean; shared: boolean; days: number };
  };
  contradictions: { date: string; field: string; parent: number; child: number }[];
  sufficiency: { enough: boolean; reasons: string[] };
  statements: { code: string; source?: string; data?: Record<string, unknown> }[];
  rules: string[];
  escalate: boolean;
  diagnosis: null;
}

export interface Report {
  from: string; to: string; generatedAt: string; disclaimer: string;
  summary: {
    daysObserved: number;
    averages: Record<string, number | null>;
    unknownAnswers: Record<string, number>;
    sleepRange: { min: number; max: number } | null;
    difficulties: { label: string; count: number }[];
    behaviors: { label: string; count: number }[];
    journal: { entries: number; themes: { label: string; count: number }[]; flaggedForReview: number };
  };
  days: Observation[];
}

export interface SafetyContact { name: string; relation?: string; phone: string; role: "trusted" | "professional" | "emergency" }
export interface SafetyPlan { contacts: SafetyContact[]; emergencyNumber: string | null; warningSigns: string[]; communication: string | null; agreedActions: string[]; reviewedWithProfessional: boolean; updatedAt?: string }
export interface Resource { id: string; title: string; titleAr: string | null; summary: string | null; url: string | null; sourceOrg: string | null; readingTimeMinutes: number | null }
export interface ParentProfile { id: string; email: string; firstName: string; lastName: string; phoneNumber: string | null; language: "EN" | "AR"; /** False while the address is unconfirmed. Absent on older answers. */ isEmailVerified?: boolean }
export interface Consent { id: string; purpose: string; version: string; grantedAt: string; withdrawnAt: string | null; childId: string | null; childFirstName: string | null }

export type CheckinInput = Partial<Record<ObsField, number | null>> & { date?: string; difficulties?: string[]; behaviors?: string[]; sources?: Partial<Record<ObsField, Source>> };

const child = (id: string) => `/parent/children/${encodeURIComponent(id)}`;
type One<T> = { data: T };

export const familyApi = {
  me: () => familyRequest<One<ParentProfile>>("GET", "/parent/me"),
  updateMe: (input: { firstName?: string; lastName?: string; phone?: string | null; lang?: "en" | "ar" }) => familyRequest<One<ParentProfile>>("PATCH", "/parent/me", input),
  consents: () => familyRequest<One<Consent[]>>("GET", "/parent/consents"),
  /** Closes and anonymises the parent account. Needs the current password; a wrong one answers 400 `INVALID_PASSWORD`. Throttled server-side. */
  deleteAccount: (password: string) => familyRequest<{ deleted: true }>("DELETE", "/parent/me", { password }),
  /** Public (the token is the proof); the parent API client is used so the one parent transport carries it. */
  verifyEmail: (token: string) => familyRequest<unknown>("POST", "/parent/auth/verify-email", { token }),
  /** Parent session required: answers `{ sent: true }`, `{ alreadyVerified: true }`, or 429 when throttled. */
  resendVerification: () => familyRequest<unknown>("POST", "/parent/auth/verify-email/resend", {}),

  children: () => familyRequest<One<ChildLink[]>>("GET", "/parent/children"),
  addChild: (input: { firstName: string; birthDate: string; relationship: Relationship; isLegalRepresentative: boolean; verificationNote?: string }) =>
    familyRequest<One<ChildLink>>("POST", "/parent/children", input),
  updateChild: (id: string, input: Partial<{ firstName: string; birthDate: string; relationship: Relationship; isLegalRepresentative: boolean; verificationNote: string }>) =>
    familyRequest<One<ChildLink>>("PATCH", child(id), input),
  access: (id: string) => familyRequest<One<ChildLink>>("GET", `${child(id)}/access`),
  submit: (id: string, clinicianEmail: string, consentVersion: string) =>
    familyRequest<One<ChildLink>>("POST", `${child(id)}/submit`, {
      clinicianEmail, consentVersion,
      consents: { FAMILY_DATA_PROCESSING: true, FAMILY_LEGAL_REPRESENTATIVE: true, FAMILY_CLINICIAN_SHARING: true },
    }),
  activate: (id: string, version: number) => familyRequest<One<ChildLink>>("POST", `${child(id)}/activate`, { version, accept: true }),
  withdraw: (id: string, reason?: string) => familyRequest<One<ChildLink>>("POST", `${child(id)}/withdraw`, { reason }),

  overview: (id: string) => familyRequest<One<Overview>>("GET", `${child(id)}/overview`),
  saveCheckin: (id: string, input: CheckinInput) => familyRequest<One<Observation>>("PUT", `${child(id)}/checkins`, input),
  checkins: (id: string, from?: string, to?: string) => familyRequest<{ data: { parent: Observation[]; child: ChildSelfCheckin[] | null } }>("GET", `${child(id)}/checkins`, undefined, { from, to }),
  removeCheckin: (id: string, date: string) => familyRequest<{ success: boolean }>("DELETE", `${child(id)}/checkins/${date}`),
  writeNote: (id: string, content: string, title?: string) => familyRequest<One<FamilyNote>>("POST", `${child(id)}/journal`, { content, ...(title ? { title } : {}) }),
  notes: (id: string, page = 1) => familyRequest<{ data: FamilyNote[]; meta: { total: number; page: number; totalPages?: number } }>("GET", `${child(id)}/journal`, undefined, { page, limit: 20 }),
  removeNote: (id: string, noteId: string) => familyRequest<{ success: boolean }>("DELETE", `${child(id)}/journal/${noteId}`),
  report: (id: string, from?: string, to?: string) => familyRequest<One<Report>>("GET", `${child(id)}/report`, undefined, { from, to }),
  context: (id: string) => familyRequest<One<FamilyContext>>("GET", `${child(id)}/context`),
  guidance: (id: string) => familyRequest<{ data: unknown[]; meta: { published: number; awaitingClinicalReview: number; track: string } }>("GET", `${child(id)}/guidance`),
  resources: (id: string) => familyRequest<{ data: Resource[]; meta: { track: string | null; reason?: string } }>("GET", `${child(id)}/resources`),
  // Room planner: `GET|PUT|DELETE /parent/children/:childId/room` (needs canViewResources; the API clamps every value).
  room: (id: string) => familyRequest<One<SavedRoom | null>>("GET", `${child(id)}/room`),
  saveRoom: (id: string, config: RoomConfig, presetId: RoomPresetId | null) => familyRequest<One<SavedRoom>>("PUT", `${child(id)}/room`, { config, presetId }),
  resetRoom: (id: string) => familyRequest<{ success: boolean }>("DELETE", `${child(id)}/room`),
  safetyPlan: (id: string) => familyRequest<{ data: SafetyPlan | null; emergencyResources: string[] }>("GET", `${child(id)}/safety-plan`),
  saveSafetyPlan: (id: string, plan: SafetyPlan) => familyRequest<One<SafetyPlan>>("PUT", `${child(id)}/safety-plan`, plan),
};
