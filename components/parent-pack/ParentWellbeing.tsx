"use client";

import { useState } from "react";
import { Building2, HeartHandshake, MapPin, MessagesSquare, Stethoscope, Wind } from "lucide-react";
import { StatusNote, type Note } from "@/components/parent-pack/ParentPackShell";
import { ExerciseSession } from "@/components/patient/ui/ExerciseSession";
import { EmptyState, ErrorState, GlassCard, PageIntro, SectionTitle, Skeleton } from "@/components/patient/ui/primitives";
import { TrendChart } from "@/components/patient/ui/TrendChart";
import { Button } from "@/components/ui/button";
import { useParentWellbeing } from "@/hooks/parent-pack/useParentPack";
import { parentPackApi } from "@/lib/parent-pack/api";
import { addDays, localDay } from "@/lib/parent-pack/observations";
import type { LocalizedExercise } from "@/lib/patient/exercises";
import { PARENT_DIFFICULTIES, type ParentCheckinInput, type ParentDifficulty } from "@/lib/parent-pack/types";
import { cn } from "@/lib/utils";

const DIFF_LABELS: Record<ParentDifficulty, string> = { sleep: "My sleep", time: "No time for me", work: "Work", isolation: "Feeling alone", conflict: "Tension at home", worry: "Worry", health: "My health", other: "Other" };

/** Short activities, played by the patient app's own exercise player (nothing recorded: they are for the parent). */
const ACTIVITIES: LocalizedExercise[] = [
  { id: "pp-breathing", slug: "pp-breathing", type: "BREATHING", title: "Breathing: 4 in, 6 out", description: "A slower out-breath, for two minutes.", steps: [], minutes: 2, pattern: { inhale: 4, hold: 0, exhale: 6, cycles: 12 } },
  { id: "pp-box", slug: "pp-box", type: "BREATHING", title: "Box breathing", description: "Four equal counts, for a steady minute.", steps: [], minutes: 1, pattern: { inhale: 4, hold: 4, exhale: 4, cycles: 4 } },
  { id: "pp-relax", slug: "pp-relax", type: "RELAXATION", title: "Five-minute pause", description: "A short body scan to put the day down for a moment.", minutes: 5, pattern: null,
    steps: ["Sit comfortably and let your shoulders drop.", "Notice your feet on the floor, then your legs.", "Let your jaw and forehead soften.", "Breathe out slowly three times.", "Name one thing you did for your family today, and one small thing you will do for yourself."] },
  { id: "pp-time", slug: "pp-time", type: "OTHER", title: "Plan a moment for you", description: "Choose one protected moment this week.", minutes: 3, pattern: null,
    steps: ["Pick a 20-minute slot this week that is only yours.", "Decide who covers for you during it.", "Choose what you will do: rest, walk, call a friend.", "Put it in your calendar like an appointment."] },
];

const BURNOUT = [
  { title: "Caregiver fatigue is common", body: "Long-term caregiving can wear down energy, sleep and patience. Noticing it early is a strength, not a failure." },
  { title: "Signs to take seriously", body: "Constant exhaustion, irritability, withdrawing from people you like, or feeling hopeless. Talk to your own doctor or a professional." },
  { title: "Share the load", body: "Ask the care team about family support sessions and respite options, and let trusted people take small tasks." },
];

export function ParentWellbeing() {
  const history = useParentWellbeing(30);
  const [activity, setActivity] = useState<LocalizedExercise | null>(null);
  const [note, setNote] = useState<Note>(null);
  const today = history.data?.find((c) => c.date.slice(0, 10) === localDay());

  return (
    <>
      <PageIntro eyebrow="Parent Wellbeing" icon={HeartHandshake} title="You matter too" subtitle="A minute for how you are doing, a few short pauses, and where to find support." />

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_1fr]">
        <ParentCheckIn key={history.data ? today?.id ?? "new" : "loading"} today={today} note={note} setNote={setNote} onSaved={(saved) => history.setData((list = []) => [...list.filter((c) => c.date.slice(0, 10) !== saved.date.slice(0, 10)), saved].sort((a, b) => a.date.localeCompare(b.date)))} />
        <GlassCard className="p-5" aria-labelledby="pp-mytrend">
          <h2 id="pp-mytrend" className="text-base font-semibold text-ink">Your last 30 days</h2>
          {history.error && !history.data ? <ErrorState onRetry={() => void history.refresh()} /> : !history.data ? <Skeleton className="mt-3 h-48" /> : history.data.length === 0 ? (
            <EmptyState icon={HeartHandshake} title="No check-ins yet" body="Your stress and fatigue will appear here, only for you." />
          ) : (
            <>
              <p className="mt-0.5 text-xs text-muted-foreground">Perceived stress (0–10), as you recorded it.</p>
              <TrendChart data={Array.from({ length: 30 }, (_, i) => {
                const day = addDays(localDay(), i - 29);
                return { label: day.slice(5).replace("-", "/"), value: history.data!.find((c) => c.date.slice(0, 10) === day)?.stress ?? null };
              })} color="var(--color-gold-600)" height={190} />
            </>
          )}
        </GlassCard>
      </div>

      <section className="mt-8" aria-labelledby="pp-activities">
        <SectionTitle id="pp-activities" title="Short pauses" subtitle="One to five minutes. Nothing is recorded." />
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ACTIVITIES.map((a) => (
            <li key={a.id}>
              <button type="button" onClick={() => setActivity(a)} className="lm-glass lm-card lm-card-lift flex h-full w-full flex-col items-start gap-2 p-4 text-start focus-visible:outline-2 focus-visible:outline-teal-500">
                <span className="stat-tile stat-tile-sage"><Wind className="size-5" aria-hidden /></span>
                <span className="text-sm font-semibold text-ink">{a.title}</span>
                <span className="text-xs text-muted-foreground">{a.description} · {a.minutes} min</span>
              </button>
            </li>
          ))}
        </ul>
        <ExerciseSession exercise={activity} open={!!activity} onClose={() => setActivity(null)} onFinish={() => setActivity(null)} />
      </section>

      <section className="mt-8" aria-labelledby="pp-burnout">
        <SectionTitle id="pp-burnout" title="About parental burnout" subtitle="Educational content, pending clinical review." />
        <div className="grid gap-3 md:grid-cols-3">
          {BURNOUT.map((b) => <div key={b.title} className="rounded-2xl border border-line bg-white/60 p-4"><h3 className="text-sm font-semibold text-ink">{b.title}</h3><p className="mt-1 text-sm leading-relaxed text-ink-soft">{b.body}</p></div>)}
        </div>
      </section>

      <CommunityResources />
    </>
  );
}

