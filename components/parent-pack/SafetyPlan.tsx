"use client";

import { useState } from "react";
import { LifeBuoy, Phone, Plus, ShieldCheck, Trash2, TriangleAlert } from "lucide-react";
import { StatusNote, type Note } from "@/components/parent-pack/ParentPackShell";
import { ErrorState, GlassCard, PageIntro, Skeleton } from "@/components/patient/ui/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSafetyPlan } from "@/hooks/parent-pack/useParentPack";
import { parentPackApi } from "@/lib/parent-pack/api";
import { contactError, EMPTY_PLAN, emergencyState, isDialable, ROLE_LABELS, telLink } from "@/lib/parent-pack/observations";
import { telHref } from "@/lib/patient/sos";
import type { ContactRole, SafetyContact, SafetyPlan as Plan } from "@/lib/parent-pack/types";

const CALMER_SPACE = [
  "Lower the lights and turn off screens and music, if it is safe to do so.",
  "Reduce the number of people in the room; one calm adult speaks.",
  "Speak slowly, in short sentences, and keep your distance.",
  "Move objects that could be used to cause harm out of reach, if you can do so safely.",
];

/** Crisis & Safety Plan: the emergency panel first (what to do now), then the plan prepared with the care team. */
export function SafetyPlan() {
  const resource = useSafetyPlan();
  const saved = resource.data?.data ?? null;
  const resources = resource.data?.emergencyResources ?? [];
  const [note, setNote] = useState<Note>(null);

  return (
    <>
      <PageIntro eyebrow="Crisis & Safety Plan" icon={LifeBuoy} title="Ready for a difficult moment"
        subtitle="Prepare this plan with your child's care team. In a crisis, it puts your numbers and agreed steps in one place." />
      {resource.error && !resource.data ? <ErrorState onRetry={() => void resource.refresh()} /> : !resource.data ? (
        <div className="space-y-5" aria-busy><Skeleton className="h-48" /><Skeleton className="h-96" /></div>
      ) : (
        <div className="space-y-6">
          <EmergencyPanel plan={saved} resources={resources} />
          <PlanEditor key={saved?.updatedAt ?? "new"} initial={saved} note={note} setNote={setNote} onSaved={(plan) => resource.setData((r) => ({ emergencyResources: r?.emergencyResources ?? [], data: plan }))} />
        </div>
      )}
    </>
  );
}

