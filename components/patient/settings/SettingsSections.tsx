"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Bell, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { EmptyState, ErrorState, GlassCard, Skeleton } from "@/components/patient/ui/primitives";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { useConsents, useOrientationConsent } from "@/hooks/patient/useCare";
import { CheckinScheduleForm } from "@/components/patient/home/CheckinScheduleCard";
import { useCheckinSchedule } from "@/hooks/patient/useCheckin";
import { useReminderPrefs } from "@/hooks/patient/useNotifications";
import { usePatient } from "@/hooks/patient/usePatient";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { ApiError } from "@/lib/api/client";
import { profileApi, type JournalShareLevel } from "@/lib/api/patient";
import type { Consent } from "@/lib/api/patient-types";
import { fill } from "@/lib/i18n/patient";
import { formatDay } from "@/lib/patient/format";
import { saveReminderPrefs } from "@/lib/patient/reminders";
import { cn } from "@/lib/utils";
import { LogoSpinner } from "@/components/shared/LogoLoader";

function Section({ icon, title, body, children }: { icon: ReactNode; title: string; body?: string; children: ReactNode }) {
  return (
    <GlassCard as="section" aria-label={title}>
      <div className="mb-5 flex items-start gap-3.5">
        <span className="stat-tile size-10 shrink-0">{icon}</span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {body && <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{body}</p>}
        </div>
      </div>
      {children}
    </GlassCard>
  );
}

function Row({ id, label, hint, children }: { id?: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-ink">{label}</label>
        {hint && <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export function ProfileSection() {
  const copy = usePatientCopy();
  const p = copy.settings.profile;
  const { language } = useLanguage();
  const { profile, refreshProfile } = usePatient();
  const [nickname, setNickname] = useState(profile.nickname);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "taken" | "error">("idle");
  const dirty = nickname.trim() !== profile.nickname;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!dirty) return;
    setState("saving");
    try {
      await profileApi.update({ nickname: nickname.trim() });
      await refreshProfile();
      setState("saved");
    } catch (error) {
      setState(error instanceof ApiError && error.isConflict ? "taken" : "error");
    }
  }

  return (
    <Section icon={<UserRound className="size-[1.125rem]" aria-hidden />} title={p.title}>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label htmlFor="settings-nickname" className="mb-1.5 block text-sm font-medium text-ink">{p.nickname}</label>
          <Input id="settings-nickname" value={nickname} onChange={(event) => { setNickname(event.target.value); setState("idle"); }} minLength={2} maxLength={30} className="field-soft px-4" />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">{p.email}</p>
          <p className="field-soft flex items-center px-4 text-sm text-muted-foreground" dir="ltr">{profile.email}</p>
        </div>
        <Row label={p.language}>
          <LanguageSwitcher onChange={(next) => void profileApi.update({ language: next === "ar" ? "AR" : "EN" }).catch(() => undefined)} />
        </Row>
        <p className="text-xs text-muted-foreground">
          {copy.tracks[profile.track]} · {fill(p.memberSince, { date: formatDay(profile.memberSince, language, { month: "long", year: "numeric" }) })}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!dirty || state === "saving" || nickname.trim().length < 2}>
            {state === "saving" && <LogoSpinner size={18} />}
            {state === "saving" ? copy.common.saving : p.save}
          </Button>
          <span role="status" className={cn("text-sm", state === "saved" ? "text-sage-700" : "text-rose-700")}>
            {state === "saved" ? p.saved : state === "taken" ? p.taken : state === "error" ? p.error : ""}
          </span>
        </div>
      </form>
    </Section>
  );
}

