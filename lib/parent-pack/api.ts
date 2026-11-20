import { AGENT_TIMEOUT_MS, api } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/patient-types";
import type {
  CaregiverCheckin, CaregiverCheckinInput, CaregiverJournalEntry, CaregiverReport, GuidanceResource, JournalSupport,
  ParentCheckin, ParentCheckinInput, ParentOverview, RoomConfig, RoomPresetId, SafetyPlan, SafetyPlanResponse, SavedRoom,
} from "./types";

type Range = { from?: string; to?: string };
const BASE = "/me/parent-pack";

/** Parent Pack — `/api/v1/me/parent-pack/*`. Own rows only: the server derives the account from the patient token. */
export const parentPackApi = {
  overview: (signal?: AbortSignal) => api.get<{ data: ParentOverview }>(BASE, undefined, { signal }),
  erase: () => api.delete<{ success: boolean }>(BASE),

  /** Validated by the Check-in engine, like the patient's own check-in. */
  submitCheckin: (input: CaregiverCheckinInput) => api.put<{ data: CaregiverCheckin }>(`${BASE}/checkins`, input, { timeoutMs: AGENT_TIMEOUT_MS }),
  checkins: (range: Range = {}, signal?: AbortSignal) => api.get<{ data: CaregiverCheckin[] }>(`${BASE}/checkins`, range, { signal }),
  removeCheckin: (date: string) => api.delete<{ success: boolean }>(`${BASE}/checkins/${encodeURIComponent(date)}`),

  /** Analysed by the Smart Journal engine with the caregiver crisis screen. `support.level === "crisis"` comes with resources. */
  writeJournal: (input: { title?: string; content: string }) =>
    api.post<CaregiverJournalEntry & { support?: JournalSupport }>(`${BASE}/journal`, input, { timeoutMs: AGENT_TIMEOUT_MS }),
  journal: (query: Range & { page?: number; limit?: number } = {}, signal?: AbortSignal) =>
    api.get<Paginated<CaregiverJournalEntry>>(`${BASE}/journal`, query, { signal }),
  removeJournal: (entryId: string) => api.delete<{ success: boolean }>(`${BASE}/journal/${encodeURIComponent(entryId)}`),
  report: (range: Range, signal?: AbortSignal) => api.get<{ data: CaregiverReport }>(`${BASE}/report`, range, { signal }),

  guidance: (signal?: AbortSignal) => api.get<{ data: GuidanceResource[] }>(`${BASE}/guidance`, undefined, { signal }),
  setGuidance: (resourceId: string, input: { viewed?: boolean; favorite?: boolean }) =>
    api.put<{ data: { resourceId: string; viewedAt: string | null; favorite: boolean } }>(`${BASE}/guidance/${encodeURIComponent(resourceId)}`, input),

  room: (signal?: AbortSignal) => api.get<{ data: SavedRoom | null }>(`${BASE}/room`, undefined, { signal }),
  saveRoom: (config: RoomConfig, presetId: RoomPresetId | null) => api.put<{ data: SavedRoom }>(`${BASE}/room`, { config, presetId }),
  resetRoom: () => api.delete<{ success: boolean }>(`${BASE}/room`),

  safetyPlan: (signal?: AbortSignal) => api.get<SafetyPlanResponse>(`${BASE}/safety-plan`, undefined, { signal }),
  saveSafetyPlan: (plan: Omit<SafetyPlan, "updatedAt">) => api.put<{ data: SafetyPlan }>(`${BASE}/safety-plan`, plan),

  wellbeing: (days = 30, signal?: AbortSignal) => api.get<{ data: ParentCheckin[] }>(`${BASE}/wellbeing`, { days }, { signal }),
  submitWellbeing: (input: ParentCheckinInput) => api.put<{ data: ParentCheckin }>(`${BASE}/wellbeing`, input),
};
