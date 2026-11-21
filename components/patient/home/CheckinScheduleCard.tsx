"use client";

import { useState } from "react";
import { AlarmClock, BellOff, CheckCircle2, Globe2 } from "lucide-react";
import { GlassCard } from "@/components/patient/ui/primitives";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { saveCheckinSchedule, useCheckinSchedule } from "@/hooks/patient/useCheckin";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import type { CheckinSchedule } from "@/lib/api/patient";
import { fill } from "@/lib/i18n/patient";
import { parseReminderPrefs, readReminderSnapshot } from "@/lib/patient/reminders";
import { cn } from "@/lib/utils";

/** The device's IANA zone ("Africa/Tunis"); the server computes every reminder in it. */
export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Time, reminders and email for the daily check-in, saved on the server (one schedule per patient).
 * Used for the first setup on Home, for "Change" there, and in Settings.
 */
export function CheckinScheduleForm({
  schedule,
  onDone,
  onLater,
  showRemindersSwitch = false,
  secondary = false,
}: {
  schedule: CheckinSchedule | null;
  onDone?: () => void;
  onLater?: () => void;
  showRemindersSwitch?: boolean;
  /** On Home the save is a secondary action (the welcome holds the page's one primary). */
  secondary?: boolean;
}) {
  const t = usePatientCopy().checkinSchedule;
  const zone = deviceTimeZone();
  // A first setup starts from the time the patient may already have picked on this device, when reminders lived there.
  const [time, setTime] = useState(() => schedule?.time ?? parseReminderPrefs(typeof window === "undefined" ? "" : readReminderSnapshot()).time);
  const [remindersEnabled, setRemindersEnabled] = useState(schedule?.remindersEnabled ?? true);
  const [emailReminders, setEmailReminders] = useState(schedule?.emailReminders ?? false);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{2}:\d{2}$/.test(time)) return;
    setState("saving");
    try {
      await saveCheckinSchedule({ time, timezone: zone, remindersEnabled, emailReminders });
      setState("saved");
      onDone?.();
    } catch {
      setState("error");
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">{t.time}</span>
          <input
            type="time"
            required
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="field-soft min-h-11 px-3 text-base tabular-nums"
            dir="ltr"
          />
        </label>
        {showRemindersSwitch && (
          <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-ink">
            <Switch checked={remindersEnabled} onCheckedChange={setRemindersEnabled} />
            {t.reminders}
          </label>
        )}
        <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-ink">
          <Switch checked={emailReminders} disabled={!remindersEnabled} onCheckedChange={setEmailReminders} />
          {t.email}
        </label>
      </div>

      <p className="max-w-2xl text-sm leading-6 text-ink-soft">{fill(t.how, { time })}</p>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-ink-muted">
        <Globe2 className="size-3.5 shrink-0" aria-hidden />
        <span>{fill(t.zone, { zone })}</span>
        {emailReminders && <span>{t.emailHint}</span>}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant={secondary ? "secondary" : "default"} disabled={state === "saving"}>{state === "saving" ? t.saving : t.save}</Button>
        {onLater && <Button type="button" variant="ghost" onClick={onLater}>{t.later}</Button>}
        <span role="status" className={cn("text-sm", state === "error" ? "text-rose-700" : "text-sage-700")}>
          {state === "saved" ? fill(t.saved, { time }) : state === "error" ? t.error : ""}
        </span>
      </div>
    </form>
  );
}

/**
 * Home: the first time, a short setup (the patient may postpone it; Home then keeps a calm way back to it);
 * afterwards one quiet line: the time, whether today is done, reminders on or off, and "Change".
 * Starting the check-in itself stays with the day's welcome above.
 */
export function CheckinScheduleCard() {
  const t = usePatientCopy().checkinSchedule;
  const { data: schedule, isLoading, error } = useCheckinSchedule();
  const [editing, setEditing] = useState(false);

  // Loading or failing: say nothing, rather than ask a patient who has already chosen.
  if (isLoading || error || schedule === undefined) return null;

  // No time yet: one quiet line that opens the setup, so Home's dashboard stays in the first screen.
  if (!schedule && !editing) {
    return (
      <GlassCard className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 lg:mb-6">
        <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold-50 text-gold-700"><AlarmClock className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.9375rem]  text-ink">{t.pendingTitle}</p>
          <p className="text-sm text-ink-soft">{t.pendingBody}</p>
        </div>
        <Button variant="outline" onClick={() => setEditing(true)}>{t.pendingCta}</Button>
      </GlassCard>
    );
  }

  if (!schedule || editing) {
    return (
      <GlassCard className="mb-5 p-5 sm:p-6 lg:mb-6" aria-labelledby="checkin-schedule-title">
        <h2 id="checkin-schedule-title" className="flex items-center gap-2 text-lg text-ink">
          <AlarmClock className="size-[1.125rem] text-teal-700" aria-hidden />
          {t.setupTitle}
        </h2>
        {!schedule && <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-soft">{t.setupBody}</p>}
        <div className="mt-4">
          <CheckinScheduleForm secondary schedule={schedule} onDone={() => setEditing(false)} onLater={() => setEditing(false)} />
        </div>
      </GlassCard>
    );
  }

  const zone = deviceTimeZone();
  const done = schedule.today.completed;
  return (
    <GlassCard className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 lg:mb-6">
      <span aria-hidden className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", done ? "bg-sage-50 text-sage-700" : "bg-teal-50 text-teal-700")}>
        {done ? <CheckCircle2 className="size-5" /> : <AlarmClock className="size-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-[0.9375rem]  text-ink">
          <span>{fill(t.statusTitle, { time: schedule.time })}</span>
          <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs ", done ? "bg-sage-50 text-sage-700" : "bg-gold-50 text-gold-700")}>
            {done ? t.statusDone : t.statusOpen}
          </span>
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-ink-soft">
          {!schedule.remindersEnabled && <BellOff className="size-3.5" aria-hidden />}
          {schedule.remindersEnabled ? t.remindersOn : t.remindersOff}
          {schedule.timezone !== zone && (
            <span className="text-gold-700">
              · {fill(t.zoneChanged, { zone })}{" "}
              <button
                type="button"
                className="min-h-9  underline underline-offset-2"
                onClick={() => void saveCheckinSchedule({ time: schedule.time, timezone: zone, remindersEnabled: schedule.remindersEnabled, emailReminders: schedule.emailReminders })}
              >
                {t.useZone}
              </button>
            </span>
          )}
        </p>
      </div>
      <Button variant="outline" onClick={() => setEditing(true)}>{t.change}</Button>
    </GlassCard>
  );
}