export function EmergencyPanel({ plan, resources }: { plan: Plan | null; resources: string[] }) {
  const state = emergencyState(plan);
  const emergency = plan?.emergencyNumber ? telLink(plan.emergencyNumber) : null;
  return (
    <section id="emergency" aria-labelledby="pp-emergency" className="scroll-mt-24 rounded-[1.5rem] border border-rose-100 bg-white p-5 shadow-sm sm:p-6">
      <h2 id="pp-emergency" className="flex items-center gap-2 text-lg  text-rose-800"><TriangleAlert className="size-5" aria-hidden />If someone is in immediate danger</h2>
      <p className="mt-1 text-sm text-ink-soft">Call your local emergency services now. SynQ does not call anyone for you and is not an emergency service.</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          {emergency ? (
            <a href={emergency} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-rose-700 px-5 text-base  text-white shadow-sm hover:bg-rose-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700">
              <Phone className="size-5" aria-hidden />Call emergency services · {plan!.emergencyNumber}
            </a>
          ) : (
            <p className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/60 px-4 py-3 text-sm text-rose-900">
              {state === "empty" ? "Your plan is empty." : "No emergency number saved yet."} Look up your local emergency number and add it below so it is one tap away.
            </p>
          )}
          {resources.length > 0 && (
            <div className="rounded-2xl bg-teal-50/80 p-4">
              <p className="text-sm  text-teal-900">From your care team and SynQ</p>
              <ul className="mt-1.5 space-y-1 text-sm text-teal-900">
                {resources.map((line) => {
                  const href = telHref(line);
                  return <li key={line} dir="auto" className="flex gap-2"><Phone className="mt-0.5 size-4 shrink-0" aria-hidden />{href ? <a className="underline-offset-4 hover:underline" href={href}>{line}</a> : line}</li>;
                })}
              </ul>
            </div>
          )}
          {plan && plan.contacts.length > 0 && (
            <ul className="divide-y divide-line/70 rounded-2xl border border-line">
              {plan.contacts.map((c) => {
                const href = telLink(c.phone);
                return (
                  <li key={`${c.name}${c.phone}`} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="min-w-0 flex-1"><span className="block text-sm  text-ink" dir="auto">{c.name}</span><span className="block text-xs text-ink-muted">{ROLE_LABELS[c.role]}{c.relation ? ` · ${c.relation}` : ""}</span></span>
                    {href && <Button asChild size="sm" variant="outline"><a href={href} aria-label={`Call ${c.name}`}><Phone aria-hidden />{c.phone}</a></Button>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          {plan && plan.agreedActions.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm  text-ink">
                Steps agreed with the care team {plan.reviewedWithProfessional && <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700"><ShieldCheck className="size-3.5" aria-hidden />reviewed</span>}
              </h3>
              <ol className="mt-1.5 list-decimal space-y-1 ps-5 text-sm text-ink">{plan.agreedActions.map((a) => <li key={a} dir="auto">{a}</li>)}</ol>
            </div>
          )}
          <div>
            <h3 className="text-sm  text-ink">A calmer space, when it is safe</h3>
            <ul className="mt-1.5 space-y-1 text-sm text-ink-soft">{CALMER_SPACE.map((t) => <li key={t} className="flex gap-2"><span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-teal-500" />{t}</li>)}</ul>
            <p className="mt-2 text-xs text-ink-muted">General guidance only. It never replaces emergency services or your care team&apos;s instructions.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ListEditor({ label, hint, items, onChange, max = 10 }: { label: string; hint: string; items: string[]; onChange: (items: string[]) => void; max?: number }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const value = draft.trim();
    if (!value || items.length >= max) return;
    onChange([...items, value.slice(0, 200)]);
    setDraft("");
  };
  return (
    <fieldset>
      <legend className="text-sm  text-ink">{label}</legend>
      <p className="text-xs text-muted-foreground">{hint}</p>
      {items.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {items.map((item, i) => (
            <li key={`${item}${i}`} className="flex items-center gap-2 rounded-xl border border-line bg-white/70 px-3 py-2 text-sm"><span className="min-w-0 flex-1" dir="auto">{item}</span>
              <Button size="icon" variant="ghost" aria-label={`Remove: ${item}`} onClick={() => onChange(items.filter((_, j) => j !== i))}><Trash2 aria-hidden /></Button></li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex gap-2">
        <Input dir="auto" value={draft} maxLength={200} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} aria-label={`Add to ${label}`} disabled={items.length >= max} />
        <Button variant="outline" onClick={add} disabled={!draft.trim() || items.length >= max}><Plus aria-hidden />Add</Button>
      </div>
    </fieldset>
  );
}

/** Keyed by the saved plan, so a new server version restarts it; the status note lives in the parent and survives that. */
function PlanEditor({ initial, onSaved, note, setNote }: { initial: Plan | null; onSaved: (plan: Plan) => void; note: Note; setNote: (n: Note) => void }) {
  const [plan, setPlan] = useState<Plan>(initial ?? EMPTY_PLAN);
  const [contact, setContact] = useState<SafetyContact>({ name: "", relation: "", phone: "", role: "trusted" });
  const [contactProblem, setContactProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const addContact = () => {
    const problem = contactError(contact);
    setContactProblem(problem);
    if (problem || plan.contacts.length >= 12) return;
    setPlan({ ...plan, contacts: [...plan.contacts, { ...contact, name: contact.name.trim(), phone: contact.phone.trim() }] });
    setContact({ name: "", relation: "", phone: "", role: contact.role });
  };

  const emergencyInvalid = !!plan.emergencyNumber && !isDialable(plan.emergencyNumber);
  const save = async () => {
    if (emergencyInvalid) return setNote({ tone: "error", text: "The emergency number needs 3 to 15 digits." });
    setSaving(true);
    setNote(null);
    try {
      const { data } = await parentPackApi.saveSafetyPlan({ ...plan, emergencyNumber: plan.emergencyNumber?.trim() || null });
      onSaved(data);
      setNote({ tone: "success", text: "Safety plan saved." });
    } catch {
      setNote({ tone: "error", text: "We couldn't save the plan. Your changes are still here." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard className="space-y-6 p-5 sm:p-6" aria-labelledby="pp-plan">
      <h2 id="pp-plan" className="text-lg  text-ink">Your safety plan</h2>

      <label className="block max-w-sm">
        <span className="text-sm  text-ink">Local emergency number</span>
        <span className="block text-xs text-muted-foreground">Type the number for where you live. SynQ never fills it in for you.</span>
        <Input className="mt-2" inputMode="tel" dir="ltr" value={plan.emergencyNumber ?? ""} onChange={(e) => setPlan({ ...plan, emergencyNumber: e.target.value })} aria-invalid={emergencyInvalid} />
      </label>

      <fieldset>
        <legend className="text-sm  text-ink">Contacts</legend>
        <p className="text-xs text-muted-foreground">Trusted people, the treating professional and other emergency contacts.</p>
        {plan.contacts.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {plan.contacts.map((c, i) => (
              <li key={`${c.name}${i}`} className="flex items-center gap-2 rounded-xl border border-line bg-white/70 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1"><span className="font-medium" dir="auto">{c.name}</span> <span className="text-ink-muted">· {ROLE_LABELS[c.role]} · <span dir="ltr">{c.phone}</span></span></span>
                <Button size="icon" variant="ghost" aria-label={`Remove ${c.name}`} onClick={() => setPlan({ ...plan, contacts: plan.contacts.filter((_, j) => j !== i) })}><Trash2 aria-hidden /></Button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto_auto]">
          <Input placeholder="Name" aria-label="Contact name" dir="auto" value={contact.name} maxLength={80} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
          <Input placeholder="Relation (optional)" aria-label="Relation" dir="auto" value={contact.relation} maxLength={80} onChange={(e) => setContact({ ...contact, relation: e.target.value })} />
          <Input placeholder="Phone" aria-label="Phone number" inputMode="tel" dir="ltr" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
          <select aria-label="Contact type" className="min-h-11 rounded-xl border border-line-strong bg-white px-3 text-sm" value={contact.role} onChange={(e) => setContact({ ...contact, role: e.target.value as ContactRole })}>
            {(Object.keys(ROLE_LABELS) as ContactRole[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <Button variant="outline" onClick={addContact}><Plus aria-hidden />Add</Button>
        </div>
        {contactProblem && <p role="alert" className="mt-1.5 text-sm text-rose-700">{contactProblem}</p>}
      </fieldset>

      <ListEditor label="Warning signs" hint="Signs you agreed with the professional to watch for." items={plan.warningSigns} onChange={(warningSigns) => setPlan({ ...plan, warningSigns })} />
      <ListEditor label="Agreed safety steps" hint="What to do, in order, as agreed with the care team." items={plan.agreedActions} onChange={(agreedActions) => setPlan({ ...plan, agreedActions })} />

      <label className="block">
        <span className="text-sm  text-ink">Communication preferences</span>
        <span className="block text-xs text-muted-foreground">What helps your child in a hard moment, what to avoid saying, who they prefer to talk to.</span>
        <Textarea className="mt-2" dir="auto" rows={3} maxLength={1000} value={plan.communication ?? ""} onChange={(e) => setPlan({ ...plan, communication: e.target.value })} />
      </label>

      <label className="flex items-center gap-3 text-sm text-ink">
        <input type="checkbox" className="size-4 accent-teal-600" checked={plan.reviewedWithProfessional} onChange={(e) => setPlan({ ...plan, reviewedWithProfessional: e.target.checked })} />
        This plan was reviewed with a healthcare professional
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={() => void save()} disabled={saving} aria-busy={saving}>{saving ? "Saving…" : "Save the plan"}</Button>
        <StatusNote note={note} />
      </div>
    </GlassCard>
  );
}
