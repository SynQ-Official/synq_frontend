"use client";

import { useState, type ReactNode } from "react";
import { Bell, Download, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { EmptyState, ErrorState, GlassCard, Skeleton } from "@/components/patient/ui/primitives";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { VerifyToUseNotice } from "@/components/auth/EmailVerificationBanner";
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
import { accountApi, profileApi, type JournalShareLevel } from "@/lib/api/patient";
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
          <h2 className="text-base  text-ink">{title}</h2>
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

/** The API's own rule for a contact number (`PATCH /me` -> `phoneNumber`); an empty field removes it. */
const PHONE_PATTERN = /^\+?[0-9 ().-]{6,32}$/;

export function ProfileSection() {
  const copy = usePatientCopy();
  const p = copy.settings.profile;
  const { language } = useLanguage();
  const { profile, refreshProfile } = usePatient();
  const [nickname, setNickname] = useState(profile.nickname);
  const [phone, setPhone] = useState(profile.phoneNumber ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "taken" | "badPhone" | "error">("idle");
  const phoneValue = phone.trim();
  const nicknameDirty = nickname.trim() !== profile.nickname;
  const phoneDirty = phoneValue !== (profile.phoneNumber ?? "");
  const dirty = nicknameDirty || phoneDirty;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!dirty || state === "saving") return;
    if (phoneDirty && phoneValue && !PHONE_PATTERN.test(phoneValue)) return setState("badPhone");
    setState("saving");
    try {
      // Only what changed is sent: the API accepts these fields and nothing else.
      await profileApi.update({
        ...(nicknameDirty ? { nickname: nickname.trim() } : {}),
        ...(phoneDirty ? { phoneNumber: phoneValue || null } : {}),
      });
      await refreshProfile();
      setState("saved");
    } catch (error) {
      setState(error instanceof ApiError && error.isConflict ? "taken" : error instanceof ApiError && error.status === 400 && phoneDirty ? "badPhone" : "error");
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
          <label htmlFor="settings-phone" className="mb-1.5 block text-sm font-medium text-ink">{p.phone}</label>
          <Input
            id="settings-phone"
            type="tel"
            inputMode="tel"
            dir="ltr"
            autoComplete="tel"
            value={phone}
            onChange={(event) => { setPhone(event.target.value); setState("idle"); }}
            maxLength={32}
            aria-invalid={state === "badPhone"}
            aria-describedby="settings-phone-hint"
            className="field-soft px-4"
          />
          <p id="settings-phone-hint" className="mt-1 text-xs text-muted-foreground">{p.phoneHint}</p>
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
          {profile.trackAssignedByClinician ? ` · ${p.trackByTeam}` : ""}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!dirty || state === "saving" || nickname.trim().length < 2}>
            {state === "saving" && <LogoSpinner size={18} />}
            {state === "saving" ? copy.common.saving : p.save}
          </Button>
          <span role="status" className={cn("text-sm", state === "saved" ? "text-sage-700" : "text-rose-700")}>
            {state === "saved" ? p.saved : state === "taken" ? p.taken : state === "badPhone" ? p.phoneInvalid : state === "error" ? p.error : ""}
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

  const toggles: { key: keyof typeof s.categories; field: "shareMoodData" | "shareSleepData" | "shareMedication" | "shareExercises" | "shareAmbiences" | "shareDiagnostics"; value: boolean }[] = [
    { key: "mood", field: "shareMoodData", value: consent.categories.mood },
    { key: "sleep", field: "shareSleepData", value: consent.categories.sleep },
    { key: "medication", field: "shareMedication", value: consent.categories.medication },
    { key: "exercises", field: "shareExercises", value: consent.categories.exercises },
    { key: "ambiences", field: "shareAmbiences", value: consent.categories.ambiences },
    { key: "diagnostics", field: "shareDiagnostics", value: consent.categories.diagnostics },
  ];

  return (
    <li className="rounded-2xl border border-white/80 bg-white/65 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm  text-ink" dir="auto">{name}</p>
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
        </div>
      )}
      {consent.reconfirm?.pending && !confirmed && (
        <div className="mt-3 rounded-xl bg-teal-50/70 p-3">
          <p className="text-sm font-medium text-ink">{s.reconfirm.bannerTitle}</p>
          <p className="mt-0.5 text-xs text-ink-soft">{consent.reconfirm?.required ? s.reconfirm.pausedBody : s.reconfirm.bannerBody}</p>
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
  // The care team set the track: there is no orientation to pause, resume or wait for.
  const skipped = profile.trackAssignedByClinician === true;
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
      <p className="text-sm  text-ink">{s.title}</p>
      <p className="mt-0.5 text-xs text-ink-soft">{s.body}</p>
      {!consent.data ? (
        <Skeleton className="mt-3 h-9" />
      ) : (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-ink">{granted ? s.granted : s.withdrawn}{granted && consent.data.grantedAt ? ` · ${fill(s.since, { date: formatDay(consent.data.grantedAt, language) })}` : ""}</span>
          <Button size="sm" variant={granted ? "outline" : "default"} disabled={busy} onClick={() => void change(!granted)}>{granted ? s.withdraw : s.accept}</Button>
        </div>
      )}
      {consent.data && !granted && !done && !skipped && <p className="mt-2 text-xs text-ink-soft">{s.pendingNote}</p>}
      {skipped ? <p className="mt-2 text-xs text-ink-soft">{s.skippedNote}</p> : done && <p className="mt-2 text-xs text-ink-soft">{s.doneNote}</p>}
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

/**
 * Privacy: the patient's own export (a JSON file, 3 an hour) and the account closure. Closing ends the session through the
 * same sign-out as everywhere else. A wrong password is 400 INVALID_PASSWORD (a 401 would start a session refresh).
 */
export function DataSection() {
  const copy = usePatientCopy();
  const s = copy.settings.data;
  const { signOut } = usePatient();
  const [exporting, setExporting] = useState(false);
  const [exportState, setExportState] = useState<"idle" | "limited" | "error" | "unverified">("idle");
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteState, setDeleteState] = useState<"idle" | "wrongPassword" | "minor" | "limited" | "error">("idle");

  async function download() {
    setExporting(true);
    setExportState("idle");
    try {
      const blob = await accountApi.exportData();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "synq-export.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setExportState(error instanceof ApiError && error.code === "EMAIL_NOT_VERIFIED" ? "unverified" : error instanceof ApiError && error.status === 429 ? "limited" : "error");
    } finally {
      setExporting(false);
    }
  }

  async function remove(event: React.FormEvent) {
    event.preventDefault();
    if (!password || deleting) return;
    setDeleting(true);
    setDeleteState("idle");
    try {
      await accountApi.deleteAccount(password);
    } catch (error) {
      setPassword("");
      setDeleteState(
        error instanceof ApiError && error.code === "INVALID_PASSWORD" ? "wrongPassword"
          : error instanceof ApiError && error.code === "MINOR_ACCOUNT" ? "minor"
          : error instanceof ApiError && error.status === 429 ? "limited"
          : "error",
      );
      setDeleting(false);
      return;
    }
    // The account is closed on the server: leave the app whatever the logout answers (never re-enable the form).
    setPassword("");
    await signOut({ force: true });
  }

  const deleteMessage = deleteState === "wrongPassword" ? s.wrongPassword : deleteState === "minor" ? s.deleteMinor : deleteState === "limited" ? s.limited : s.deleteError;

  return (
    <Section icon={<Download className="size-[1.125rem]" aria-hidden />} title={s.title}>
      <div className="space-y-5">
        <div>
          <p className="text-sm text-ink">{s.exportTitle}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{s.exportBody}</p>
          <Button className="mt-3" variant="outline" disabled={exporting} onClick={() => void download()}>
            {exporting && <LogoSpinner size={18} />}
            {s.exportAction}
          </Button>
          {(exportState === "limited" || exportState === "error") && <p role="alert" className="mt-2 text-xs text-rose-700">{exportState === "limited" ? s.exportLimited : s.exportError}</p>}
          {exportState === "unverified" && <VerifyToUseNotice audience="patient" />}
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
          <p className="text-sm text-rose-800">{s.deleteTitle}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">{s.deleteBody}</p>
          {!open ? (
            <Button className="mt-3" variant="destructive" onClick={() => setOpen(true)}>{s.deleteTitle}</Button>
          ) : (
            <form onSubmit={remove} noValidate className="mt-3 space-y-3">
              <div>
                <label htmlFor="delete-password" className="mb-1.5 block text-sm font-medium text-ink">{s.passwordLabel}</label>
                <Input
                  id="delete-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => { setPassword(event.target.value); setDeleteState("idle"); }}
                  aria-invalid={deleteState === "wrongPassword"}
                  aria-describedby="delete-password-hint"
                  disabled={deleting}
                  className="field-soft px-4"
                />
                <p id="delete-password-hint" className="mt-1 text-xs text-muted-foreground">{s.passwordHint}</p>
              </div>
              {deleteState !== "idle" && <p role="alert" className="text-xs text-rose-700">{deleteMessage}</p>}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="destructive" disabled={!password || deleting}>
                  {deleting && <LogoSpinner size={18} />}
                  {s.deleteAction}
                </Button>
                <Button type="button" variant="outline" disabled={deleting} onClick={() => { setOpen(false); setPassword(""); setDeleteState("idle"); }}>{s.cancel}</Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Section>
  );
}

export function SessionSection() {
  const copy = usePatientCopy();
  const { signOut } = usePatient();
  const [busy, setBusy] = useState(false);
  return (
    <Section icon={<LogOut className="size-[1.125rem] rtl:-scale-x-100" aria-hidden />} title={copy.settings.session.title}>
      <Button variant="outline" disabled={busy} onClick={() => { setBusy(true); void signOut().then((done) => { if (!done) setBusy(false); }); }}>
        {busy && <LogoSpinner size={18} />}{copy.settings.session.signOut}
      </Button>
    </Section>
  );
}
