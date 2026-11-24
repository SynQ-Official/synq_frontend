"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BedDouble, Plus, UserPlus } from "lucide-react";
import { RoomLive } from "./ChildRoom";
import { familyApi, type ChildLink, type Permission, type Relationship } from "@/lib/family/api";
import { FAMILY_CONSENT_VERSION } from "@/lib/family/copy";
import { errorKind } from "@/lib/family/logic";
import { VerifyToUseNotice } from "@/components/auth/EmailVerificationBanner";
import { cn } from "@/lib/utils";
import { Card, inputClass, LoadError, Notice, PrimaryButton, SecondaryButton, useFamilyCopy, useLoad } from "./FamilyShell";
import { WithdrawRequest } from "./FamilySettings";

const PERMISSIONS: Permission[] = ["canCheckin", "canJournal", "canViewReports", "canUseGuidance", "canViewResources", "canUseSafetyPlan", "childSelfReport", "viewChildSelfReport", "showClinician"];
const RELATIONSHIPS: Relationship[] = ["MOTHER", "FATHER", "LEGAL_GUARDIAN", "OTHER_CAREGIVER"];
const STATUS_TONE: Record<ChildLink["status"], "plain" | "warn" | "danger" | "calm"> = {
  DRAFT: "plain", PENDING_REVIEW: "plain", APPROVED: "warn", ACTIVE: "calm", REJECTED: "danger", SUSPENDED: "warn", REVOKED: "plain",
};

/** Home of the portal: every child, the exact state of their request, and the one thing to do next. */
export function FamilyHome() {
  const { t } = useFamilyCopy();
  const children = useLoad(() => familyApi.children().then((r) => r.data), []);
  const me = useLoad(() => familyApi.me().then((r) => r.data), []);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-5 lg:space-y-6">
      <section className="lm-welcome p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            <h1 className="text-title  tracking-[-0.02em] text-balance" dir="auto">{t.home.hello(me.data?.firstName ?? "")}</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">{t.home.lead}</p>
          </div>
          {!adding && <PrimaryButton onClick={() => setAdding(true)}><Plus className="size-4" aria-hidden />{t.home.add}</PrimaryButton>}
        </div>
      </section>
      {adding && <AddChild onDone={() => { setAdding(false); children.reload(); }} onCancel={() => setAdding(false)} />}
      {children.error ? <LoadError error={children.error} retry={children.reload} /> : null}
      {children.loading && !children.data && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-busy aria-label={t.loading}>
          <div className="lm-glass h-56 animate-pulse" /><div className="lm-glass hidden h-56 animate-pulse md:block" />
        </div>
      )}
      {children.data?.length === 0 && !adding && (
        <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <span aria-hidden className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100"><UserPlus className="size-5" /></span>
          <p className="max-w-xl flex-1 text-sm leading-relaxed">{t.home.empty}</p>
          <PrimaryButton onClick={() => setAdding(true)}><Plus className="size-4" aria-hidden />{t.home.add}</PrimaryButton>
        </Card>
      )}
      <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
        {children.data?.map((link) => <ChildCard key={link.childId} link={link} onChange={children.reload} />)}
      </div>
    </div>
  );
}

const WITHDRAWABLE: ChildLink["status"][] = ["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED"];

/** Where a request stands on the way to an open space (REJECTED is back at the first step; REVOKED has no path). */
const STEP: Record<ChildLink["status"], number> = { DRAFT: 0, REJECTED: 0, PENDING_REVIEW: 1, APPROVED: 2, ACTIVE: 3, SUSPENDED: 3, REVOKED: -1 };

function RequestSteps({ status }: { status: ChildLink["status"] }) {
  const { t } = useFamilyCopy();
  const at = STEP[status];
  if (at < 0) return null;
  return (
    <ol aria-label={t.home.stepsLabel} className="grid grid-cols-4 gap-1.5">
      {t.home.steps.map((label, i) => (
        <li key={label} aria-current={i === at ? "step" : undefined} className="min-w-0">
          <span aria-hidden className={cn("block h-1.5 rounded-full", i <= at ? (status === "REJECTED" ? "bg-rose-300" : status === "SUSPENDED" ? "bg-gold-300" : "bg-teal-600") : "bg-teal-100")} />
          <span className={cn("mt-1.5 block truncate text-[0.6875rem]", i === at ? " text-ink" : "text-ink-subtle")}>{label}</span>
        </li>
      ))}
    </ol>
  );
}

