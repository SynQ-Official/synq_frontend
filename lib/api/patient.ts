import { AGENT_TIMEOUT_MS, api, sendOnClose } from "./client";
import { profileSchema } from "./schemas";
import type {
  AmbienceAnswer,
  AmbiencePreferencesInput,
  AmbienceSessionInput,
  AmbienceSessionResult,
  Ambiences,
  AssignedExercise,
  Checkin,
  CheckinGoal,
  Consent,
  DailyReport,
  Exercise,
  GoalStatus,
  IntakeStatus,
  JournalEntry,
  JournalInsights,
  LibraryCurrent,
  LibraryEventType,
  LibraryRecommendation,
  Medication,
  MedicationIntake,
  MessagingNotice,
  Paginated,
  Profile,
  ReportDetail,
  ReportListItem,
  SecureMessage,
  OrientationConsent,
  OrientationStatus,
  SosResult,
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
  shareAmbiences?: boolean;
  journalShare?: JournalShareLevel;
  safetyAlertsConsent?: boolean;
  monitoringNoticeAccepted?: boolean;
};

const id = (value: string) => encodeURIComponent(value);

/** The profile gates the whole dashboard, so it is checked at runtime (`profileSchema`). */
const profile = { schema: profileSchema };

export const profileApi = {
  get: (signal?: AbortSignal): Promise<Profile> => api.get("/me", undefined, { ...profile, signal }),
  /** Where the patient stands with orientation: a clinician-assigned track skips Mira. The API decides, never the app. */
  orientation: (signal?: AbortSignal): Promise<{ data: OrientationStatus }> => api.get<{ data: OrientationStatus }>("/me/orientation", undefined, { signal }),
  /** Only these three fields exist on the API (anything else is a 400). `phoneNumber: null` removes the number. */
  update: (input: { nickname?: string; language?: "EN" | "AR"; phoneNumber?: string | null }): Promise<Profile> => api.patch("/me", input, profile),
  completeOnboarding: (): Promise<Profile> => api.post("/me/onboarding/complete", undefined, profile),
  /** The consent to orientation and follow-up on file. */
  orientationConsent: (signal?: AbortSignal): Promise<{ data: OrientationConsent }> =>
    api.get<{ data: OrientationConsent }>("/me/orientation-consent", undefined, { signal }),
  /** Accept the current consent text (with its version) or withdraw it. */
  setOrientationConsent: (granted: boolean, version?: string): Promise<{ data: OrientationConsent }> =>
    api.put<{ data: OrientationConsent }>("/me/orientation-consent", { granted, version }),
};

/**
 * The SOS button (`POST /me/sos`): alerts the care team (or their cover) and the SynQ team through the same crisis
 * pipeline the engines use. The API answers a repeat press with the alert that is already open, so retrying a call
 * that timed out is safe. Throttled to 5 per 10 minutes.
 */
export const sosApi = {
  raise: (): Promise<{ data: SosResult }> => api.post<{ data: SosResult }>("/me/sos", undefined, { timeoutMs: 20_000 }),
};

export type CheckinList = { data: Checkin[]; meta: { from: string; to: string; count: number } };

