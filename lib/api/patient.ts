import { AGENT_TIMEOUT_MS, api } from "./client";
import type {
  AssignedExercise,
  Checkin,
  CheckinGoal,
  Consent,
  DailyReport,
  Exercise,
  GoalStatus,
  JournalEntry,
  JournalInsights,
  LibraryCurrent,
  LibraryEventType,
  LibraryRecommendation,
  Paginated,
  Profile,
  ReportDetail,
  ReportListItem,
  OrientationConsent,
  SparkView,
} from "./patient-types";

/**
 * Signed-in patient space — `/api/v1/me/*` (patient-daily, patient-care and
 * patient-clinical controllers). Every call is authorized by the patient token;
 * the backend derives ownership from it, never from ids in the body.
 */

type Scale = number; // 0–10 self-report (journal mood)
export type LocalDay = string; // YYYY-MM-DD
export type DayRange = { from?: LocalDay; to?: LocalDay };

export type JournalEntryType = "DAILY" | "EMOTIONAL" | "THERAPY" | "GRATITUDE" | "CRISIS";
export type IntakeStatus = "TAKEN" | "MISSED" | "SKIPPED";
export type InterventionResult = "EFFECTIVE" | "PARTIALLY_EFFECTIVE" | "INEFFECTIVE" | "UNCERTAIN";
export type InterventionEngagement = "OFFERED" | "ACCEPTED" | "STARTED" | "COMPLETED" | "DECLINED" | "UNKNOWN";
export type JournalShareLevel = "NONE" | "FLAGGED_EXCERPTS" | "FULL";

export type CheckinInput = {
  date?: LocalDay;
  /** 1–5 */
  mood: number;
  /** 1–5 */
  energy: number;
  /** 1–5 */
  focus: number;
  /** Hours slept last night, 0–24. */
  sleepHours: number;
  /** Up to 3 goals; replaced as a whole, and only while none is resolved. */
  goals?: { title: string }[];
};

export type JournalEntryInput = {
  title?: string;
  content: string;
  entryType?: JournalEntryType;
  moodScore?: Scale;
  /** 1–10: how much of the day's goals were achieved. */
  goalScore?: number;
  emotions?: string[];
  tags?: string[];
  isPrivate?: boolean;
};

export type ConsentInput = {
  shareDiagnostics?: boolean;
  shareMoodData?: boolean;
  shareSleepData?: boolean;
  shareMedication?: boolean;
  shareExercises?: boolean;
  journalShare?: JournalShareLevel;
  safetyAlertsConsent?: boolean;
  monitoringNoticeAccepted?: boolean;
};

const id = (value: string) => encodeURIComponent(value);

export const profileApi = {
  get: () => api.get<Profile>("/me"),
  update: (input: { nickname?: string; language?: "EN" | "AR" }) => api.patch<Profile>("/me", input),
  completeOnboarding: () => api.post<Profile>("/me/onboarding/complete"),
  /** The consent to orientation and follow-up on file. */
  orientationConsent: () => api.get<{ data: OrientationConsent }>("/me/orientation-consent"),
  /** Accept the current consent text (with its version) or withdraw it. */
  setOrientationConsent: (granted: boolean, version?: string) => api.put<{ data: OrientationConsent }>("/me/orientation-consent", { granted, version }),
};

export const checkinsApi = {
  /** Today's check-in (or the day in `date`). The Check-in engine validates it before it is saved. */
  create: (input: CheckinInput) => api.post<{ data: Checkin }>("/me/checkins", input, { timeoutMs: AGENT_TIMEOUT_MS }),
  today: (date?: LocalDay) => api.get<{ data: Checkin | null }>("/me/checkins/today", { date }),
  list: (range: DayRange = {}) => api.get<{ data: Checkin[]; meta: { from: string; to: string; count: number } }>("/me/checkins", range),
  /** Resolve a goal during the day (or put it back to PENDING). */
  setGoal: (goalId: string, status: GoalStatus) => api.patch<{ data: CheckinGoal }>(`/me/checkins/goals/${id(goalId)}`, { status }),
  weeklyReport: (weekStart: LocalDay) => api.get<{ data: DailyReport }>("/me/checkins/reports/weekly", { weekStart }),
  monthlyReport: (year: number, month: number) => api.get<{ data: DailyReport }>("/me/checkins/reports/monthly", { year, month }),
  /** The patient's check-in time and reminder choices (null until set), with today's status in their own zone. */
  schedule: () => api.get<{ data: CheckinSchedule | null }>("/me/checkins/schedule"),
  /** Set or change it: one schedule per patient; reminders are sent by the server. */
  setSchedule: (input: CheckinScheduleInput) => api.put<{ data: CheckinSchedule }>("/me/checkins/schedule", input),
};

export type CheckinScheduleInput = { time: string; timezone: string; remindersEnabled?: boolean; emailReminders?: boolean };
export type CheckinSchedule = {
  time: string;
  timezone: string;
  remindersEnabled: boolean;
  emailReminders: boolean;
  updatedAt: string;
  today: { localDate: string; dueAt: string; overdueAt: string; completed: boolean };
};

