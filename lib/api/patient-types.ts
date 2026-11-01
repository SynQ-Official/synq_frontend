/** Response shapes of `/api/v1/me/*` (vitamind_backend/apps/api/src/modules/patient). */

export type PatientTrack = "ADHD" | "BIPOLAR" | "SCHIZOPHRENIA" | "UNSPECIFIED";
export type Trend = "UP" | "DOWN" | "STEADY" | "UNKNOWN";
export type Confidence = "INSUFFICIENT" | "EMERGING" | "ESTABLISHED";

export type Profile = {
  id: string;
  nickname: string;
  email: string;
  language: "EN" | "AR";
  track: PatientTrack;
  /** Mira's orientation is finished. A patient with neither this nor a clinician's diagnosis cannot enter the dashboard. */
  orientationCompleted?: boolean;
  hasCompletedOnboarding: boolean;
  memberSince: string;
  careTeam: { hasClinician: boolean; count: number };
};

export type GoalStatus = "PENDING" | "COMPLETED" | "PARTIAL" | "MISSED";
export type CheckinGoal = { id: string; title: string; status: GoalStatus; position: number };

/** A daily check-in: mood, energy and focus on a 1–5 scale, sleep in hours, up to three goals. */
export type Checkin = {
  id: string;
  /** The local day, YYYY-MM-DD (may arrive as a full timestamp). */
  date: string;
  mood: number;
  energy: number;
  focus: number;
  sleepHours: number;
  goals: CheckinGoal[];
  createdAt: string;
  updatedAt: string;
};

export type SafetyLevel = "NORMAL" | "ELEVATED" | "CRISIS";
/** The Journal engine's closed label sets (ai-engine/configs/taxonomy_v1.yaml). */
export type Sentiment = "positive" | "neutral" | "negative";
export type JournalEmotionLabel = "joy" | "sadness" | "anxiety" | "stress" | "anger" | "frustration" | "overwhelm" | "calm" | "fear" | "loneliness" | "motivation" | "fatigue";
export type JournalThemeLabel = "work" | "study" | "family" | "relationships" | "sleep" | "social" | "finance" | "routine" | "health" | "goals";
export type JournalSignalLabel = "low_energy" | "high_energy" | "low_focus" | "high_stress" | "low_motivation" | "sleep_change" | "social_withdrawal" | "rumination" | "goal_difficulty" | "stable_focus";
export type JournalTemporal = "current" | "past" | "future";

/** What the Journal engine found, as everyday labels. Model internals and raw scores never reach the patient. */
export type JournalAnalysisSummary = {
  /** False once the entry was edited after this reading. */
  current: boolean;
  sentiment: Sentiment | null;
  temporal: JournalTemporal | null;
  emotions: JournalEmotionLabel[];
  themes: JournalThemeLabel[];
  signals: JournalSignalLabel[];
  /** The entry sounded like a hard moment: the client answers with support, never a category name. */
  heavy: boolean;
  safetyLevel: SafetyLevel;
  analyzedAt: string;
} | null;

export type JournalEntry = {
  id: string;
  title: string | null;
  content: string;
  entryType: "DAILY" | "EMOTIONAL" | "THERAPY" | "GRATITUDE" | "CRISIS";
  moodScore: number | null;
  goalScore: number | null;
  emotions: string[];
  tags: string[];
  isPrivate: boolean;
  contentVersion: number;
  analysisStatus: "PENDING" | "COMPLETED" | "FAILED" | "SKIPPED";
  createdAt: string;
  updatedAt: string;
  analysis: JournalAnalysisSummary;
  excerpts?: { id: string; content: string; sharedAt: string }[];
  support?: { level: SafetyLevel; emergencyResources?: string[] };
};

export type Paginated<T> = { data: T[]; meta: { page: number; limit: number; total: number; totalPages: number } };

export type SeriesPoint = { date: string; value: number };
export type InsightSignal = "MOOD_UP" | "MOOD_DOWN" | "GOALS_UP" | "GOALS_DOWN" | "STREAK" | "CONSISTENT" | "SPARSE";

export type JournalInsights = {
  range: { from: string; to: string; days: number };
  confidence: Confidence;
  totals: { entries: number; activeDays: number; currentStreak: number; longestStreak: number; consistency: number };
  mood: { average: number | null; trend: Trend; delta: number | null; series: SeriesPoint[] };
  goals: { average: number | null; trend: Trend; delta: number | null; series: SeriesPoint[] };
  emotions: { emotion: string; count: number; share: number }[];
  /** Themes the Journal engine found (work, sleep, family…), most frequent first. */
  themes: { theme: string; count: number }[];
  /** Everyday signals (low_energy, rumination…). */
  journalSignals: { signal: string; count: number }[];
  hardMoments: number;
  weekly: { weekStart: string; entries: number; moodAverage: number | null; goalAverage: number | null }[];
  recent: {
    last7: { entries: number; moodAverage: number | null; goalAverage: number | null };
    previous7: { entries: number; moodAverage: number | null; goalAverage: number | null };
  };
  calendar: { date: string; entries: number; mood: number | null }[];
  signals: InsightSignal[];
  isPartial: boolean;
};