export function ReminderSection() {
  const copy = usePatientCopy();
  const r = copy.settings.reminders;
  const prefs = useReminderPrefs();
  const schedule = useCheckinSchedule();
  const remindersOn = schedule.data?.remindersEnabled ?? false;
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() =>
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported",
  );

  async function toggleBrowser(on: boolean) {
    if (!on) return saveReminderPrefs({ ...prefs, browser: false });
    if (!("Notification" in window)) return setPermission("unsupported");
    const result = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      saveReminderPrefs({ ...prefs, browser: true });
      new Notification(r.testTitle, { body: r.testBody, icon: "/logo.png" });
    }
  }

  return (
    <Section icon={<Bell className="size-[1.125rem]" aria-hidden />} title={r.title} body={r.body}>
      <div id="checkin-reminders" className="divide-y divide-line">
        {/* Time, reminders and email live on the server (they reach the patient even with SynQ closed). */}
        <div className="py-4">
          {schedule.isLoading ? null : (
            <CheckinScheduleForm key={schedule.data?.updatedAt ?? "new"} schedule={schedule.data ?? null} showRemindersSwitch />
          )}
        </div>
        {/* Browser permission is per device, so this one choice stays on the device. */}
        <Row
          id="reminder-browser"
          label={r.browser}
          hint={permission === "denied" ? r.denied : permission === "unsupported" ? r.unsupported : r.browserBody}
        >
          <Switch
            id="reminder-browser"
            checked={prefs.browser && permission === "granted"}
            disabled={!remindersOn || permission === "denied" || permission === "unsupported"}
            onCheckedChange={(on) => void toggleBrowser(on)}
          />
        </Row>
      </div>
    </Section>
  );
}

const JOURNAL_LEVELS: JournalShareLevel[] = ["NONE", "FLAGGED_EXCERPTS", "FULL"];

function ConsentCard({ consent }: { consent: Consent }) {
  const copy = usePatientCopy();
  const s = copy.settings.privacy;
  const { update, reconfirm } = useConsents();
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [failed, setFailed] = useState(false);
  const pending = consent.status === "PENDING";
  const name = `${consent.clinician.firstName} ${consent.clinician.lastName}`.trim();

  async function apply(input: Parameters<typeof update>[1]) {
    setBusy(true);
    setFailed(false);
    try {
      await update(consent.assignmentId, input);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const toggles: { key: keyof typeof s.categories; field: "shareMoodData" | "shareSleepData" | "shareMedication" | "shareExercises" | "shareDiagnostics"; value: boolean }[] = [
    { key: "mood", field: "shareMoodData", value: consent.categories.mood },
    { key: "sleep", field: "shareSleepData", value: consent.categories.sleep },
    { key: "medication", field: "shareMedication", value: consent.categories.medication },
    { key: "exercises", field: "shareExercises", value: consent.categories.exercises },
    { key: "diagnostics", field: "shareDiagnostics", value: consent.categories.diagnostics },
  ];

  return (
    <li className="rounded-2xl border border-white/80 bg-white/65 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink" dir="auto">{name}</p>
          <p className="text-xs text-muted-foreground" dir="auto">{[consent.clinician.role, consent.monitoring.clinicName].filter(Boolean).join(" · ")}</p>
        </div>
        {pending && <span className="chip chip-pending">{s.pending}</span>}
      </div>

      {pending ? (
        <Button className="mt-3" size="sm" disabled={busy} onClick={() => void apply({ safetyAlertsConsent: true, monitoringNoticeAccepted: true })}>{s.accept}</Button>
      ) : (
        <div className="mt-2 divide-y divide-line">
          {toggles.map((toggle) => (
            <Row key={toggle.key} id={`${consent.assignmentId}-${toggle.key}`} label={s.categories[toggle.key]}>
              <Switch id={`${consent.assignmentId}-${toggle.key}`} checked={toggle.value} disabled={busy} onCheckedChange={(checked) => void apply({ [toggle.field]: checked })} />
            </Row>
          ))}
          <div className="py-3">
            <p className="mb-2 text-sm font-medium text-ink">{s.journal}</p>
            <div role="radiogroup" aria-label={s.journal} className="flex flex-wrap gap-2">
              {JOURNAL_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  role="radio"
                  aria-checked={consent.categories.journal === level}
                  disabled={busy}
                  onClick={() => void apply({ journalShare: level })}
                  className={cn("rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors", consent.categories.journal === level ? "border-transparent bg-teal-600 text-white" : "border-line-strong bg-white/70 text-ink-soft hover:bg-white")}
                >
                  {s.journalOptions[level]}
                </button>
              ))}
            </div>
          </div>
          <Row id={`${consent.assignmentId}-alerts`} label={s.alerts} hint={s.alertsBody}>
            <Switch id={`${consent.assignmentId}-alerts`} checked={Boolean(consent.safetyAlertsConsentAt)} disabled={busy} onCheckedChange={(checked) => void apply({ safetyAlertsConsent: checked })} />
          </Row>
        </div>
      )}
      {consent.reconfirm?.pending && !confirmed && (
        <div className="mt-3 rounded-xl bg-teal-50/70 p-3">
          <p className="text-sm font-medium text-ink">{s.reconfirm.bannerTitle}</p>
          <p className="mt-0.5 text-xs text-ink-soft">{s.reconfirm.bannerBody}</p>
          <Button
            className="mt-2"
            size="sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setFailed(false);
              try {
                await reconfirm(consent.assignmentId);
                setConfirmed(true);
              } catch {
                setFailed(true);
              } finally {
                setBusy(false);
              }
            }}
          >
            {s.reconfirm.confirm}
          </Button>
        </div>
      )}
      {confirmed && <p role="status" className="mt-2 text-xs text-teal-700">{s.reconfirm.confirmed}</p>}
      {failed && <p role="alert" className="mt-2 text-xs text-rose-700">{s.saveError}</p>}
    </li>
  );
}

