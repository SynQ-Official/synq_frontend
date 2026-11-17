"use client";

/**
 * Device-side reminder state. The check-in time and reminders themselves are saved on the server
 * (`checkinsApi.schedule`) and sent by it; what stays here is per device: whether this browser may show
 * system notifications, the notification read state, and the time picked before reminders moved to the
 * server (only used as the first setup's default).
 */
import { patientKey } from "@/lib/api/tokens";

export type ReminderPrefs = { enabled: boolean; time: string; browser: boolean };

const PREFS_KEY = "vitamind_reminder_prefs";
const READ_KEY = "vitamind_notifications_read";
const CHANGE_EVENT = "vitamind-reminders-change";

export const DEFAULT_REMINDER: ReminderPrefs = { enabled: true, time: "20:00", browser: false };

// Both keys are stored per patient (`key:<userId>`): a shared device never hands one patient's reminder time or
// read notifications to the next, yet they are harmless preferences, so they stay with their owner across sign-outs.
function read(base: string): string | null {
  try {
    const key = patientKey(base);
    return key ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function write(base: string, value: string) {
  try {
    const key = patientKey(base);
    if (key) window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — the preference just won't persist */
  }
}

/** Raw snapshot (a stable string) for useSyncExternalStore. */
export function readReminderSnapshot(): string {
  return read(PREFS_KEY) ?? "";
}

export function parseReminderPrefs(raw: string): ReminderPrefs {
  if (!raw) return DEFAULT_REMINDER;
  try {
    const parsed = JSON.parse(raw) as Partial<ReminderPrefs>;
    return {
      enabled: parsed.enabled ?? DEFAULT_REMINDER.enabled,
      time: /^\d{2}:\d{2}$/.test(parsed.time ?? "") ? (parsed.time as string) : DEFAULT_REMINDER.time,
      browser: parsed.browser ?? DEFAULT_REMINDER.browser,
    };
  } catch {
    return DEFAULT_REMINDER;
  }
}

export function saveReminderPrefs(prefs: ReminderPrefs) {
  write(PREFS_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeReminders(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Raw snapshot of the read ids (a stable string) for useSyncExternalStore. */
export function readNotificationSnapshot(): string {
  return read(READ_KEY) ?? "";
}

export function readNotificationIds(): Set<string> {
  try {
    return new Set(JSON.parse(read(READ_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

export function saveNotificationIds(ids: Set<string>) {
  // Only the most recent ids matter; keep the list from growing forever.
  write(READ_KEY, JSON.stringify([...ids].slice(-60)));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