export type Exercise = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: "BREATHING" | "GROUNDING" | "SLEEP" | "RELAXATION" | "ACTIVITY" | "OTHER";
  durationMinutes: number | null;
  content: unknown;
};
export type AssignedExercise = {
  id: string;
  frequency: string | null;
  note: string | null;
  startsAt: string | null;
  endsAt: string | null;
  exercise: Exercise;
  completionCount: number;
  lastCompletedAt: string | null;
};

export type ReportInsightCode =
  | "LOW_DATA" | "MOOD_UP" | "MOOD_DOWN" | "MOOD_STEADY" | "SLEEP_LOW" | "SLEEP_GOOD"
  | "CONSISTENT" | "BUILD_HABIT" | "GOALS_STRONG" | "GOALS_LOW" | "EXERCISES_DONE"
  | "MEDICATION_STEADY" | "MEDICATION_MISSED"
  | "FOCUS_LOW" | "SLEEP_IRREGULAR" | "SLEEP_LONG" | "ENERGY_HIGH_LITTLE_SLEEP";
export type ReportInsight = { code: ReportInsightCode; tone: "positive" | "neutral" | "attention"; value: number | null };

export type ReportListItem = {
  weekStart: string;
  weekEnd: string;
  status: "READY" | "IN_PROGRESS";
  hasEnoughData: boolean;
  checkinDays: number;
  journalEntries: number;
  moodAverage: number | null;
  moodDelta: number | null;
  consistency: number;
  moodSeries: (number | null)[];
  highlights: ReportInsight[];
  clinicianReleased: boolean;
};

export type ReportDetail = {
  weekStart: string;
  weekEnd: string;
  status: "READY" | "IN_PROGRESS";
  checkinDays: number;
  journalEntries: number;
  journalDays: number;
  activeDays: number;
  consistency: number;
  averages: { mood: number | null; energy: number | null; sleepHours: number | null; focus: number | null };
  journal: { moodAverage: number | null; goalAverage: number | null };
  moodDelta: number | null;
  days: { date: string; mood: number | null; sleepHours: number | null; checkedIn: boolean; journaled: boolean }[];
  bestDay: { date: string; mood: number } | null;
  hardestDay: { date: string; mood: number } | null;
  topEmotions: { emotion: string; count: number }[];
  exercisesCompleted: number;
  medication: { taken: number; missed: number; skipped: number; adherence: number | null };
  insights: ReportInsight[];
  hasEnoughData: boolean;
  clinician: { id: string; headline: string | null; content: unknown; note: string | null; patientNote: string | null; releasedAt: string } | null;
};

export type Consent = {
  assignmentId: string;
  status: "PENDING" | "ACTIVE" | string;
  assignedAt: string;
  consentedAt: string | null;
  clinician: { firstName: string; lastName: string; role: string };
  monitoring: { clinicName: string | null; emergencyNumber: string | null };
  categories: { diagnostics: boolean; mood: boolean; sleep: boolean; medication: boolean; exercises: boolean; journal: "NONE" | "FLAGGED_EXCERPTS" | "FULL" };
  safetyAlertsConsentAt: string | null;
  monitoringNoticeAckAt: string | null;
  /** Relationships created while sharing was pre-ticked: confirm what is shared (`required` once the 30 days have passed). */
  reconfirm?: { pending: boolean; required: boolean; dueAt: string | null };
};

/** The consent to orientation and follow-up on file (`/me/orientation-consent`). */
export type OrientationConsent = { granted: boolean; version: string | null; grantedAt: string | null; currentVersion: string; upToDate: boolean };


// ---- Check-in reports (`/me/checkins/reports/weekly|monthly`), built by the longitudinal service

export type DailyMetricKey = "mood" | "energy" | "focus" | "sleep";

export type DailyMetricBlock = {
  n: number;
  mean: number | null;
  min: number | null;
  max: number | null;
  baseline: { mean: number; n: number } | null;
  delta_vs_baseline: number | null;
  trend: { status: string; against: "previous_week" | "rest_of_month"; change?: number };
  lower_days: number;
  lower_day_dates: string[];
  sustained: { start: string; end: string; length: number } | null;
  /** Mood and energy only: days at 4-5 and the longest consecutive run of them. */
  higher_days?: number;
  sustained_high?: { start: string; end: string; length: number } | null;
};

export type DailyReport = {
  schema_version: string;
  report_type: "weekly" | "monthly";
  period: { start: string; end: string; days: number };
  availability: { checkins: number; days: number; rate: number };
  /** `insufficient_data` when there are too few records for a summary. */
  status: "ok" | "insufficient_data";
  goals: { created: number; completed: number; partial: number; missed: number; resolved: number; completion_rate: number | null };
  metrics: Record<DailyMetricKey, DailyMetricBlock>;
  /** Consecutive days of sleep under 5 h with energy at 4-5, when there were at least two. */
  elevated_short_sleep?: { start: string; end: string; length: number } | null;
  data_limitations: string[];
  /** Plain-language summary that already passed the safety validator. */
  text: string;
};

