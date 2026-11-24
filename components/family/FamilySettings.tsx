"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { ApiError } from "@/lib/api/errors";
import { signInHref } from "@/lib/config/auth-role";
import { familyApi, type ChildLink, type ParentProfile } from "@/lib/family/api";
import { familySignOut } from "@/lib/family/session";
import { Card, inputClass, LoadError, Notice, PageHeading, PrimaryButton, SecondaryButton, useFamilyCopy, useLoad } from "./FamilyShell";

/** 08 - Parent profile and family settings: profile, consents, and ending access per child (REVOKED is final). */
export function FamilySettings() {
  const { t, lang } = useFamilyCopy();
  const me = useLoad(() => familyApi.me().then((r) => r.data), []);
  const consents = useLoad(() => familyApi.consents().then((r) => r.data), []);
  const children = useLoad(() => familyApi.children().then((r) => r.data), []);
  const date = (iso: string) => new Date(iso).toLocaleDateString(lang === "ar" ? "ar" : "en", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-5">
      <PageHeading title={t.settings.title} />

      {me.error ? <LoadError error={me.error} retry={me.reload} /> : me.data ? <ProfileForm key={me.data.id} profile={me.data} onSaved={me.setData} /> : <p className="text-sm text-ink-muted">{t.loading}</p>}

      <Card>
        <h2 className="text-base ">{t.settings.children}</h2>
        {children.error ? <LoadError error={children.error} retry={children.reload} /> : (
          <ul className="mt-3 divide-y divide-line">
            {(children.data ?? []).map((link) => <AccessRow key={link.childId} link={link} onChange={() => { children.reload(); consents.reload(); }} />)}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="text-base ">{t.settings.consents}</h2>
        {consents.error ? <LoadError error={consents.error} retry={consents.reload} /> : (
          <ul className="mt-3 space-y-2 text-sm">
            {(consents.data ?? []).map((c) => (
              <li key={c.id} className="flex flex-wrap justify-between gap-2 rounded-xl bg-canvas p-3">
                <span>{c.childFirstName ? `${c.childFirstName} · ` : ""}{c.purpose} <span className="text-ink-muted">(v{c.version})</span></span>
                <span className={c.withdrawnAt ? "text-rose-700" : "text-sage-700"}>
                  {c.withdrawnAt ? `${t.settings.withdrawn} ${date(c.withdrawnAt)}` : `${t.settings.granted} ${date(c.grantedAt)}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <DeleteAccount />
    </div>
  );
}

function ProfileForm({ profile, onSaved }: { profile: ParentProfile; onSaved: (p: ParentProfile) => void }) {
  const { t } = useFamilyCopy();
  const { setLanguage } = useLanguage();
  const [form, setForm] = useState({ firstName: profile.firstName, lastName: profile.lastName, phone: profile.phoneNumber ?? "", lang: profile.language === "AR" ? "ar" as const : "en" as const });
  const [note, setNote] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    try {
      const { data } = await familyApi.updateMe({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), phone: form.phone.trim() || null, lang: form.lang });
      onSaved(data);
      setLanguage(form.lang);
      setNote({ kind: "ok", text: t.safety.saved });
    } catch {
      setNote({ kind: "error", text: t.error });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <h2 className="text-base ">{t.settings.profile}</h2>
      <p className="mt-1 text-sm text-ink-muted" dir="ltr">{profile.email}</p>
      <form onSubmit={save} className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">{t.auth.firstName}<input required maxLength={60} className={inputClass} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></label>
        <label className="text-sm font-medium">{t.auth.lastName}<input required maxLength={60} className={inputClass} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></label>
        <label className="text-sm font-medium">{t.auth.phone}<input className={inputClass} dir="ltr" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
        <label className="text-sm font-medium">{t.language}
          <select className={inputClass} value={form.lang} onChange={(e) => setForm({ ...form, lang: e.target.value === "ar" ? "ar" : "en" })}>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <PrimaryButton type="submit" disabled={busy}>{t.settings.save}</PrimaryButton>
          {note && <Notice kind={note.kind}>{note.text}</Notice>}
        </div>
      </form>
    </Card>
  );
}

function AccessRow({ link, onChange }: { link: ChildLink; onChange: () => void }) {
  const { t } = useFamilyCopy();
  const ended = link.status === "REVOKED";

  return (
    <li className="space-y-2 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{link.firstName} <span className="text-sm text-ink-muted">· {t.status[link.status]}</span></p>
        {!ended && <WithdrawRequest link={link} onDone={onChange} />}
      </div>
    </li>
  );
}

/** Ends the family access for a child after a confirm step. Used by Settings (ends access) and the home card (cancels a request). */
export function WithdrawRequest({ link, onDone, label, confirmText }: { link: ChildLink; onDone: () => void; label?: string; confirmText?: string }) {
  const { t } = useFamilyCopy();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const withdraw = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await familyApi.withdraw(link.childId);
      onDone();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      {!confirming && <SecondaryButton onClick={() => setConfirming(true)}>{label ?? t.settings.withdraw}</SecondaryButton>}
      {confirming && (
        <div className="max-w-md rounded-xl bg-rose-50 p-3 text-sm">
          <p>{confirmText ?? t.settings.withdrawConfirm}</p>
          <div className="mt-2 flex gap-2">
            <PrimaryButton className="bg-rose-700 hover:bg-rose-800" disabled={busy} onClick={withdraw}>{label ?? t.settings.withdraw}</PrimaryButton>
            <SecondaryButton onClick={() => setConfirming(false)}>{t.addChild.cancel}</SecondaryButton>
          </div>
        </div>
      )}
      {failed && <Notice kind="error">{t.error}</Notice>}
    </div>
  );
}

/** Closes the parent account: password re-entry, then sign out and back to the parent sign-in. */
function DeleteAccount() {
  const { t } = useFamilyCopy();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"wrong" | "generic" | null>(null);

  const remove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    setError(null);
    try {
      await familyApi.deleteAccount(password);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 400 && err.code === "INVALID_PASSWORD" ? "wrong" : "generic");
      setBusy(false);
      return;
    }
    await familySignOut().catch(() => undefined);
    router.replace(signInHref("parent"));
  };

  return (
    <Card tone="danger">
      <h2 className="text-base text-rose-700">{t.settings.deleteTitle}</h2>
      <p className="mt-1 text-sm text-ink-muted">{t.settings.deleteLead}</p>
      <ul className="mt-3 list-disc space-y-1 ps-5 text-sm">
        {t.settings.deletePoints.map((point) => <li key={point}>{point}</li>)}
      </ul>
      <form onSubmit={remove} className="mt-4 grid gap-3 sm:max-w-md">
        <label className="text-sm font-medium">{t.settings.deletePassword}
          <input type="password" autoComplete="current-password" required className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <Notice kind="error">{error === "wrong" ? t.settings.passwordWrong : t.error}</Notice>}
        <div>
          <PrimaryButton type="submit" className="bg-rose-700 hover:bg-rose-800" disabled={busy || !password}>{t.settings.deleteConfirm}</PrimaryButton>
        </div>
      </form>
    </Card>
  );
}
