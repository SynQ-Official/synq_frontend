"use client";

import { useState } from "react";
import { AlarmClock, BellOff, CheckCircle2, Globe2 } from "lucide-react";
import { LABEL } from "@/components/home/typography";
import { GlassCard } from "@/components/patient/ui/primitives";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { saveCheckinSchedule, useCheckinSchedule } from "@/hooks/patient/useCheckin";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import type { CheckinSchedule } from "@/lib/api/patient";
import { fill } from "@/lib/i18n/patient";
import { parseReminderPrefs, readReminderSnapshot } from "@/lib/patient/reminders";
import { cn } from "@/lib/utils";

const LATER_KEY = "vitamind_checkin_setup_later";

/** The device's IANA zone ("Africa/Tunis"); the server computes every reminder in it. */
export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function setupPostponed(): boolean {
  try {
    return window.sessionStorage.getItem(LATER_KEY) === "1";
  } catch {
    return false;
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
}: {
  schedule: CheckinSchedule | null;
  onDone?: () => void;
  onLater?: () => void;
  showRemindersSwitch?: boolean;
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
        <Button type="submit" disabled={state === "saving"}>{state === "saving" ? t.saving : t.save}</Button>
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
  const [later, setLater] = useState(() => typeof window !== "undefined" && setupPostponed());
  const [editing, setEditing] = useState(false);

  // Loading or failing: say nothing, rather than ask a patient who has already chosen.
  if (isLoading || error || schedule === undefined) return null;

  const postpone = () => {
    try {
      window.sessionStorage.setItem(LATER_KEY, "1");
    } catch {
      /* asked again on the next visit */
    }
    setLater(true);
  };

  if (!schedule && later && !editing) {
    return (
      <GlassCard className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
        <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold-50 text-gold-700"><AlarmClock className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.9375rem] font-semibold text-ink">{t.pendingTitle}</p>
          <p className="text-sm text-ink-soft">{t.pendingBody}</p>
        </div>
        <Button variant="outline" onClick={() => setEditing(true)}>{t.pendingCta}</Button>
      </GlassCard>
    );
  }

  if (!schedule || editing) {
    return (
      <GlassCard className="mb-6 p-5 sm:p-7" aria-labelledby="checkin-schedule-title">
        <p className={cn(LABEL, "flex items-center gap-2 text-teal-700")}>
          <AlarmClock className="size-4" aria-hidden />
          {t.setupEyebrow}
        </p>
        <h2 id="checkin-schedule-title" className="mt-2 text-xl font-semibold text-ink sm:text-2xl">{t.setupTitle}</h2>
        {!schedule && <p className="mt-2 max-w-2xl text-[0.9375rem] leading-7 text-ink-soft">{t.setupBody}</p>}
        <div className="mt-5">
          <CheckinScheduleForm schedule={schedule} onDone={() => setEditing(false)} onLater={schedule ? () => setEditing(false) : postpone} />
        </div>
      </GlassCard>
    );
  }

  const zone = deviceTimeZone();
  const done = schedule.today.completed;
  return (
    <GlassCard className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
      <span aria-hidden className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", done ? "bg-sage-50 text-sage-700" : "bg-teal-50 text-teal-700")}>
        {done ? <CheckCircle2 className="size-5" /> : <AlarmClock className="size-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-[0.9375rem] font-semibold text-ink">
          <span>{fill(t.statusTitle, { time: schedule.time })}</span>
          <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", done ? "bg-sage-50 text-sage-700" : "bg-gold-50 text-gold-700")}>
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
                className="min-h-9 font-semibold underline underline-offset-2"
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
