"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, FileText, NotebookPen, Printer, Trash2 } from "lucide-react";
import { PARENT_PACK_BASE, StatusNote, type Note } from "@/components/parent-pack/ParentPackShell";
import { PatientModal } from "@/components/patient/ui/PatientModal";
import { EmptyState, ErrorState, GlassCard, PageIntro, SectionTitle, Skeleton } from "@/components/patient/ui/primitives";
import { TrendChart } from "@/components/patient/ui/TrendChart";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCaregiverCheckins, useCaregiverJournal } from "@/hooks/parent-pack/useParentPack";
import { ApiError } from "@/lib/api/client";
import { parentPackApi } from "@/lib/parent-pack/api";
import { addDays, dailySeries, DIFFICULTY_LABELS, difficultyCounts, localDay } from "@/lib/parent-pack/observations";
import { telHref } from "@/lib/patient/sos";
import { DIFFICULTIES, MEDICATION_NOTES, type CaregiverCheckin, type CaregiverCheckinInput, type CaregiverReport, type Difficulty, type JournalSupport, type MedicationNote } from "@/lib/parent-pack/types";
import { cn } from "@/lib/utils";

const MED_LABELS: Record<MedicationNote, string> = { AS_PLANNED: "As planned", PARTLY: "Partly", MISSED: "Missed", NOT_APPLICABLE: "Not applicable" };
const SCALE = [1, 2, 3, 4, 5] as const;
const WINDOWS = [7, 30] as const;

const blank = (): CaregiverCheckinInput => ({ mood: 3, energy: 3, focus: 3, sleepHours: 8, sleepQuality: null, difficulties: [], medication: null });

/** Family Clinical Journal: the daily observation, a note read by the Smart Journal, the charts, and a report for appointments. */
export function FamilyJournal() {
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(7);
  const checkins = useCaregiverCheckins(30);
  const journal = useCaregiverJournal();
  const [checkinNote, setCheckinNote] = useState<Note>(null);
  const recent = (checkins.data ?? []).filter((c) => c.date.slice(0, 10) >= addDays(localDay(), -(days - 1)));

  return (
    <>
      <PageIntro eyebrow="Family Clinical Journal" icon={NotebookPen} title="What you noticed today"
        subtitle="Your observations stay separate from what your child records. They are for you and the care team; SynQ does not interpret them." />

      <div className="grid items-start gap-5 xl:grid-cols-[1.05fr_1fr]">
        <CheckinForm key={checkins.data ? todayEntry(checkins.data)?.updatedAt ?? "new" : "loading"} existing={checkins.data && todayEntry(checkins.data)} note={checkinNote} setNote={setCheckinNote} onSaved={(saved) => checkins.setData((list = []) => [...list.filter((c) => c.date.slice(0, 10) !== saved.date.slice(0, 10)), saved].sort((a, b) => a.date.localeCompare(b.date)))} />
        <JournalComposer onSaved={() => void journal.refresh()} />
      </div>

      <section className="mt-8" aria-labelledby="pp-history">
        <SectionTitle id="pp-history" title="Recorded observations" subtitle="Each chart shows only what was recorded. Empty days stay empty."
          action={<div role="group" aria-label="Window" className="flex gap-1">{WINDOWS.map((w) => <Button key={w} size="sm" variant={days === w ? "default" : "outline"} aria-pressed={days === w} onClick={() => setDays(w)}>{w === 7 ? "Week" : "Month"}</Button>)}</div>} />
        {checkins.error && !checkins.data ? <ErrorState onRetry={() => void checkins.refresh()} /> : !checkins.data ? <Skeleton className="h-60" /> : recent.length === 0 ? (
          <EmptyState icon={NotebookPen} title="No observations in this window" body="Record today above: the charts fill in as you go." />
        ) : <JournalCharts checkins={recent} days={days} />}
      </section>

      <section className="mt-8 grid items-start gap-5 lg:grid-cols-2">
        <ObservationList checkins={checkins.data ?? []} onRemoved={(date) => checkins.setData((list = []) => list.filter((c) => c.date.slice(0, 10) !== date))} />
        <NoteList journal={journal} />
      </section>

      <ReportSection />
    </>
  );
}

