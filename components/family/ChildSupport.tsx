"use client";

import { useState } from "react";
import { Phone, Plus, Trash2 } from "lucide-react";
import { familyApi, type FamilyContext, type SafetyContact, type SafetyPlan } from "@/lib/family/api";
import { errorKind } from "@/lib/family/logic";
import { Card, inputClass, LoadError, Notice, PrimaryButton, SecondaryButton, useFamilyCopy, useLoad } from "./FamilyShell";

type GuidanceItem = { id: string; topic: string; title: string; summary: string; points: string[] };

// ---------------------------------------------------------------- guidance: what is known, by provenance
export function ChildGuidance({ childId }: { childId: string }) {
  const { t } = useFamilyCopy();
  const context = useLoad(() => familyApi.context(childId).then((r) => r.data), [childId]);
  const articles = useLoad(() => familyApi.guidance(childId), [childId]);
  if (context.error) return <LoadError error={context.error} retry={context.reload} />;
  if (!context.data) return <p className="text-sm text-ink-muted">{t.loading}</p>;
  const c = context.data;
  const items = (articles.data?.data ?? []) as GuidanceItem[];
  const awaiting = articles.data?.meta.awaitingClinicalReview ?? 0;

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-lg ">{t.guidance.title}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t.guidance.lead}</p>
      </header>

      {c.escalate && <Card tone="danger"><Notice kind="error">{t.guidance.escalate}</Notice></Card>}
      {!c.sufficiency.enough && <Card tone="warn"><Notice kind="info">{t.guidance.insufficient}</Notice></Card>}

      <div className="grid gap-4 md:grid-cols-3">
        <SourceCard title={t.guidance.clinician}>
          <p className="text-sm">{c.sources.CLINICIAN_PROVIDED_CONTEXT.track ? `${t.overview.carePath}: ${c.sources.CLINICIAN_PROVIDED_CONTEXT.track}` : t.overview.noCarePath}</p>
        </SourceCard>
        <SourceCard title={t.guidance.parent}>
          <ParentSource source={c.sources.PARENT_REPORTED_OBSERVATION} />
        </SourceCard>
        <SourceCard title={t.guidance.child}>
          {c.sources.CHILD_SELF_REPORT.shared
            ? <p className="text-sm">{t.guidance.daysRecorded(c.sources.CHILD_SELF_REPORT.days)}</p>
            : <p className="text-sm text-ink-muted">{t.guidance.notShared}</p>}
        </SourceCard>
      </div>

      {c.contradictions.length > 0 && (
        <Card tone="warn">
          <h3 className="text-sm ">{t.guidance.disagree}</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {c.contradictions.map((x) => (
              <li key={`${x.date}-${x.field}`}>
                {x.date} · {t.checkin.fields[x.field as keyof typeof t.checkin.fields] ?? x.field}: {t.checkin.yours} {x.parent} / {t.checkin.childOwn} {x.child}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h3 className="text-sm ">{t.guidance.articles}</h3>
        {items.length > 0 ? (
          <ul className="mt-3 space-y-3">
            {items.map((a) => (
              <li key={a.id} className="rounded-xl bg-canvas p-3">
                <p className="text-xs text-ink-muted">{a.topic}</p>
                <p className="">{a.title}</p>
                <p className="mt-1 text-sm">{a.summary}</p>
                <ul className="mt-2 list-disc space-y-1 ps-5 text-sm">{a.points.map((p) => <li key={p}>{p}</li>)}</ul>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-ink-muted">{t.guidance.awaiting(awaiting)}</p>}
      </Card>

      <details className="rounded-2xl border border-line bg-white p-4 text-sm">
        <summary className="cursor-pointer ">{t.guidance.rules}</summary>
        <ul className="mt-2 list-disc space-y-1 ps-5">{c.rules.map((r) => <li key={r}>{t.guidance.rule[r] ?? r}</li>)}</ul>
      </details>
    </div>
  );
}

function SourceCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card><h3 className="mb-2 text-xs  uppercase tracking-wide text-ink-muted">{title}</h3>{children}</Card>;
}

function ParentSource({ source }: { source: FamilyContext["sources"]["PARENT_REPORTED_OBSERVATION"] }) {
  const { t } = useFamilyCopy();
  return (
    <div className="space-y-2 text-sm">
      <p>{t.guidance.daysRecorded(source.days)}</p>
      {source.recurringDifficulties.length > 0 ? (
        <div>
          <p className="text-xs text-ink-muted">{t.guidance.recurring}</p>
          <p>{source.recurringDifficulties.map((d) => `${t.difficulty[d.label] ?? d.label} (${d.days})`).join(", ")}</p>
        </div>
      ) : <p className="text-ink-muted">{t.guidance.noDifficulty}</p>}
    </div>
  );
}

// ---------------------------------------------------------------- resources (clinically approved, for the clinician's track)
export function ChildResources({ childId }: { childId: string }) {
  const { t, lang } = useFamilyCopy();
  const res = useLoad(() => familyApi.resources(childId), [childId]);
  if (res.error) return <LoadError error={res.error} retry={res.reload} />;
  if (!res.data) return <p className="text-sm text-ink-muted">{t.loading}</p>;
  const { data, meta } = res.data;
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-lg ">{t.resources.title}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t.resources.lead}</p>
      </header>
      {data.length === 0 ? (
        <Card><p className="text-sm text-ink-muted">{meta.track ? t.resources.empty : t.resources.noTrack}</p></Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.map((r) => {
            const title = lang === "ar" && r.titleAr ? r.titleAr : r.title;
            return (
              <li key={r.id}>
                <Card className="h-full">
                  {r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className=" text-teal-800 underline-offset-4 hover:underline">{title}</a> : <p className="">{title}</p>}
                  {r.summary && <p className="mt-1 text-sm">{r.summary}</p>}
                  <p className="mt-2 text-xs text-ink-muted">{[r.sourceOrg, r.readingTimeMinutes ? `${r.readingTimeMinutes} min` : null].filter(Boolean).join(" · ")}</p>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- safety plan (typed by the family; nothing is ever called)
const emptyPlan = (): SafetyPlan => ({ contacts: [], emergencyNumber: null, warningSigns: [], communication: null, agreedActions: [], reviewedWithProfessional: false });
const lines = (text: string) => text.split("\n").map((s) => s.trim()).filter(Boolean);

export function ChildSafety({ childId }: { childId: string }) {
  const { t } = useFamilyCopy();
  const res = useLoad(() => familyApi.safetyPlan(childId), [childId]);
  if (res.error) return <LoadError error={res.error} retry={res.reload} />;
  if (!res.data) return <p className="text-sm text-ink-muted">{t.loading}</p>;
  const plan = res.data.data ?? emptyPlan();
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-lg ">{t.safety.title}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t.safety.lead}</p>
      </header>
      <EmergencyPanel plan={plan} clinic={res.data.emergencyResources} />
      {/* key: the form restarts from what the server saved */}
      <SafetyForm key={plan.updatedAt ?? "new"} childId={childId} initial={plan} onSaved={res.reload} />
    </div>
  );
}

function EmergencyPanel({ plan, clinic }: { plan: SafetyPlan; clinic: string[] }) {
  const { t } = useFamilyCopy();
  const numbers = [
    ...(plan.emergencyNumber ? [{ label: t.safety.emergencyNumber, phone: plan.emergencyNumber }] : []),
    ...plan.contacts.map((c) => ({ label: `${c.name} · ${t.safety.role[c.role]}`, phone: c.phone })),
  ];
  return (
    <Card tone="danger">
      <p className="text-sm ">{t.journal.emergency}</p>
      {numbers.length ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {numbers.map((n) => (
            <li key={`${n.label}-${n.phone}`}>
              <a href={`tel:${n.phone.replace(/[^\d+]/g, "")}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm  ring-1 ring-rose-100">
                <Phone className="size-4" aria-hidden /> {n.label}: <span dir="ltr">{n.phone}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : <p className="mt-1 text-sm">{t.overview.noEmergencyNumber}</p>}
      {clinic.length > 0 && (
        <div className="mt-3 text-sm">
          <p className="text-xs ">{t.safety.clinic}</p>
          <ul className="mt-1 space-y-0.5">{clinic.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
      )}
    </Card>
  );
}

function SafetyForm({ childId, initial, onSaved }: { childId: string; initial: SafetyPlan; onSaved: () => void }) {
  const { t } = useFamilyCopy();
  const [plan, setPlan] = useState(initial);
  const [signs, setSigns] = useState(initial.warningSigns.join("\n"));
  const [actions, setActions] = useState(initial.agreedActions.join("\n"));
  const [note, setNote] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const setContact = (i: number, patch: Partial<SafetyContact>) => setPlan((p) => ({ ...p, contacts: p.contacts.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    try {
      // Only the editable fields: the server owns updatedAt.
      await familyApi.saveSafetyPlan(childId, { contacts: plan.contacts, communication: plan.communication, reviewedWithProfessional: plan.reviewedWithProfessional, emergencyNumber: plan.emergencyNumber?.trim() || null, warningSigns: lines(signs), agreedActions: lines(actions) });
      setNote({ kind: "ok", text: t.safety.saved });
      onSaved();
    } catch (error) {
      setNote({ kind: "error", text: errorKind(error) === "invalid" ? t.auth.errors.generic : t.error });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <form onSubmit={save} className="space-y-4">
        <label className="block text-sm font-medium">
          {t.safety.emergencyNumber}
          <input className={inputClass} dir="ltr" inputMode="tel" value={plan.emergencyNumber ?? ""} onChange={(e) => setPlan({ ...plan, emergencyNumber: e.target.value })} />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t.safety.contacts}</legend>
          {plan.contacts.map((c, i) => (
            <div key={i} className="grid gap-2 rounded-xl bg-canvas p-3 sm:grid-cols-[1fr_1fr_auto_auto]">
              <input aria-label={t.safety.name} placeholder={t.safety.name} className={inputClass} value={c.name} onChange={(e) => setContact(i, { name: e.target.value })} />
              <input aria-label={t.safety.phone} placeholder={t.safety.phone} className={inputClass} dir="ltr" inputMode="tel" value={c.phone} onChange={(e) => setContact(i, { phone: e.target.value })} />
              <select aria-label={t.safety.contacts} className={inputClass} value={c.role} onChange={(e) => setContact(i, { role: e.target.value as SafetyContact["role"] })}>
                {(["trusted", "professional", "emergency"] as const).map((r) => <option key={r} value={r}>{t.safety.role[r]}</option>)}
              </select>
              <button type="button" aria-label={t.checkin.remove} onClick={() => setPlan({ ...plan, contacts: plan.contacts.filter((_, j) => j !== i) })} className="inline-flex min-h-11 items-center justify-center rounded-full px-3 text-rose-700 hover:bg-white">
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          ))}
          <SecondaryButton type="button" onClick={() => setPlan({ ...plan, contacts: [...plan.contacts, { name: "", phone: "", role: "trusted" }] })}>
            <Plus className="size-4" aria-hidden /> {t.safety.addContact}
          </SecondaryButton>
        </fieldset>

        <label className="block text-sm font-medium">
          {t.safety.signs}
          <textarea rows={3} className={inputClass} value={signs} onChange={(e) => setSigns(e.target.value)} />
        </label>
        <label className="block text-sm font-medium">
          {t.safety.actions}
          <textarea rows={3} className={inputClass} value={actions} onChange={(e) => setActions(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-5 accent-teal-700" checked={plan.reviewedWithProfessional} onChange={(e) => setPlan({ ...plan, reviewedWithProfessional: e.target.checked })} />
          {t.safety.reviewed}
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <PrimaryButton type="submit" disabled={busy}>{t.safety.save}</PrimaryButton>
          {note && <Notice kind={note.kind}>{note.text}</Notice>}
        </div>
      </form>
    </Card>
  );
}