export const checkinsApi = {
  /** Today's check-in (or the day in `date`). The Check-in engine validates it before it is saved. */
  create: (input: CheckinInput): Promise<{ data: Checkin }> => api.post<{ data: Checkin }>("/me/checkins", input, { timeoutMs: AGENT_TIMEOUT_MS }),
  today: (date?: LocalDay, signal?: AbortSignal): Promise<{ data: Checkin | null }> =>
    api.get<{ data: Checkin | null }>("/me/checkins/today", { date }, { signal }),
  list: (range: DayRange = {}, signal?: AbortSignal): Promise<CheckinList> => api.get<CheckinList>("/me/checkins", range, { signal }),
  /** Resolve a goal during the day (or put it back to PENDING). */
  setGoal: (goalId: string, status: GoalStatus): Promise<{ data: CheckinGoal }> =>
    api.patch<{ data: CheckinGoal }>(`/me/checkins/goals/${id(goalId)}`, { status }),
  weeklyReport: (weekStart: LocalDay): Promise<{ data: DailyReport }> => api.get<{ data: DailyReport }>("/me/checkins/reports/weekly", { weekStart }),
  monthlyReport: (year: number, month: number, signal?: AbortSignal): Promise<{ data: DailyReport }> =>
    api.get<{ data: DailyReport }>("/me/checkins/reports/monthly", { year, month }, { signal }),
  /** The patient's check-in time and reminder choices (null until set), with today's status in their own zone. */
  schedule: (signal?: AbortSignal): Promise<{ data: CheckinSchedule | null }> =>
    api.get<{ data: CheckinSchedule | null }>("/me/checkins/schedule", undefined, { signal }),
  /** Set or change it: one schedule per patient; reminders are sent by the server. */
  setSchedule: (input: CheckinScheduleInput): Promise<{ data: CheckinSchedule }> => api.put<{ data: CheckinSchedule }>("/me/checkins/schedule", input),
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

export type JournalListQuery = DayRange & { page?: number; limit?: number };
export type SharedExcerpt = { id: string; content: string; sharedAt: string };

export const journalApi = {
  create: (input: JournalEntryInput): Promise<JournalEntry> => api.post<JournalEntry>("/me/journal", input, { timeoutMs: AGENT_TIMEOUT_MS }),
  /** One page, newest first, with `meta` { page, limit, total, totalPages } (limit 50 at most). */
  list: (query: JournalListQuery = {}, signal?: AbortSignal): Promise<Paginated<JournalEntry>> =>
    api.get<Paginated<JournalEntry>>("/me/journal", query, { signal }),
  insights: (days = 30, signal?: AbortSignal): Promise<{ data: JournalInsights }> =>
    api.get<{ data: JournalInsights }>("/me/journal/insights", { days }, { signal }),
  get: (entryId: string, signal?: AbortSignal): Promise<JournalEntry> => api.get<JournalEntry>(`/me/journal/${id(entryId)}`, undefined, { signal }),
  update: (entryId: string, input: Partial<JournalEntryInput>): Promise<JournalEntry> => api.patch<JournalEntry>(`/me/journal/${id(entryId)}`, input),
  analyze: (entryId: string): Promise<JournalEntry> =>
    api.post<JournalEntry>(`/me/journal/${id(entryId)}/analyze`, undefined, { timeoutMs: AGENT_TIMEOUT_MS }),
  remove: (entryId: string): Promise<{ success: boolean }> => api.delete<{ success: boolean }>(`/me/journal/${id(entryId)}`),
  /** The excerpt must be copied verbatim from the entry. */
  shareExcerpt: (entryId: string, excerpt: string): Promise<SharedExcerpt> => api.post<SharedExcerpt>(`/me/journal/${id(entryId)}/excerpts`, { excerpt }),
  unshareExcerpt: (excerptId: string): Promise<{ success: boolean }> => api.delete<{ success: boolean }>(`/me/journal/excerpts/${id(excerptId)}`),
};

export type ExerciseCompletionToday = { id: string; exerciseId: string; assignmentId: string | null; completedAt: string };

export const careApi = {
  exercises: (signal?: AbortSignal): Promise<{ data: AssignedExercise[] }> => api.get<{ data: AssignedExercise[] }>("/me/exercises", undefined, { signal }),
  exerciseCatalog: (signal?: AbortSignal): Promise<{ data: Exercise[] }> => api.get<{ data: Exercise[] }>("/me/exercises/catalog", undefined, { signal }),
  completionsToday: (signal?: AbortSignal): Promise<{ data: ExerciseCompletionToday[] }> =>
    api.get<{ data: ExerciseCompletionToday[] }>("/me/exercises/completions/today", undefined, { signal }),
  completeExercise: (input: { exerciseId: string; assignmentId?: string; durationSeconds?: number }): Promise<{ id: string; completedAt: string }> =>
    api.post<{ id: string; completedAt: string }>("/me/exercises/completions", input),
  /** Active prescriptions. Read only: the app never creates or changes one. */
  medications: (signal?: AbortSignal): Promise<{ data: Medication[] }> => api.get<{ data: Medication[] }>("/me/medications", undefined, { signal }),
  /** The dose log (90 days at most). */
  intakes: (range: DayRange = {}, signal?: AbortSignal): Promise<{ data: MedicationIntake[] }> =>
    api.get<{ data: MedicationIntake[] }>("/me/medications/intakes", range, { signal }),
  /** One log per dose (`scheduledAt`, up to a day ahead): the same dose again updates it. */
  logIntake: (medicationId: string, input: { scheduledAt: string; status: IntakeStatus; takenAt?: string }): Promise<MedicationIntake> =>
    api.post<MedicationIntake>(`/me/medications/${id(medicationId)}/intakes`, input),
  /** The thread with one clinician (an ACTIVE, consented relationship). Reading it marks the clinician's messages read. */
  messages: (assignmentId: string, signal?: AbortSignal): Promise<{ monitoringNotice: MessagingNotice; data: SecureMessage[] }> =>
    api.get<{ monitoringNotice: MessagingNotice; data: SecureMessage[] }>("/me/messages", { assignmentId }, { signal }),
  sendMessage: (input: { assignmentId: string; content: string }): Promise<{ monitoringNotice: MessagingNotice; data: SecureMessage }> =>
    api.post<{ monitoringNotice: MessagingNotice; data: SecureMessage }>("/me/messages", input),
};

export type ReportList = { data: ReportListItem[]; meta: { firstWeek: string; currentWeek: string; count: number } };

export const reportsApi = {
  list: (limit = 12, signal?: AbortSignal): Promise<ReportList> => api.get<ReportList>("/me/reports", { limit }, { signal }),
  get: (weekStart: LocalDay, signal?: AbortSignal): Promise<{ data: ReportDetail }> =>
    api.get<{ data: ReportDetail }>(`/me/reports/${id(weekStart)}`, undefined, { signal }),
};

export const clinicalApi = {
  consents: (signal?: AbortSignal): Promise<{ data: Consent[] }> => api.get<{ data: Consent[] }>("/me/consents", undefined, { signal }),
  /** The caller refetches `consents` afterwards, so the updated row in the answer is not needed. */
  updateConsent: (assignmentId: string, input: ConsentInput): Promise<void> =>
    api.patch(`/me/consents/${id(assignmentId)}`, input).then(() => undefined),
  /** Confirm what is shared (optionally changing it in the same call). The API logs the before and after. */
  reconfirm: (assignmentId: string, input: ConsentInput = {}): Promise<void> =>
    api.post(`/me/consents/${id(assignmentId)}/reconfirm`, input).then(() => undefined),
};

/** Smart Library: the patient is the token's own; the library comes from their account, never from the request. */
export const libraryApi = {
  /** Already-recommended articles; read-only, safe on every page load. */
  current: (): Promise<LibraryCurrent> => api.get<LibraryCurrent>("/me/library/recommendations/current"),
  /** Ask for new articles. Each one served goes on a 14-day cooldown, so call it on need, not on every load. */
  recommend: (input: { limit?: number } = {}): Promise<LibraryRecommendation> => api.post<LibraryRecommendation>("/me/library/recommendations", input),
  /** Idempotent on `eventId`. */
  sendEvent: (input: { eventId: string; contentId: string; type: LibraryEventType }): Promise<{ accepted: boolean; reason?: string }> =>
    api.post<{ accepted: boolean; reason?: string }>("/me/library/events", input),
};

/** The patient's own local date and hour: the backend has no stored timezone, so it plans the day the patient is in. */
function sparkClock(): { date: LocalDay; hour: number } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return { date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`, hour: now.getHours() };
}

/** Spark, the ADHD task assistant (`/me/spark`). Every call answers with the whole updated view. 403 SPARK_ADHD_ONLY for other tracks. */
export const sparkApi = {
  view: (signal?: AbortSignal): Promise<SparkView> => api.get<SparkView>("/me/spark", sparkClock(), { signal }),
  /** Free text in, tasks out. The engine can take a moment: it gets the agent timeout. */
  add: (text: string): Promise<SparkView> => api.post<SparkView>("/me/spark/tasks", { text, ...sparkClock() }, { timeoutMs: AGENT_TIMEOUT_MS }),
  setStatus: (taskId: string, status: "TODO" | "DONE"): Promise<SparkView> => api.patch<SparkView>(`/me/spark/tasks/${id(taskId)}`, { status, ...sparkClock() }),
  defer: (taskId: string): Promise<SparkView> => api.post<SparkView>(`/me/spark/tasks/${id(taskId)}/defer`, sparkClock()),
  setStep: (taskId: string, index: number, done: boolean): Promise<SparkView> =>
    api.patch<SparkView>(`/me/spark/tasks/${id(taskId)}/steps/${index}`, { done, ...sparkClock() }),
  remove: (taskId: string): Promise<SparkView> => api.delete<SparkView>(`/me/spark/tasks/${id(taskId)}`, { query: sparkClock() }),
  focus: (minutes: number, taskId?: string): Promise<SparkView> => api.post<SparkView>("/me/spark/focus", { minutes, taskId, ...sparkClock() }),
};

export const ambiencesApi = {
  /** The sounds this patient may see and their settings. Empty until the clinician switches it on, on the psychosis track. */
  get: (signal?: AbortSignal): Promise<{ data: Ambiences }> => api.get<{ data: Ambiences }>("/me/ambiences", undefined, { signal }),
  /** Only the fields sent change. Switching off is always accepted. */
  update: (input: AmbiencePreferencesInput): Promise<{ data: Ambiences }> => api.patch<{ data: Ambiences }>("/me/ambiences/preferences", input),
  /** Record a listening session when playback ends. Health data, own rows only; answers `canAnswer` for 5 minutes or more. */
  recordSession: (input: AmbienceSessionInput): Promise<{ data: AmbienceSessionResult }> =>
    api.post<{ data: AmbienceSessionResult }>("/me/ambiences/sessions", input),
  /** The same request, for the moment the page closes: fire and forget, and safe to repeat (the server keys on `input.id`). */
  recordSessionOnClose: (input: AmbienceSessionInput): void => sendOnClose("/me/ambiences/sessions", input),
  /** The optional answer after a session of 5 minutes or more. One per session. */
  answer: (sessionId: string, answer: AmbienceAnswer): Promise<{ data: { id: string } }> =>
    api.post<{ data: { id: string } }>("/me/ambiences/feedback", { sessionId, answer }),
};
