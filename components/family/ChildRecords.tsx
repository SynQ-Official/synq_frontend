"use client";

import { useState } from "react";
import { familyApi, type FamilyNote, type ObsField, type Observation } from "@/lib/family/api";
import { emptyCheckinForm, errorKind, fromObservation, isEmptyCheckin, toCheckinInput, type CheckinForm } from "@/lib/family/logic";
import { cn } from "@/lib/utils";
import { Card, inputClass, LoadError, Notice, PrimaryButton, SecondaryButton, useFamilyCopy, useLoad } from "./FamilyShell";

const SCALES: ObsField[] = ["mood", "energy", "focus", "sleepQuality", "transitions"];
const DIFFICULTIES = ["transitions", "sleep", "focus", "conflict", "school", "routine", "mood-change", "unusual-experiences", "other"];
const BEHAVIORS = ["calm", "restless", "withdrawn", "irritable", "tearful", "outburst", "hard-to-wake", "unusual-ideas", "other"];
const today = () => new Date().toISOString().slice(0, 10);

function Chips({ options, value, onChange, labels }: { options: string[]; value: string[]; onChange: (v: string[]) => void; labels: Record<string, string> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button key={o} type="button" aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={cn("min-h-10 rounded-full border px-3 text-sm", on ? "border-teal-700 bg-teal-700 text-white" : "border-line-strong bg-white hover:bg-canvas")}>
            {labels[o] ?? o}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- check-in
export function ChildCheckin({ childId, onSaved }: { childId: string; onSaved: () => void }) {
  const { t, lang } = useFamilyCopy();
  const history = useLoad(() => familyApi.checkins(childId).then((r) => r.data), [childId]);
  const todays = history.data?.parent.find((o) => o.date.slice(0, 10) === today());
  if (history.error) return <LoadError error={history.error} retry={history.reload} />;
  if (!history.data) return <p className="text-sm text-ink-muted">{t.loading}</p>;
  return (
    <div className="space-y-5">
      {/* key: the form starts from the saved answer of today (or empty), and restarts after a save */}
      <CheckinFormCard key={todays?.updatedAt ?? todays?.id ?? "new"} childId={childId} saved={todays} onSaved={() => { history.reload(); onSaved(); }} />
      <Card>
        <h2 className="text-base ">{t.checkin.history}</h2>
        <HistoryList parent={history.data.parent} child={history.data.child} lang={lang} />
      </Card>
    </div>
  );
}

function CheckinFormCard({ childId, saved, onSaved }: { childId: string; saved?: Observation & { updatedAt?: string }; onSaved: () => void }) {
  const { t } = useFamilyCopy();
  const [form, setForm] = useState<CheckinForm>(() => (saved ? fromObservation(saved) : emptyCheckinForm()));
  const [note, setNote] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const setField = (f: ObsField, patch: Partial<CheckinForm[ObsField]>) => setForm((s) => ({ ...s, [f]: { ...s[f], ...patch } }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEmptyCheckin(form)) return setNote({ kind: "error", text: t.checkin.empty });
    setBusy(true);
    setNote(null);
    try {
      await familyApi.saveCheckin(childId, toCheckinInput(form));
      setNote({ kind: "ok", text: t.checkin.saved });
      onSaved();
    } catch (err) {
      setNote({ kind: "error", text: errorKind(err) === "denied" ? t.denied : t.error });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <form onSubmit={save} className="space-y-5">
        <div>
          <h2 className="text-base ">{t.checkin.title}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t.checkin.lead}</p>
        </div>
        {SCALES.map((field) => (
          <fieldset key={field} className="space-y-2">
            <legend className="text-sm font-medium">{t.checkin.fields[field]}</legend>
            <div className="flex flex-wrap items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" aria-pressed={form[field].value === n} onClick={() => setField(field, { value: n })}
                  className={cn("size-11 rounded-full border text-sm ", form[field].value === n ? "border-teal-700 bg-teal-700 text-white" : "border-line-strong bg-white")}>
                  {n}
                </button>
              ))}
              <button type="button" aria-pressed={form[field].value === null} onClick={() => setField(field, { value: null })}
                className={cn("min-h-11 rounded-full border px-3 text-sm", form[field].value === null ? "border-ink bg-ink text-white" : "border-line-strong bg-white")}>
                {t.checkin.unknown}
              </button>
            </div>
            <p className="text-xs text-ink-muted">1 = {t.checkin.scaleLow} · 5 = {t.checkin.scaleHigh}</p>
            {form[field].value !== null && <SourcePicker value={form[field].source} onChange={(source) => setField(field, { source })} />}
          </fieldset>
        ))}
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t.checkin.fields.sleepHours}</legend>
          <div className="flex flex-wrap items-center gap-2">
            <input type="number" min={0} max={24} step={0.5} inputMode="decimal" className={cn(inputClass, "mt-0 w-28")} value={form.sleepHours.value ?? ""}
              onChange={(e) => setField("sleepHours", { value: e.target.value === "" ? null : Math.min(24, Math.max(0, Number(e.target.value))) })} />
            <button type="button" aria-pressed={form.sleepHours.value === null} onClick={() => setField("sleepHours", { value: null })}
              className={cn("min-h-11 rounded-full border px-3 text-sm", form.sleepHours.value === null ? "border-ink bg-ink text-white" : "border-line-strong bg-white")}>
              {t.checkin.unknown}
            </button>
          </div>
          {form.sleepHours.value !== null && <SourcePicker value={form.sleepHours.source} onChange={(source) => setField("sleepHours", { source })} />}
        </fieldset>
        <fieldset className="space-y-2"><legend className="text-sm font-medium">{t.checkin.difficulties}</legend>
          <Chips options={DIFFICULTIES} value={form.difficulties} onChange={(difficulties) => setForm((s) => ({ ...s, difficulties }))} labels={t.difficulty} />
        </fieldset>
        <fieldset className="space-y-2"><legend className="text-sm font-medium">{t.checkin.behaviors}</legend>
          <Chips options={BEHAVIORS} value={form.behaviors} onChange={(behaviors) => setForm((s) => ({ ...s, behaviors }))} labels={t.behavior} />
        </fieldset>
        {note && <Notice kind={note.kind}>{note.text}</Notice>}
        <PrimaryButton type="submit" disabled={busy}>{saved ? t.checkin.update : t.checkin.save}</PrimaryButton>
      </form>
    </Card>
  );
}