/** An article of the Smart Library, as the backend serves it to the signed-in patient. */
export type LibraryContent = {
  id: string;
  title: string;
  titleAr: string | null;
  /** Null until an editor writes one. */
  summary: string | null;
  /** The real public source; null when none was provided (the card then does not link). */
  url: string | null;
  sourceOrg: string | null;
  sourceLabel: string | null;
  /** Null when not measured. */
  readingTimeMinutes: number | null;
};

/** What in the patient's own check-ins or journal made an article relevant now. Shown as a gentle line, never a diagnosis. */
export type LibraryBecause = "HIGH_STRESS" | "SLEEP" | "GOAL_DIFFICULTY" | "LOW_MOOD" | "LOW_ENERGY" | "LOW_MOTIVATION" | "HIGH_ENERGY" | "SOCIAL_WITHDRAWAL" | "LOW_FOCUS" | "WORK_STUDY" | "RELATIONSHIPS" | "ROUTINE" | "HEALTH" | "IMPROVING";

/** Why the library has nothing to recommend. Anything else (a track without a library) reads as `NO_RELEVANT_CONTENT`. */
export type LibraryEmptyReason = "NO_JOURNAL_ENTRIES" | "LIMITED_JOURNAL" | "NO_JOURNAL_PATTERN" | "SUPPORT_HOLD" | "NO_RELEVANT_CONTENT";

export type LibraryItem = { recommendationId: string; content: LibraryContent; reasons: string[]; because?: LibraryBecause[] };

/** `GET /me/library/recommendations/current` */
export type LibraryCurrent = {
  mode: string;
  items: LibraryItem[];
  reason?: string;
  /** The Journal points to a theme with an article not recommended yet: ask for new articles. */
  refresh?: boolean;
};

/** `POST /me/library/recommendations`: `NO_RECOMMENDATION` carries a reason code and no items. */
export type LibraryRecommendation =
  | { mode: string; type: "RECOMMENDATION"; items: LibraryItem[] }
  | { mode: string; type: "NO_RECOMMENDATION"; reason: string };

export type LibraryEventType = "OPENED" | "SAVED" | "USEFUL" | "SOMEWHAT_USEFUL" | "DISMISSED" | "NOT_USEFUL";

// ── Spark (ADHD task assistant) ───────────────────────────────────────────────

export type SparkBucket = "now" | "today" | "later";
export type SparkStep = { text: string; done: boolean };
export type SparkTask = {
  id: string;
  title: string;
  category: string;
  estimateMin: number;
  bucket: SparkBucket;
  position: number;
  /** Why it sits where it does, as a code (always there) and as the engine's sentence in the patient's language (when planned just now). */
  reasonCode: string;
  reason: string | null;
  steps: SparkStep[];
  rounds: number;
  aversive: boolean;
  deferCount: number;
};
export type SparkView = {
  /** The engine could not be reached: the last saved order is shown. */
  degraded: boolean;
  headline: string | null;
  notes: string[];
  capacity: { mode: "gentle" | "steady" | "strong"; confidence: "low" | "medium" | "high"; sprintMin: number; breakMin: number; dailyBudgetMin: number; maxToday: number; peakHours: number[] } | null;
  safety: { needsSupport: boolean; message: string | null; emergencyResources: string[] } | null;
  tasks: SparkTask[];
  doneToday: { id: string; title: string; completedAt: string }[];
  stats: { openToday: number; doneToday: number; focusRoundsToday: number; focusMinutesToday: number };
  /** How many tasks the last piece of text became. */
  added: number;
};

/** Comfort sounds (`/me/ambiences`): the sounds this patient may see, with their settings. */
export type AmbienceCategory = "NOISE" | "LOFI" | "SOFT_MUSIC" | "NATURE";

export type AmbienceSound = {
  id: string;
  category: AmbienceCategory;
  label: { en: string; ar: string };
  /** Path in the media bucket without extension; the player adds ".opus" / ".m4a". */
  url: string;
  licence: string;
  author: string;
  source: string;
  isDefault: boolean;
};

export type AmbiencePreferences = {
  enabled: boolean;
  /** Always one of `sounds` (the default when the patient has not chosen), or null when there is none. */
  favoriteSoundId: string | null;
  /** Percent, 0 to 70. */
  volume: number;
  /** Regular bedtime "HH:MM" in `timezone`. */
  eveningTime: string | null;
  timezone: string | null;
};

export type Ambiences = {
  track: PatientTrack;
  /** False when there is nothing to offer: no track, or the psychosis track before the clinician has switched it on. */
  available: boolean;
  preferences: AmbiencePreferences;
  sounds: AmbienceSound[];
  /** For the help button, always one tap away while a sound plays. */
  emergencyResources: string[];
};

export type AmbiencePreferencesInput = {
  enabled?: boolean;
  favoriteSoundId?: string | null;
  volume?: number;
  /** null clears the bedtime and its time zone. */
  eveningTime?: string | null;
  timezone?: string;
};
