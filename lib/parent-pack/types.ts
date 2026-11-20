/** Parent Pack types, mirroring `GET/PUT /api/v1/me/parent-pack/*` (synq_backend patient-parent-pack.controller). */
import type { PatientTrack, SafetyLevel } from "@/lib/api/patient-types";

export type Condition = "ADHD" | "BIPOLAR" | "PSYCHOSIS";

// ---------- Room planner (validated and clamped again by the API: parent-pack.util sanitizeRoomConfig)
export const ROOM_ITEMS = ["bed", "desk", "calmCorner", "storage", "lamp"] as const;
export type RoomItemKey = (typeof ROOM_ITEMS)[number];
export type Rotation = 0 | 90 | 180 | 270;
export type RoomItem = { x: number; z: number; rotation: Rotation; visible: boolean };
export type LightMode = "soft" | "work" | "night";
export type WallTone = "calm" | "neutral" | "warm";
export type RoomConfig = {
  width: number;
  depth: number;
  wallTone: WallTone;
  decor: boolean;
  items: Record<RoomItemKey, RoomItem>;
  light: { mode: LightMode; intensity: number; temperature: number; ceiling: boolean };
};
export type RoomPresetId = "calm-corner" | "organized-desk" | "soft-lighting" | "minimal-distraction" | "balanced";
export type RoomPreset = { id: RoomPresetId; name: string; description: string; config: RoomConfig };
export type SavedRoom = { config: RoomConfig; presetId: RoomPresetId | null; updatedAt: string };

// ---------- Caregiver observations
export const DIFFICULTIES = ["transitions", "sleep", "focus", "conflict", "school", "routine", "mood-change", "unusual-experiences", "other"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const MEDICATION_NOTES = ["AS_PLANNED", "PARTLY", "MISSED", "NOT_APPLICABLE"] as const;
export type MedicationNote = (typeof MEDICATION_NOTES)[number];

export type CaregiverCheckin = {
  id: string;
  date: string;
  mood: number;
  energy: number;
  focus: number;
  sleepHours: number;
  sleepQuality: number | null;
  difficulties: Difficulty[];
  medication: MedicationNote | null;
  updatedAt: string;
};
export type CaregiverCheckinInput = Omit<CaregiverCheckin, "id" | "updatedAt" | "date"> & { date?: string };

export type CaregiverJournalEntry = {
  id: string;
  title: string | null;
  content: string;
  createdAt: string;
  analysisStatus: "PENDING" | "COMPLETED" | "FAILED" | "SKIPPED";
  analysis: { themes: string[]; safetyLevel?: string } | null;
};
export type JournalSupport = { level: SafetyLevel; emergencyResources?: string[] };

export type CountRow = { label: string; count: number };
export type CaregiverReport = {
  from: string;
  to: string;
  generatedAt: string;
  disclaimer: string;
  days: CaregiverCheckin[];
  summary: {
    daysObserved: number;
    averages: { mood: number | null; energy: number | null; focus: number | null; sleepHours: number | null; sleepQuality: number | null };
    sleepRange: { min: number; max: number } | null;
    difficulties: CountRow[];
    medication: CountRow[];
    journal: { entries: number; themes: CountRow[]; flaggedForReview: number };
  };
};

// ---------- Guidance
export type GuidanceTool = "token-board" | "visual-timer" | "checklist";
export type GuidanceResource = {
  id: string;
  condition: Condition;
  topic: string;
  title: string;
  summary: string;
  points: string[];
  exercise?: { tool: GuidanceTool; title: string; items?: string[] };
  inspiredBy?: string;
  difficulties: Difficulty[];
  review: "pending-clinical-review";
  forThisTrack: boolean;
  suggested: boolean;
  viewedAt: string | null;
  favorite: boolean;
};

// ---------- Safety plan
export type ContactRole = "trusted" | "professional" | "emergency";
export type SafetyContact = { name: string; relation: string; phone: string; role: ContactRole };
export type SafetyPlan = {
  contacts: SafetyContact[];
  emergencyNumber: string | null;
  warningSigns: string[];
  communication: string | null;
  agreedActions: string[];
  reviewedWithProfessional: boolean;
  updatedAt?: string;
};
export type SafetyPlanResponse = { data: SafetyPlan | null; emergencyResources: string[] };
export type EmergencyState = "empty" | "no-emergency-number" | "ready";

// ---------- Parent wellbeing
export const PARENT_DIFFICULTIES = ["sleep", "time", "work", "isolation", "conflict", "worry", "health", "other"] as const;
export type ParentDifficulty = (typeof PARENT_DIFFICULTIES)[number];
export type ParentCheckin = { id: string; date: string; fatigue: number; stress: number; load: number; needsRest: boolean; difficulties: ParentDifficulty[] };
export type ParentCheckinInput = Omit<ParentCheckin, "id" | "date"> & { date?: string };

// ---------- Overview
export type ParentOverview = {
  track: PatientTrack;
  condition: Condition | null;
  todayCheckin: CaregiverCheckin | null;
  last7Days: { checkins: number; journalEntries: number };
  lastWellbeing: { date: string; fatigue: number; stress: number; load: number } | null;
  safetyPlan: { exists: boolean; contacts: number; hasEmergencyNumber: boolean; updatedAt: string | null };
  room: { presetId: RoomPresetId | null; updatedAt: string } | null;
};