function ParentCheckIn({ today, onSaved, note, setNote }: { note: Note; setNote: (n: Note) => void; today?: { id: string; fatigue: number; stress: number; load: number; needsRest: boolean; difficulties: ParentDifficulty[] }; onSaved: (c: Awaited<ReturnType<typeof parentPackApi.submitWellbeing>>["data"]) => void }) {
  const [form, setForm] = useState<ParentCheckinInput>(() => (today ? { fatigue: today.fatigue, stress: today.stress, load: today.load, needsRest: today.needsRest, difficulties: today.difficulties } : { fatigue: 5, stress: 5, load: 5, needsRest: false, difficulties: [] }));
  const [saving, setSaving] = useState(false);

  const range = (key: "fatigue" | "stress" | "load", label: string) => (
    <label className="block">
      <span className="flex justify-between text-xs font-medium text-ink-soft"><span>{label}</span><span className="tabular-nums">{form[key]}/10</span></span>
      <input type="range" dir="ltr" min={0} max={10} step={1} value={form[key]} onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })} className="mt-1.5 w-full accent-teal-600" />
    </label>
  );

  const save = async () => {
    setSaving(true);
    setNote(null);
    try {
      const { data } = await parentPackApi.submitWellbeing({ ...form, date: localDay() });
      onSaved(data);
      setNote({ tone: "success", text: "Thank you for taking a minute for yourself." });
    } catch {
      setNote({ tone: "error", text: "We couldn't save it. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const heavy = form.stress >= 8 || form.fatigue >= 8;
  return (
    <GlassCard className="space-y-4 p-5" aria-labelledby="pp-mycheck">
      <h2 id="pp-mycheck" className="text-base font-semibold text-ink">How are you today?</h2>
      {range("fatigue", "Fatigue")}
      {range("stress", "Perceived stress")}
      {range("load", "Emotional workload")}
      <label className="flex items-center gap-3 text-sm text-ink"><input type="checkbox" className="size-4 accent-teal-600" checked={form.needsRest} onChange={(e) => setForm({ ...form, needsRest: e.target.checked })} />I need rest</label>
      <fieldset>
        <legend className="mb-1.5 text-xs font-medium text-ink-soft">What is hard right now</legend>
        <div className="flex flex-wrap gap-1.5">
          {PARENT_DIFFICULTIES.map((d) => {
            const on = form.difficulties.includes(d);
            return <button key={d} type="button" aria-pressed={on} onClick={() => setForm({ ...form, difficulties: on ? form.difficulties.filter((x) => x !== d) : [...form.difficulties, d] })}
              className={cn("rounded-full border px-3 py-1.5 text-[0.8125rem] focus-visible:outline-2 focus-visible:outline-teal-500", on ? "border-gold-300 bg-gold-50 text-gold-700" : "border-line bg-white/70 text-ink-soft")}>{DIFF_LABELS[d]}</button>;
          })}
        </div>
      </fieldset>
      {heavy && <p className="rounded-xl bg-gold-50 px-3 py-2 text-sm text-ink-soft">That sounds like a lot. Consider talking to your own doctor or a professional, and look at the support options below. If you feel unsafe, call your local emergency number.</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => void save()} disabled={saving} aria-busy={saving}>{saving ? "Saving…" : today ? "Update" : "Save"}</Button>
        <StatusNote note={note} />
      </div>
    </GlassCard>
  );
}

/** Ready for a directory, honest until one exists: no invented organisations, people or numbers. */
function CommunityResources() {
  const slots = [
    { icon: MessagesSquare, title: "Parent community", body: "A moderated space to talk with other parents is planned. It will open once moderation and safety are in place." },
    { icon: Building2, title: "Associations", body: "Verified family associations will be listed here once they have been reviewed." },
    { icon: Stethoscope, title: "Specialised professionals", body: "Ask your child's care team for referrals. A verified directory is not connected yet." },
    { icon: MapPin, title: "Local resources in the UAE", body: "Community initiatives such as Ma'an (Authority of Social Contribution) in Abu Dhabi support families. Check their official channels for current programmes; SynQ does not list contact details it has not verified." },
  ];
  return (
    <section className="mt-8" aria-labelledby="pp-community">
      <SectionTitle id="pp-community" title="Community & local resources" subtitle="Coming soon: these lists will only show verified information." />
      <ul className="grid gap-3 md:grid-cols-2">
        {slots.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-3 rounded-2xl border border-dashed border-line-strong bg-white/40 p-4">
            <span className="stat-tile stat-tile-sage shrink-0"><Icon className="size-5" aria-hidden /></span>
            <span><span className="block text-sm font-semibold text-ink">{title}</span><span className="mt-0.5 block text-sm leading-relaxed text-ink-soft">{body}</span></span>
          </li>
        ))}
      </ul>
    </section>
  );
}