/** The consent to the orientation: visible, withdrawable, and never a way to redo a finished orientation. */
function OrientationConsentCard() {
  const { language } = useLanguage();
  const copy = usePatientCopy();
  const s = copy.settings.orientationConsent;
  const { profile } = usePatient();
  const consent = useOrientationConsent();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const done = Boolean(profile.orientationCompleted);
  const granted = consent.data?.granted === true;

  async function change(next: boolean) {
    setBusy(true);
    setFailed(false);
    try {
      await consent.set(next);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-white/80 bg-white/65 p-4">
      <p className="text-sm font-semibold text-ink">{s.title}</p>
      <p className="mt-0.5 text-xs text-ink-soft">{s.body}</p>
      {!consent.data ? (
        <Skeleton className="mt-3 h-9" />
      ) : (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-ink">{granted ? s.granted : s.withdrawn}{granted && consent.data.grantedAt ? ` · ${fill(s.since, { date: formatDay(consent.data.grantedAt, language) })}` : ""}</span>
          <Button size="sm" variant={granted ? "outline" : "default"} disabled={busy} onClick={() => void change(!granted)}>{granted ? s.withdraw : s.accept}</Button>
        </div>
      )}
      {consent.data && !granted && !done && <p className="mt-2 text-xs text-ink-soft">{s.pendingNote}</p>}
      {done && <p className="mt-2 text-xs text-ink-soft">{s.doneNote}</p>}
      {failed && <p role="alert" className="mt-2 text-xs text-rose-700">{s.error}</p>}
    </div>
  );
}

export function PrivacySection() {
  const copy = usePatientCopy();
  const s = copy.settings.privacy;
  const consents = useConsents();
  return (
    <Section icon={<ShieldCheck className="size-[1.125rem]" aria-hidden />} title={s.title} body={s.body}>
      {consents.error && !consents.data ? (
        <ErrorState onRetry={() => void consents.refresh()} />
      ) : !consents.data ? (
        <Skeleton className="h-32" />
      ) : consents.data.length === 0 ? (
        <EmptyState title={s.empty} />
      ) : (
        <ul className="space-y-3">{consents.data.map((consent) => <ConsentCard key={consent.assignmentId} consent={consent} />)}</ul>
      )}
      <OrientationConsentCard />
    </Section>
  );
}

export function SessionSection() {
  const copy = usePatientCopy();
  const { signOut } = usePatient();
  const [busy, setBusy] = useState(false);
  return (
    <Section icon={<LogOut className="size-[1.125rem] rtl:-scale-x-100" aria-hidden />} title={copy.settings.session.title}>
      <Button variant="outline" disabled={busy} onClick={() => { setBusy(true); void signOut(); }}>
        {busy && <LogoSpinner size={18} />}{copy.settings.session.signOut}
      </Button>
    </Section>
  );
}