function ChipRow<T extends string | number>({ label, value, options, onChange, format }: { label: string; value: T | null; options: readonly T[]; onChange: (v: T | null) => void; format?: (v: T) => string }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-medium text-ink-soft">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button key={String(o)} type="button" aria-pressed={value === o} onClick={() => onChange(value === o ? null : o)}
            className={cn("min-h-9 min-w-9 rounded-full border px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-teal-500", value === o ? "border-teal-600 bg-teal-600 text-white" : "border-line bg-white/70 text-ink hover:border-teal-200")}>
            {format ? format(o) : o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const todayEntry = (list: CaregiverCheckin[]) => list.find((c) => c.date.slice(0, 10) === localDay());

/** Keyed by the saved observation: a new server value remounts it with that value as the starting form. */
function CheckinForm({ existing, onSaved, note, setNote }: { existing: CaregiverCheckin | undefined; onSaved: (c: CaregiverCheckin) => void; note: Note; setNote: (n: Note) => void }) {
  const today = localDay();
  const [form, setForm] = useState<CaregiverCheckinInput>(() =>
    existing ? { mood: existing.mood, energy: existing.energy, focus: existing.focus, sleepHours: existing.sleepHours, sleepQuality: existing.sleepQuality, difficulties: existing.difficulties, medication: existing.medication } : blank());
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof CaregiverCheckinInput>(key: K, value: CaregiverCheckinInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const toggle = (d: Difficulty) => set("difficulties", form.difficulties.includes(d) ? form.difficulties.filter((x) => x !== d) : [...form.difficulties, d]);

  const submit = async () => {
    setSaving(true);
    setNote(null);
    try {
      const { data } = await parentPackApi.submitCheckin({ ...form, date: today });
      onSaved(data);
      setNote({ tone: "success", text: existing ? "Today's observation was updated." : "Today's observation is saved." });
    } catch (error) {
      setNote({ tone: "error", text: error instanceof ApiError && error.status === 400 ? "Some values were not accepted. Please check them." : "We couldn't save it. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard className="space-y-4 p-5" aria-labelledby="pp-checkin">
      <h2 id="pp-checkin" className="text-base font-semibold text-ink">Daily check-in {existing && <span className="text-xs font-normal text-ink-muted">· recorded today, you can update it</span>}</h2>
      <ChipRow label="Observed mood (1 low – 5 high)" value={form.mood} options={SCALE} onChange={(v) => v && set("mood", v)} />
      <ChipRow label="Energy level" value={form.energy} options={SCALE} onChange={(v) => v && set("energy", v)} />
      <ChipRow label="Focus" value={form.focus} options={SCALE} onChange={(v) => v && set("focus", v)} />
      <label className="block">
        <span className="flex justify-between text-xs font-medium text-ink-soft"><span>Hours slept last night</span><span className="tabular-nums">{form.sleepHours} h</span></span>
        <input type="range" dir="ltr" min={0} max={14} step={0.5} value={form.sleepHours} onChange={(e) => set("sleepHours", Number(e.target.value))} className="mt-1.5 w-full accent-teal-600" />
      </label>
      <ChipRow label="Sleep quality (optional)" value={form.sleepQuality as (typeof SCALE)[number] | null} options={SCALE} onChange={(v) => set("sleepQuality", v)} />
      <fieldset>
        <legend className="mb-1.5 text-xs font-medium text-ink-soft">Difficulties today</legend>
        <div className="flex flex-wrap gap-1.5">
          {DIFFICULTIES.map((d) => (
            <button key={d} type="button" aria-pressed={form.difficulties.includes(d)} onClick={() => toggle(d)}
              className={cn("rounded-full border px-3 py-1.5 text-[0.8125rem] focus-visible:outline-2 focus-visible:outline-teal-500", form.difficulties.includes(d) ? "border-gold-300 bg-gold-50 text-gold-700" : "border-line bg-white/70 text-ink-soft")}>{DIFFICULTY_LABELS[d]}</button>
          ))}
        </div>
      </fieldset>
      <ChipRow label="Medication taken as agreed with the care team (optional observation)" value={form.medication} options={MEDICATION_NOTES} format={(m) => MED_LABELS[m]} onChange={(v) => set("medication", v)} />
      <p className="text-xs text-muted-foreground">An observation only. SynQ never advises on medication: talk to the care team about any change.</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => void submit()} disabled={saving} aria-busy={saving}>{saving ? "Saving…" : existing ? "Update today" : "Save today"}</Button>
        <StatusNote note={note} />
      </div>
    </GlassCard>
  );
}

function JournalComposer({ onSaved }: { onSaved: () => void }) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const [support, setSupport] = useState<JournalSupport | null>(null);

  const submit = async () => {
    if (!content.trim()) return setNote({ tone: "error", text: "Write a few words first." });
    setSaving(true);
    setNote(null);
    try {
      const entry = await parentPackApi.writeJournal({ content: content.trim() });
      setContent("");
      setSupport(entry.support?.level === "CRISIS" ? entry.support : null);
      setNote({ tone: "success", text: "Your note is saved." });
      onSaved();
    } catch {
      setNote({ tone: "error", text: "We couldn't save the note. Your text is still here." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard className="space-y-3 p-5" aria-labelledby="pp-note">
      <h2 id="pp-note" className="text-base font-semibold text-ink">Important events and notes</h2>
      <p className="text-xs text-muted-foreground">Read by SynQ&apos;s Smart Journal like your child&apos;s own journal. If a note describes a crisis, it is flagged for human review, as for the patient. This is not an emergency service.</p>
      <label className="sr-only" htmlFor="pp-note-text">What happened today</label>
      <Textarea id="pp-note-text" dir="auto" rows={7} maxLength={6000} value={content} onChange={(e) => setContent(e.target.value)} placeholder="What happened today? What was hard, what went well?" />
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => void submit()} disabled={saving} aria-busy={saving}>{saving ? "Saving…" : "Save note"}</Button>
        <StatusNote note={note} />
      </div>
      {support && <CrisisNotice resources={support.emergencyResources ?? []} />}
    </GlassCard>
  );
}

/** Shown when the Smart Journal reads a crisis in the note: real numbers only (care team, configured resources). */
export function CrisisNotice({ resources }: { resources: string[] }) {
  return (
    <div role="alert" className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-900">
      <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4" aria-hidden />If anyone is in immediate danger, call your local emergency number now.</p>
      <p className="mt-1.5">This note was flagged for review. That is not an emergency response: SynQ is not an emergency service and cannot send help to you. Contact your care team directly as well.</p>
      {resources.length > 0 && (
        <ul className="mt-2 space-y-1">
          {resources.map((line) => {
            const href = telHref(line);
            return <li key={line} dir="auto">{href ? <a className="underline underline-offset-4" href={href}>{line}</a> : line}</li>;
          })}
        </ul>
      )}
      <Link href={`${PARENT_PACK_BASE}/safety#emergency`} className="mt-2 inline-block font-semibold underline underline-offset-4">Open your safety plan</Link>
    </div>
  );
}

export function JournalCharts({ checkins, days, end }: { checkins: CaregiverCheckin[]; days: number; end?: string }) {
  const counts = difficultyCounts(checkins);
  const max = Math.max(1, ...counts.map((c) => c.count));
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <GlassCard className="p-5 lg:col-span-2">
        <h3 className="text-sm font-semibold text-ink">Hours of sleep</h3>
        <TrendChart data={dailySeries(checkins, days, "sleepHours", end)} domain={[0, 14]} ticks={[0, 7, 14]} unit=" h" height={170} />
        <h3 className="mt-5 text-sm font-semibold text-ink">Observed mood</h3>
        <TrendChart data={dailySeries(checkins, days, "mood", end)} domain={[1, 5]} ticks={[1, 3, 5]} color="var(--color-gold-600)" height={150} />
      </GlassCard>
      <GlassCard className="p-5">
        <h3 className="text-sm font-semibold text-ink">Difficulties reported</h3>
        <p className="text-xs text-muted-foreground">Days each was ticked, out of {checkins.length} observed.</p>
        {counts.length === 0 ? <p className="mt-4 text-sm text-ink-muted">None ticked in this window.</p> : (
          <ul className="mt-4 space-y-2.5">
            {counts.map((c) => (
              <li key={c.label}>
                <span className="flex justify-between text-[0.8125rem] text-ink"><span>{DIFFICULTY_LABELS[c.label]}</span><span className="tabular-nums text-ink-muted">{c.count}</span></span>
                <span className="mt-1 block h-2 rounded-full bg-surface-muted"><span className="block h-2 rounded-full bg-teal-500" style={{ width: `${(c.count / max) * 100}%` }} /></span>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}

function ObservationList({ checkins, onRemoved }: { checkins: CaregiverCheckin[]; onRemoved: (date: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const remove = async (date: string) => {
    try {
      await parentPackApi.removeCheckin(date);
      onRemoved(date);
    } catch {
      setError("We couldn't delete it. Please try again.");
    }
  };
  const list = [...checkins].reverse().slice(0, 10);
  return (
    <GlassCard className="p-5" aria-labelledby="pp-days">
      <h2 id="pp-days" className="mb-3 text-sm font-semibold text-ink">Daily history</h2>
      {error && <p role="alert" className="mb-2 text-sm text-rose-700">{error}</p>}
      {list.length === 0 ? <p className="text-sm text-ink-muted">Nothing recorded yet.</p> : (
        <ul className="divide-y divide-line/70">
          {list.map((c) => {
            const day = c.date.slice(0, 10);
            return (
              <li key={c.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="w-24 shrink-0 font-medium tabular-nums text-ink">{new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</span>
                <span className="min-w-0 flex-1 truncate text-ink-soft">Mood {c.mood}/5 · Sleep {c.sleepHours} h{c.difficulties.length ? ` · ${c.difficulties.map((d) => DIFFICULTY_LABELS[d]).join(", ")}` : ""}</span>
                <Button size="icon" variant="ghost" aria-label={`Delete the observation of ${day}`} onClick={() => void remove(day)}><Trash2 aria-hidden /></Button>
              </li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );
}

function NoteList({ journal }: { journal: ReturnType<typeof useCaregiverJournal> }) {
  const remove = async (id: string) => {
    try {
      await parentPackApi.removeJournal(id);
      journal.setData((list = []) => list.filter((e) => e.id !== id));
    } catch {
      void journal.refresh();
    }
  };
  const entries = journal.data ?? [];
  return (
    <GlassCard className="p-5" aria-labelledby="pp-notes">
      <h2 id="pp-notes" className="mb-3 text-sm font-semibold text-ink">Notes</h2>
      {journal.error && !journal.data ? <ErrorState onRetry={() => void journal.refresh()} /> : !journal.data ? <Skeleton className="h-32" /> : entries.length === 0 ? <p className="text-sm text-ink-muted">No notes yet.</p> : (
        <ul className="divide-y divide-line/70">
          {entries.map((e) => (
            <li key={e.id} className="flex items-start gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-ink-muted">{new Date(e.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
                <p className="mt-0.5 line-clamp-3 text-sm text-ink" dir="auto">{e.content}</p>
                {e.analysis?.themes?.length ? <p className="mt-1 text-xs text-ink-subtle">Themes: {e.analysis.themes.join(", ")}</p> : e.analysisStatus === "PENDING" ? <p className="mt-1 text-xs text-ink-subtle">Being read…</p> : null}
              </div>
              <Button size="icon" variant="ghost" aria-label="Delete this note" onClick={() => void remove(e.id)}><Trash2 aria-hidden /></Button>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

function printReport() {
  document.body.classList.add("printing-report");
  const done = () => {
    document.body.classList.remove("printing-report");
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
}

function ReportSection() {
  const [range, setRange] = useState({ from: addDays(localDay(), -29), to: localDay() });
  const [report, setReport] = useState<CaregiverReport | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  const open = async () => {
    setState("loading");
    try {
      setReport((await parentPackApi.report(range)).data);
      setState("idle");
    } catch {
      setState("error");
    }
  };

  return (
    <section id="report" className="mt-8 scroll-mt-24" aria-labelledby="pp-report">
      <GlassCard className="flex flex-wrap items-end justify-between gap-4 p-5">
        <div>
          <h2 id="pp-report" className="flex items-center gap-2 text-base font-semibold text-ink"><FileText className="size-4" aria-hidden />Consultation report</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">A chronological summary with charts, to print or save as PDF and bring to an appointment.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-medium text-ink-soft">From<input type="date" className="mt-1 block rounded-xl border border-line bg-white px-3 py-2 text-sm" value={range.from} max={range.to} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} /></label>
          <label className="text-xs font-medium text-ink-soft">To<input type="date" className="mt-1 block rounded-xl border border-line bg-white px-3 py-2 text-sm" value={range.to} min={range.from} max={localDay()} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} /></label>
          <Button onClick={() => void open()} disabled={state === "loading"} aria-busy={state === "loading"}>{state === "loading" ? "Preparing…" : "Prepare report"}</Button>
        </div>
        {state === "error" && <p role="alert" className="w-full text-sm text-rose-700">We couldn&apos;t prepare the report (at most 120 days). Please try again.</p>}
      </GlassCard>
      <PatientModal open={!!report} onOpenChange={(o) => !o && setReport(null)} title="Family observations report" size="xl">
        {report && <ReportBody report={report} />}
      </PatientModal>
    </section>
  );
}

function ReportBody({ report }: { report: CaregiverReport }) {
  const s = report.summary;
  const days = Math.round((Date.parse(report.to) - Date.parse(report.from)) / 86_400_000) + 1;
  const fmt = (v: number | null, unit = "") => (v === null ? "—" : `${v}${unit}`);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm text-ink-soft">{report.from} → {report.to} · {s.daysObserved} day{s.daysObserved === 1 ? "" : "s"} observed · generated {new Date(report.generatedAt).toLocaleString()}</p>
        <Button variant="outline" size="sm" onClick={printReport} className="print:hidden"><Printer aria-hidden />Print / save PDF</Button>
      </div>
      <p className="rounded-xl bg-gold-50 px-3 py-2 text-xs text-ink-soft">{report.disclaimer}</p>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {([["Mood", fmt(s.averages.mood, "/5")], ["Energy", fmt(s.averages.energy, "/5")], ["Focus", fmt(s.averages.focus, "/5")], ["Sleep", fmt(s.averages.sleepHours, " h")], ["Sleep range", s.sleepRange ? `${s.sleepRange.min}–${s.sleepRange.max} h` : "—"]] as const).map(([k, v]) => (
          <div key={k} className="rounded-xl border border-line p-3"><dt className="text-xs text-ink-muted">{k} (average)</dt><dd className="text-lg font-semibold tabular-nums text-ink">{v}</dd></div>
        ))}
      </dl>
      {report.days.length > 0 && <JournalCharts checkins={report.days} days={Math.min(days, 120)} end={report.to} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div><h3 className="text-sm font-semibold text-ink">Medication observations</h3><p className="text-sm text-ink-soft">{s.medication.length ? s.medication.map((m) => `${MED_LABELS[m.label as MedicationNote] ?? m.label}: ${m.count}`).join(" · ") : "None recorded."}</p></div>
        <div><h3 className="text-sm font-semibold text-ink">Notes</h3><p className="text-sm text-ink-soft">{s.journal.entries} note{s.journal.entries === 1 ? "" : "s"}{s.journal.themes.length ? ` · themes: ${s.journal.themes.map((t) => `${t.label} (${t.count})`).join(", ")}` : ""}</p></div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink">Chronology</h3>
        {report.days.length === 0 ? <p className="text-sm text-ink-muted">No observations in this period.</p> : (
          <table className="w-full text-start text-sm">
            <thead className="text-xs text-ink-muted"><tr><th className="py-1 text-start font-medium">Day</th><th className="text-start font-medium">Mood</th><th className="text-start font-medium">Energy</th><th className="text-start font-medium">Focus</th><th className="text-start font-medium">Sleep</th><th className="text-start font-medium">Difficulties</th></tr></thead>
            <tbody className="divide-y divide-line/70">
              {report.days.map((d) => (
                <tr key={d.id}><td className="py-1.5 tabular-nums">{d.date.slice(0, 10)}</td><td>{d.mood}</td><td>{d.energy}</td><td>{d.focus}</td><td>{d.sleepHours} h{d.sleepQuality ? ` (${d.sleepQuality}/5)` : ""}</td><td>{d.difficulties.map((x) => DIFFICULTY_LABELS[x]).join(", ") || "—"}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