function ChildCard({ link, onChange }: { link: ChildLink; onChange: () => void }) {
  const { t } = useFamilyCopy();
  const router = useRouter();
  const badge = { plain: "bg-white text-ink-soft ring-line", warn: "bg-white text-gold-700 ring-gold-100", danger: "bg-white text-rose-700 ring-rose-100", calm: "bg-teal-700 text-white ring-teal-700" }[STATUS_TONE[link.status]];
  return (
    <Card tone={STATUS_TONE[link.status]} className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-200 to-teal-600 text-lg  text-white shadow-brand">{(link.firstName?.trim()[0] ?? "·").toUpperCase()}</span>
          <div className="min-w-0">
            <h2 className="truncate text-lg " dir="auto">{link.firstName}</h2>
            <p className="text-sm text-ink-muted">{link.age !== null ? `${t.overview.ageYears(link.age)} · ` : ""}{t.relationship[link.relationship]}</p>
          </div>
        </div>
        <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs  ring-1", badge)}>{t.status[link.status]}</span>
      </div>
      <RequestSteps status={link.status} />
      <p className="text-sm leading-relaxed">{t.statusHelp[link.status]}</p>
      {link.decisionReason && <p className="rounded-xl bg-white/70 p-3 text-sm text-ink-muted">“{link.decisionReason}”</p>}
      {(link.status === "DRAFT" || link.status === "REJECTED") && <SubmitRequest link={link} onDone={onChange} />}
      {link.status === "APPROVED" && <ReviewAccess link={link} onDone={onChange} />}
      {/* Cancelling a request that has not opened yet. Once ACTIVE, access is ended in Settings instead. */}
      {WITHDRAWABLE.includes(link.status) && <WithdrawRequest link={link} onDone={onChange} label={t.home.withdraw} confirmText={t.home.withdrawConfirm} />}
      {/* The child's room, live, straight from the home: the API gates it with the same permission as the Room tab. */}
      {link.status === "ACTIVE" && link.permissions?.canViewResources && (
        <div className="-mx-5 overflow-hidden border-t border-line/70 sm:-mx-6">
          <RoomLive childId={link.childId} onOpen={() => router.push(`/family/children/${link.childId}?tab=room`)} className="h-52" />
        </div>
      )}
      {link.status === "ACTIVE" && (
        <div className="flex flex-wrap gap-2">
          <Link href={`/family/children/${link.childId}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-teal-700 px-5 text-sm  text-white shadow-brand transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500">
            {t.home.open} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
          </Link>
          {link.permissions?.canViewResources && (
            <Link href={`/family/children/${link.childId}?tab=room`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong bg-white/80 px-5 text-sm  text-ink transition hover:border-teal-200 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500">
              <BedDouble className="size-4" aria-hidden />{t.tabs.room}
            </Link>
          )}
        </div>
      )}
    </Card>
  );
}

function AddChild({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const { t } = useFamilyCopy();
  const [form, setForm] = useState({ firstName: "", birthDate: "", relationship: "MOTHER" as Relationship, legal: false, verification: "" });
  const [error, setError] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.birthDate) return setError(t.addChild.errors.required);
    setBusy(true);
    setError("");
    try {
      await familyApi.addChild({ firstName: form.firstName.trim(), birthDate: form.birthDate, relationship: form.relationship, isLegalRepresentative: form.legal, verificationNote: form.verification.trim() || undefined });
      onDone();
    } catch (err) {
      if (errorKind(err) === "unverified") setUnverified(true);
      else setError(errorKind(err) === "adult" ? t.addChild.errors.adult : t.error);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <form onSubmit={submit} className="space-y-4">
        <h2 className="text-lg ">{t.addChild.title}</h2>
        <p className="text-sm text-ink-muted">{t.addChild.note}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">{t.addChild.firstName}<input className={inputClass} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></label>
          <label className="block text-sm font-medium">{t.addChild.birthDate}<input type="date" className={inputClass} value={form.birthDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /></label>
        </div>
        <label className="block text-sm font-medium">{t.addChild.relationship}
          <select className={inputClass} value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value as Relationship })}>
            {RELATIONSHIPS.map((r) => <option key={r} value={r}>{t.relationship[r]}</option>)}
          </select>
        </label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 size-4" checked={form.legal} onChange={(e) => setForm({ ...form, legal: e.target.checked })} />{t.addChild.legalRep}</label>
        <label className="block text-sm font-medium">{t.addChild.verification}
          <textarea className={inputClass} rows={2} maxLength={1000} value={form.verification} onChange={(e) => setForm({ ...form, verification: e.target.value })} />
          <span className="mt-1 block text-xs font-normal text-ink-muted">{t.addChild.verificationHint}</span>
        </label>
        {error && <Notice kind="error">{error}</Notice>}
        {unverified && <VerifyToUseNotice audience="parent" />}
        <div className="flex flex-wrap gap-2">
          <PrimaryButton type="submit" disabled={busy}>{t.addChild.save}</PrimaryButton>
          <SecondaryButton type="button" onClick={onCancel}>{t.addChild.cancel}</SecondaryButton>
        </div>
      </form>
    </Card>
  );
}

function SubmitRequest({ link, onDone }: { link: ChildLink; onDone: () => void }) {
  const { t } = useFamilyCopy();
  const [email, setEmail] = useState("");
  const [consents, setConsents] = useState([false, false, false]);
  const [error, setError] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consents.every(Boolean)) return setError(t.submit.errors.consents);
    setBusy(true);
    setError("");
    try {
      await familyApi.submit(link.childId, email.trim(), FAMILY_CONSENT_VERSION);
      onDone();
    } catch (err) {
      const kind = errorKind(err);
      if (kind === "unverified") setUnverified(true);
      else setError(kind === "clinician" ? t.submit.errors.clinician : kind === "legal" ? t.submit.errors.legal : kind === "consent" ? t.submit.errors.consents : t.error);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-3 border-t border-line pt-3">
      <h3 className="text-sm ">{t.submit.title}</h3>
      <label className="block text-sm font-medium">{t.submit.clinicianEmail}
        <input type="email" dir="ltr" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        <span className="mt-1 block text-xs font-normal text-ink-muted">{t.submit.clinicianHint}</span>
      </label>
      {t.submit.consents.map((label, i) => (
        <label key={label} className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 size-4" checked={consents[i]} onChange={(e) => setConsents((c) => c.map((v, j) => (j === i ? e.target.checked : v)))} />{label}
        </label>
      ))}
      {!link.isLegalRepresentative && <Notice kind="info">{t.submit.errors.legal}</Notice>}
      {error && <Notice kind="error">{error}</Notice>}
      {unverified && <VerifyToUseNotice audience="parent" />}
      <PrimaryButton type="submit" disabled={busy}>{t.submit.send}</PrimaryButton>
    </form>
  );
}

/** The parent accepts the access exactly as the clinician granted it (the version they are looking at). */
function ReviewAccess({ link, onDone }: { link: ChildLink; onDone: () => void }) {
  const { t } = useFamilyCopy();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const accept = async () => {
    setBusy(true);
    setError("");
    try {
      await familyApi.activate(link.childId, link.version);
      onDone();
    } catch (err) {
      setError(errorKind(err) === "stale" ? t.review.stale : t.error);
      if (errorKind(err) === "stale") onDone();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-3 border-t border-line pt-3">
      <h3 className="text-sm ">{t.review.title}</h3>
      <p className="text-sm text-ink-muted">{t.review.lead}</p>
      <ul className="grid gap-1 text-sm sm:grid-cols-2">
        {PERMISSIONS.map((p) => {
          const on = link.permissions?.[p] === true;
          return (
            <li key={p} className="flex items-center justify-between gap-2 rounded-lg bg-white/70 px-3 py-2">
              <span>{t.permission[p]}</span>
              <span className={cn("text-xs ", on ? "text-sage-700" : "text-ink-muted")}>{on ? t.allowed : t.notAllowed}</span>
            </li>
          );
        })}
      </ul>
      {link.clinician && <p className="text-sm">{t.overview.clinician}: {link.clinician.name}</p>}
      {error && <Notice kind="error">{error}</Notice>}
      <PrimaryButton onClick={accept} disabled={busy}>{t.review.accept}</PrimaryButton>
    </div>
  );
}