export const journalApi = {
  create: (input: JournalEntryInput) => api.post<JournalEntry>("/me/journal", input, { timeoutMs: AGENT_TIMEOUT_MS }),
  list: (query: DayRange & { page?: number; limit?: number } = {}) => api.get<Paginated<JournalEntry>>("/me/journal", query),
  insights: (days = 30) => api.get<{ data: JournalInsights }>("/me/journal/insights", { days }),
  get: (entryId: string) => api.get<JournalEntry>(`/me/journal/${id(entryId)}`),
  update: (entryId: string, input: Partial<JournalEntryInput>) => api.patch<JournalEntry>(`/me/journal/${id(entryId)}`, input),
  analyze: (entryId: string) => api.post<JournalEntry>(`/me/journal/${id(entryId)}/analyze`, undefined, { timeoutMs: AGENT_TIMEOUT_MS }),
  remove: (entryId: string) => api.delete<{ success: boolean }>(`/me/journal/${id(entryId)}`),
  /** The excerpt must be copied verbatim from the entry. */
  shareExcerpt: (entryId: string, excerpt: string) =>
    api.post<{ id: string; content: string; sharedAt: string }>(`/me/journal/${id(entryId)}/excerpts`, { excerpt }),
  unshareExcerpt: (excerptId: string) => api.delete<{ success: boolean }>(`/me/journal/excerpts/${id(excerptId)}`),
};

export const careApi = {
  medications: () => api.get<{ data: { id: string; name: string; dosage: string | null; frequency: string | null }[] }>("/me/medications"),
  intakes: (range: DayRange = {}) => api.get<{ data: { id: string; medicationId: string; scheduledAt: string; status: IntakeStatus }[] }>("/me/medications/intakes", range),
  logIntake: (medicationId: string, input: { scheduledAt: string; status: IntakeStatus; takenAt?: string }) =>
    api.post<unknown>(`/me/medications/${id(medicationId)}/intakes`, input),
  exercises: () => api.get<{ data: AssignedExercise[] }>("/me/exercises"),
  exerciseCatalog: () => api.get<{ data: Exercise[] }>("/me/exercises/catalog"),
  completionsToday: () => api.get<{ data: { id: string; exerciseId: string; assignmentId: string | null; completedAt: string }[] }>("/me/exercises/completions/today"),
  completeExercise: (input: { exerciseId: string; assignmentId?: string; durationSeconds?: number }) =>
    api.post<{ id: string; completedAt: string }>("/me/exercises/completions", input),
  messages: (assignmentId: string) => api.get<unknown>("/me/messages", { assignmentId }),
  sendMessage: (input: { assignmentId: string; content: string; isUrgent?: boolean }) => api.post<unknown>("/me/messages", input),
};

export const reportsApi = {
  list: (limit = 12) => api.get<{ data: ReportListItem[]; meta: { firstWeek: string; currentWeek: string; count: number } }>("/me/reports", { limit }),
  get: (weekStart: LocalDay) => api.get<{ data: ReportDetail }>(`/me/reports/${id(weekStart)}`),
};

export const clinicalApi = {
  consents: () => api.get<{ data: Consent[] }>("/me/consents"),
  consent: (assignmentId: string) => api.get<Consent>(`/me/consents/${id(assignmentId)}`),
  updateConsent: (assignmentId: string, input: ConsentInput) => api.patch<unknown>(`/me/consents/${id(assignmentId)}`, input),
  /** Confirm what is shared (optionally changing it in the same call). The API logs the before and after. */
  reconfirm: (assignmentId: string, input: ConsentInput = {}) => api.post<unknown>(`/me/consents/${id(assignmentId)}/reconfirm`, input),
  latestWeeklyReport: () => api.get<unknown>("/me/weekly-reports/latest"),
  weeklyNote: (note: string) => api.patch<unknown>("/me/weekly-note", { note }),
  sessionPreNote: (sessionId: string, note: string) => api.patch<unknown>(`/me/sessions/${id(sessionId)}/pre-note`, { note }),
};

/** Smart Library: the patient is the token's own; the library comes from their account, never from the request. */
export const libraryApi = {
  /** Already-recommended articles; read-only, safe on every page load. */
  current: () => api.get<LibraryCurrent>("/me/library/recommendations/current"),
  /** Ask for new articles. Each one served goes on a 14-day cooldown, so call it on need, not on every load. */
  recommend: (input: { limit?: number; contextTags?: Record<string, number> } = {}) =>
    api.post<LibraryRecommendation>("/me/library/recommendations", input),
  /** Idempotent on `eventId`. */
  sendEvent: (input: { eventId: string; contentId: string; type: LibraryEventType }) =>
    api.post<{ accepted: boolean; reason?: string }>("/me/library/events", input),
};

/** The patient's own local date and hour: the backend has no stored timezone, so it plans the day the patient is in. */
function sparkClock() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return { date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`, hour: now.getHours() };
}

/** Spark, the ADHD task assistant (`/me/spark`). Every call answers with the whole updated view. 403 SPARK_ADHD_ONLY for other tracks. */
export const sparkApi = {
  view: () => {
    const { date, hour } = sparkClock();
    return api.get<SparkView>(`/me/spark?date=${date}&hour=${hour}`);
  },
  /** Free text in, tasks out. The engine can take a moment: it gets the agent timeout. */
  add: (text: string) => api.post<SparkView>("/me/spark/tasks", { text, ...sparkClock() }, { timeoutMs: AGENT_TIMEOUT_MS }),
  setStatus: (id: string, status: "TODO" | "DONE") => api.patch<SparkView>(`/me/spark/tasks/${id}`, { status, ...sparkClock() }),
  defer: (id: string) => api.post<SparkView>(`/me/spark/tasks/${id}/defer`, sparkClock()),
  setStep: (id: string, index: number, done: boolean) => api.patch<SparkView>(`/me/spark/tasks/${id}/steps/${index}`, { done, ...sparkClock() }),
  remove: (id: string) => {
    const { date, hour } = sparkClock();
    return api.delete<SparkView>(`/me/spark/tasks/${id}?date=${date}&hour=${hour}`);
  },
  focus: (minutes: number, taskId?: string) => api.post<SparkView>("/me/spark/focus", { minutes, taskId, ...sparkClock() }),
};