function SourcePicker({ value, onChange }: { value: "OBSERVED" | "REPORTED_BY_CHILD"; onChange: (v: "OBSERVED" | "REPORTED_BY_CHILD") => void }) {
  const { t } = useFamilyCopy();
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {(["OBSERVED", "REPORTED_BY_CHILD"] as const).map((s) => (
        <label key={s} className="inline-flex items-center gap-1">
          <input type="radio" checked={value === s} onChange={() => onChange(s)} /> {s === "OBSERVED" ? t.checkin.sourceObserved : t.checkin.sourceChild}
        </label>
      ))}
    </div>
  );
}

function HistoryList({ parent, child, lang }: { parent: Observation[]; child: { date: string; mood: number; energy: number; focus: number; sleepHours: number }[] | null; lang: "en" | "ar" }) {
  const { t } = useFamilyCopy();
  const days = [...new Set([...parent.map((p) => p.date.slice(0, 10)), ...(child ?? []).map((c) => c.date.slice(0, 10))])].sort().reverse();
  if (!days.length) return <p className="mt-2 text-sm text-ink-muted">{t.overview.none}</p>;
  const value = (v: number | null) => (v === null ? t.checkin.unknown : String(v));
  return (
    <ul className="mt-3 divide-y divide-line">
      {days.map((d) => {
        const p = parent.find((o) => o.date.slice(0, 10) === d);
        const c = child?.find((o) => o.date.slice(0, 10) === d);
        return (
          <li key={d} className="py-3 text-sm">
            <p className="">{new Date(`${d}T12:00:00Z`).toLocaleDateString(lang === "ar" ? "ar" : "en", { weekday: "short", day: "numeric", month: "short" })}</p>
            {p && <p className="mt-1"><span className="me-2 rounded bg-teal-50 px-1.5 py-0.5 text-xs text-teal-800">{t.checkin.yours}</span>{t.checkin.fields.mood} {value(p.mood)} · {t.checkin.fields.energy} {value(p.energy)} · {t.checkin.fields.focus} {value(p.focus)} · {t.checkin.fields.sleepHours} {value(p.sleepHours)}</p>}
            {c && <p className="mt-1"><span className="me-2 rounded bg-gold-50 px-1.5 py-0.5 text-xs text-gold-700">{t.checkin.childOwn}</span>{t.checkin.fields.mood} {c.mood} · {t.checkin.fields.energy} {c.energy} · {t.checkin.fields.focus} {c.focus} · {t.checkin.fields.sleepHours} {c.sleepHours}</p>}
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------- journal
export function ChildJournal({ childId }: { childId: string }) {
  const { t, lang } = useFamilyCopy();
  const notes = useLoad(() => familyApi.notes(childId).then((r) => r.data), [childId]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<FamilyNote | null>(null);
  const [error, setError] = useState("");
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await familyApi.writeNote(childId, text.trim());
      setLast(data);
      setText("");
      notes.reload();
    } catch (err) {
      setError(errorKind(err) === "denied" ? t.denied : t.error);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-5">
      <Card>
        <form onSubmit={save} className="space-y-3">
          <h2 className="text-base ">{t.journal.title}</h2>
          <p className="text-sm text-ink-muted">{t.journal.lead}</p>
          <textarea className={inputClass} rows={4} maxLength={6000} placeholder={t.journal.placeholder} value={text} onChange={(e) => setText(e.target.value)} />
          {error && <Notice kind="error">{error}</Notice>}
          <PrimaryButton type="submit" disabled={busy || !text.trim()}>{t.journal.save}</PrimaryButton>
        </form>
      </Card>
      {last?.crisis && <CrisisBanner note={last} />}
      {notes.error ? <LoadError error={notes.error} retry={notes.reload} /> : null}
      {notes.data?.length === 0 && <p className="text-sm text-ink-muted">{t.journal.empty}</p>}
      <ul className="space-y-3">
        {notes.data?.map((n) => (
          <li key={n.id}>
            <Card>
              <p className="text-xs text-ink-muted">{new Date(n.createdAt).toLocaleString(lang === "ar" ? "ar" : "en")}</p>
              <h3 className="mt-2 text-xs  uppercase tracking-wide text-ink-muted">{t.journal.youWrote}</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm">{n.reported.content}</p>
              <div className="mt-3 rounded-xl bg-canvas p-3 text-sm">
                <h4 className="text-xs  text-ink-muted">{t.journal.aiReading}</h4>
                {n.analysisStatus === "PENDING" && <p className="mt-1 text-ink-muted">{t.journal.pending}</p>}
                {n.analysisStatus === "FAILED" && <p className="mt-1 text-ink-muted">{t.journal.failed}</p>}
                {n.aiReading && <p className="mt-1">{t.journal.themes}: {n.aiReading.themes.length ? n.aiReading.themes.join(", ") : "—"}</p>}
              </div>
              {n.crisis && <CrisisBanner note={n} compact />}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The real status of the crisis record, word for word: never "help is on the way" unless a clinician was alerted. */
function CrisisBanner({ note, compact }: { note: FamilyNote; compact?: boolean }) {
  const { t } = useFamilyCopy();
  const c = note.crisis!;
  return (
    <div role="alert" className={cn("rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700", compact ? "mt-3" : "")}>
      <p className="">{c.careTeamAlerted ? t.journal.crisis[c.status] : t.journal.crisisNoAlert}</p>
      <p className="mt-1">{t.journal.emergency}</p>
      {note.support?.emergencyResources?.length ? <ul className="mt-1 list-disc ps-5">{note.support.emergencyResources.map((r) => <li key={r} dir="ltr">{r}</li>)}</ul> : null}
    </div>
  );
}

// ---------------------------------------------------------------- progress & reports
export function ChildProgress({ childId }: { childId: string }) {
  const { t } = useFamilyCopy();
  const report = useLoad(() => familyApi.report(childId).then((r) => r.data), [childId]);
  if (report.error) return <LoadError error={report.error} retry={report.reload} />;
  if (!report.data) return <p className="text-sm text-ink-muted">{t.loading}</p>;
  const { summary } = report.data;
  return (
    <Card className="space-y-4 print:border-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base ">{t.progress.title}</h2>
          <p className="text-sm text-ink-muted">{t.progress.lead} ({report.data.from} → {report.data.to})</p>
        </div>
        <SecondaryButton type="button" onClick={() => window.print()} className="print:hidden">{t.progress.print}</SecondaryButton>
      </div>
      {summary.daysObserved === 0 ? <p className="text-sm text-ink-muted">{t.progress.noData}</p> : (
        <>
          <p className="text-sm">{t.progress.days}: <strong>{summary.daysObserved}</strong></p>
          <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {(["mood", "energy", "focus", "sleepHours"] as const).map((f) => (
              <div key={f} className="rounded-xl bg-canvas p-3">
                <dt className="text-xs text-ink-muted">{t.checkin.fields[f]} · {t.progress.average}</dt>
                <dd className="text-lg ">{summary.averages[f] ?? "—"}</dd>
                <dd className="text-xs text-ink-muted">{t.progress.unknown}: {summary.unknownAnswers[f] ?? 0}</dd>
              </div>
            ))}
          </dl>
          {summary.sleepRange && <p className="text-sm">{t.progress.sleepRange}: {summary.sleepRange.min}–{summary.sleepRange.max} h</p>}
          {summary.difficulties.length > 0 && (
            <div>
              <h3 className="text-sm ">{t.progress.difficulties}</h3>
              <ul className="mt-1 flex flex-wrap gap-2 text-sm">{summary.difficulties.map((d) => <li key={d.label} className="rounded-full bg-canvas px-3 py-1">{t.difficulty[d.label] ?? d.label} · {d.count}</li>)}</ul>
            </div>
          )}
        </>
      )}
      <p className="text-xs text-ink-muted">{report.data.disclaimer}</p>
    </Card>
  );
}
