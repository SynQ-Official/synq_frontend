"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, BookOpen, Check, Flame, HeartPulse, Info, Lock, Moon, PencilLine, Plus, Sparkles, Target,
  TrendingUp, Trash2, Zap,
} from "lucide-react";
import { LuminaLogo } from "@/components/patient/ui/LuminaLogo";
import { ErrorState, Skeleton } from "@/components/patient/ui/primitives";
import { MoodPicker } from "@/components/patient/ui/MoodPicker";
import { MoodEmoji } from "@/components/patient/ui/MoodEmoji";
import { ScaleSlider } from "@/components/patient/ui/ScaleSlider";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import type { CheckinInput } from "@/lib/api/patient";
import type { Checkin, CheckinGoal, GoalStatus } from "@/lib/api/patient-types";
import { useCheckinHistory, useSetGoalStatus, useSubmitCheckin, useTodayCheckin } from "@/hooks/patient/useCheckin";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import { fill } from "@/lib/i18n/patient";
import { moodForLevel, type MoodLevel } from "@/lib/patient/moods";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { LogoSpinner } from "@/components/shared/LogoLoader";

type StepKey = "mood" | "energy" | "focus" | "sleep" | "goals";
type Answers = { mood?: number; energy?: number; focus?: number; sleepHours?: number };

/** The questions in the order they are asked. Goals are the only optional one. */
const STEPS: { key: StepKey; required: boolean }[] = [
  { key: "mood", required: true },
  { key: "energy", required: true },
  { key: "focus", required: true },
  { key: "sleep", required: true },
  { key: "goals", required: false },
];

const MAX_GOALS = 3;
const GOAL_MAX_LENGTH = 120;

const STEP_ICON: Record<StepKey, typeof Zap> = { mood: HeartPulse, energy: Zap, focus: Target, sleep: Moon, goals: Check };

const VALUE_ICONS = [TrendingUp, Sparkles, Lock];

const GOAL_STATUSES: Exclude<GoalStatus, "PENDING">[] = ["COMPLETED", "PARTIAL", "MISSED"];

function seedFrom(checkin: Checkin | null): { answers: Answers; touched: Set<StepKey>; goals: string[] } {
  if (!checkin) return { answers: {}, touched: new Set(), goals: [] };
  return {
    answers: { mood: checkin.mood, energy: checkin.energy, focus: checkin.focus, sleepHours: checkin.sleepHours },
    touched: new Set<StepKey>(["mood", "energy", "focus", "sleep"]),
    goals: checkin.goals.map((goal) => goal.title),
  };
}

/** Goals can be replaced only while none of them has been resolved during the day. */
const goalsLocked = (checkin: Checkin | null) => Boolean(checkin?.goals.some((goal) => goal.status !== "PENDING"));

/**
 * The daily check-in: one calm question at a time — mood, energy and focus (1–5), last night's sleep,
 * and up to three goals for the day. The mood the patient picks re-colours the whole space (the
 * stage's light and the brand ramp inside it), and they can change it at any point.
 */
export function CheckinFlow() {
  const today = useTodayCheckin();

  if (today.error && today.data === undefined) return <ErrorState onRetry={() => void today.refresh()} />;
  if (today.data === undefined) return <CheckinSkeleton />;

  // Remounted per saved check-in so a stale answer set never leaks across days.
  return <CheckinStepper key={today.data?.id ?? "new"} saved={today.data} />;
}

function CheckinSkeleton() {
  return (
    <div className="lm-mood-stage grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-5"><Skeleton className="h-3 w-full" /><Skeleton className="h-16 w-2/3" /><Skeleton className="h-36" /><Skeleton className="h-11 w-40" /></div>
      <div className="hidden space-y-4 lg:block"><Skeleton className="h-24" /><Skeleton className="h-48" /></div>
    </div>
  );
}

/** The light and colours of the chosen mood, around everything the check-in shows. */
function MoodStage({ mood, children, className }: { mood: MoodLevel | null; children: ReactNode; className?: string }) {
  return (
    <div data-mood={mood?.level ?? 3} className={cn("lm-mood-stage", className)}>
      {children}
    </div>
  );
}

function CheckinStepper({ saved }: { saved: Checkin | null }) {
  const copy = usePatientCopy();
  const { direction } = useLanguage();
  const reduce = useReducedMotion();
  const { submit, isSubmitting, error, clearError } = useSubmitCheckin();

  const seed = useMemo(() => seedFrom(saved), [saved]);
  const [answers, setAnswers] = useState<Answers>(seed.answers);
  const [touched, setTouched] = useState<Set<StepKey>>(seed.touched);
  const [goals, setGoals] = useState<string[]>(seed.goals);
  const [index, setIndex] = useState(0);
  const [heading, setHeading] = useState(1); // 1 = moving forward, -1 = back
  const [result, setResult] = useState<Checkin | null>(null);
  const [editing, setEditing] = useState(false);
  const [started, setStarted] = useState(false);

  const item = STEPS[index];
  const last = index === STEPS.length - 1;
  const sign = direction === "rtl" ? -1 : 1;
  const mood = moodForLevel(answers.mood);
  const locked = goalsLocked(saved);

  if (saved && !editing && !result) return <AlreadyDone checkin={saved} onEdit={() => { setEditing(true); setStarted(true); }} />;
  if (result) return <CheckinResultView checkin={result} />;
  if (!started) return <StartCard onBegin={() => setStarted(true)} />;

  const answered = item.key === "goals" ? goals.some((title) => title.trim()) : touched.has(item.key);
  const ready = answers.mood !== undefined && answers.energy !== undefined && answers.focus !== undefined && answers.sleepHours !== undefined;

  function set(key: StepKey, patch: Partial<Answers>) {
    clearError();
    setAnswers((current) => ({ ...current, ...patch }));
    setTouched((current) => new Set(current).add(key));
  }

  async function finish() {
    if (!ready) return;
    const titles = goals.map((title) => title.trim()).filter(Boolean).slice(0, MAX_GOALS);
    const payload: CheckinInput = {
      mood: answers.mood as number,
      energy: answers.energy as number,
      focus: answers.focus as number,
      sleepHours: answers.sleepHours as number,
      // Goals already being resolved are left alone: the backend refuses to replace them (409).
      ...(locked ? {} : { goals: titles.map((title) => ({ title })) }),
    };
    const done = await submit(payload);
    if (done) setResult(done);
  }

  function go(step: number) {
    setHeading(step > index ? 1 : -1);
    setIndex(Math.max(0, Math.min(STEPS.length - 1, step)));
  }

  const q = copy.checkin.q[item.key];
  const progress = ((index + (answered ? 1 : 0)) / STEPS.length) * 100;
  const missingRequired = !ready;

  return (
    <MoodStage mood={mood} className="grid lg:grid-cols-[minmax(0,1fr)_21rem]">
      <section aria-label={copy.checkin.title} className="flex min-w-0 flex-col p-5 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-ink-muted" aria-live="polite">{fill(copy.checkin.step, { a: index + 1, b: STEPS.length })}</p>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-ink/10 sm:w-56" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
            <motion.div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-700 rtl:bg-gradient-to-l" animate={{ width: `${progress}%` }} transition={{ duration: reduce ? 0 : 0.5, ease: EASE_OUT }} />
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false} custom={heading}>
          <motion.div
            key={item.key}
            custom={heading}
            initial={{ opacity: 0, x: reduce ? 0 : 28 * heading * sign }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduce ? 0 : -28 * heading * sign }}
            transition={{ duration: reduce ? 0 : 0.28, ease: EASE_OUT }}
            className="flex-1"
          >
            <span className="stat-tile mb-4 size-11">{(() => { const Icon = STEP_ICON[item.key]; return <Icon className="size-5" aria-hidden />; })()}</span>
            <h2 className="text-[clamp(1.375rem,1.1rem+1vw,1.875rem)] font-semibold leading-snug tracking-tight text-ink">{q.title}</h2>
            {item.key === "mood" && <p className="mt-1.5 text-sm text-ink-soft">{copy.checkin.companion.pickMood}</p>}

            <div className="mt-7">
              {item.key === "mood" && (
                <>
                  <MoodPicker
                    value={answers.mood !== undefined ? answers.mood * 2 : null}
                    onChange={(score) => set("mood", { mood: score / 2 })}
                    labels={copy.checkin.moods}
                    ariaLabel={q.title}
                  />
                  <AnimatePresence mode="wait">
                    {mood && (
                      <motion.p
                        key={mood.level}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-teal-700 rtl:tracking-normal"
                      >
                        {copy.moods.levels[mood.level - 1].tone}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </>
              )}
              {item.key === "sleep" && (
                <ScaleSlider
                  value={answers.sleepHours ?? 7}
                  onChange={(value) => set("sleep", { sleepHours: value })}
                  min={0}
                  max={24}
                  step={0.5}
                  ariaLabel={q.title}
                  format={(value) => `${value}${copy.checkin.q.sleep.unit}`}
                />
              )}
              {(item.key === "energy" || item.key === "focus") && (
                <ScaleSlider
                  value={answers[item.key] ?? 3}
                  onChange={(value) => set(item.key, { [item.key]: value })}
                  min={1}
                  max={5}
                  ariaLabel={q.title}
                  format={(value) => `${value}/5`}
                  lowLabel={copy.checkin.q[item.key].low}
                  highLabel={copy.checkin.q[item.key].high}
                />
              )}
              {item.key === "goals" && <GoalInputs goals={goals} onChange={(next) => { clearError(); setGoals(next); }} locked={locked} />}
              {item.key === "sleep" && <p className="mt-3 text-center text-xs text-muted-foreground">{copy.checkin.q.sleep.hint}</p>}
            </div>

            <p className="mt-7 flex items-start gap-2 rounded-xl bg-white/60 px-3.5 py-2.5 text-xs leading-relaxed text-teal-800">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span><span className="font-semibold">{copy.checkin.why}: </span>{q.why}</span>
            </p>
          </motion.div>
        </AnimatePresence>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
            {error instanceof ApiError && error.code === "GOALS_ALREADY_TRACKED" ? copy.checkin.goalsTracked : copy.checkin.error}
          </p>
        )}

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => go(index - 1)} disabled={index === 0 || isSubmitting}>
            <ArrowLeft className="rtl:-scale-x-100" aria-hidden />{copy.checkin.back}
          </Button>
          <div className="flex items-center gap-2">
            {!item.required && !answered && !last && (
              <Button variant="ghost" onClick={() => go(index + 1)}>{copy.checkin.skip}</Button>
            )}
            {last ? (
              <Button size="lg" onClick={() => void finish()} disabled={isSubmitting || missingRequired}>
                {isSubmitting ? <LogoSpinner size={18} /> : <Check aria-hidden />}
                {isSubmitting ? copy.checkin.saving : copy.checkin.finish}
              </Button>
            ) : (
              <Button size="lg" onClick={() => go(index + 1)} disabled={!answered}>
                {copy.checkin.next}<ArrowRight className="rtl:-scale-x-100" aria-hidden />
              </Button>
            )}
          </div>
        </div>
        {last && missingRequired && <p className="mt-3 text-end text-xs text-muted-foreground">{copy.checkin.answerFirst}</p>}
      </section>

      <CompanionPanel mood={mood}>
        <ol className="space-y-1.5" aria-label={copy.checkin.companion.path}>
          {STEPS.map((entry, position) => {
            const Icon = STEP_ICON[entry.key];
            const done = entry.key === "goals" ? goals.some((title) => title.trim()) : touched.has(entry.key);
            const current = position === index;
            const reachable = done || position <= index;
            return (
              <li key={entry.key}>
                <button
                  type="button"
                  onClick={() => reachable && go(position)}
                  disabled={!reachable}
                  aria-current={current ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-start text-sm transition-colors focus-visible:outline-2 focus-visible:outline-teal-500 disabled:cursor-default",
                    current ? "bg-white/85 shadow-xs" : reachable && "hover:bg-white/50",
                  )}
                >
                  <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full border", done ? "border-teal-200 bg-teal-100 text-teal-700" : current ? "border-transparent bg-teal-600 text-white" : "border-line-strong bg-white/60 text-ink-subtle")}>
                    {done && !current ? <Check className="size-3.5" aria-hidden /> : <Icon className="size-3.5" aria-hidden />}
                  </span>
                  <span className={cn("min-w-0 flex-1 truncate", current ? "font-semibold text-ink" : "text-ink-soft")}>{copy.checkin.steps[entry.key]}</span>
                  <span className="shrink-0 text-xs tabular-nums text-ink-muted">
                    {done ? answerText(entry.key, answers, goals, copy) : current ? "" : copy.checkin.companion.upcoming}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </CompanionPanel>
    </MoodStage>
  );
}

function answerText(key: StepKey, answers: Answers, goals: string[], copy: ReturnType<typeof usePatientCopy>): string {
  switch (key) {
    case "mood": return moodForLevel(answers.mood)?.emoji ?? "";
    case "sleep": return answers.sleepHours === undefined ? "" : `${answers.sleepHours}${copy.checkin.q.sleep.unit}`;
    case "goals": return String(goals.filter((title) => title.trim()).length);
    default: return answers[key] === undefined ? "" : `${answers[key]}/5`;
  }
}

/** Up to three short goals for the day. Each is a plain line of text. */
function GoalInputs({ goals, onChange, locked }: { goals: string[]; onChange: (next: string[]) => void; locked: boolean }) {
  const copy = usePatientCopy();
  const g = copy.checkin.q.goals;
  const rows = goals.length ? goals : [""];

  if (locked) {
    return <p className="rounded-xl bg-white/60 px-3.5 py-3 text-sm text-ink-soft">{copy.checkin.goalsTracked}</p>;
  }

  return (
    <div className="space-y-2.5">
      {rows.map((title, position) => (
        <div key={position} className="flex items-center gap-2">
          <input
            value={title}
            onChange={(event) => onChange(rows.map((row, at) => (at === position ? event.target.value : row)))}
            placeholder={g.placeholder}
            aria-label={fill(g.label, { n: position + 1 })}
            maxLength={GOAL_MAX_LENGTH}
            dir="auto"
            className="min-h-11 min-w-0 flex-1 rounded-2xl border border-white/80 bg-white/75 px-4 text-sm text-ink outline-none placeholder:text-muted-foreground focus:border-teal-400"
          />
          {rows.length > 1 && (
            <Button type="button" variant="ghost" size="icon" aria-label={g.remove} onClick={() => onChange(rows.filter((_, at) => at !== position))}>
              <Trash2 aria-hidden />
            </Button>
          )}
        </div>
      ))}
      {rows.length < MAX_GOALS && (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rows, ""])}>
          <Plus aria-hidden />{g.add}
        </Button>
      )}
      <p className="text-xs text-muted-foreground">{fill(g.hint, { n: MAX_GOALS })}</p>
    </div>
  );
}

/**
 * The side of the check-in: a line that follows the mood they chose, the path through today's
 * questions, and why the minute is worth it.
 */
function CompanionPanel({ mood, children }: { mood: MoodLevel | null; children?: ReactNode }) {
  const copy = usePatientCopy();
  const history = useCheckinHistory(30);
  const c = copy.checkin.companion;
  const intro = history.data && history.data.length === 0 ? "FIRST_CHECKIN" : history.streak >= 2 ? "STREAK" : "DEFAULT";
  const line = mood ? copy.moods.levels[mood.level - 1].note : fill(copy.checkin.intro[intro], { n: history.streak });
  return (
    <aside aria-label={c.title} className="flex flex-col gap-5 border-t border-white/70 bg-white/35 p-5 sm:p-6 lg:border-s lg:border-t-0">
      <div className="flex items-center gap-3">
        <LuminaLogo size={44} presence />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{c.title}</p>
          {mood && <p className="text-xs text-ink-muted">{copy.moods.label}: <MoodEmoji level={mood} className="align-[-0.15em] text-base" /> {copy.moods.levels[mood.level - 1].name}</p>}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.p key={line} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="lm-bubble-lumina px-4 py-3 text-sm leading-relaxed text-ink" dir="auto">
          {line}
        </motion.p>
      </AnimatePresence>
      {children && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted rtl:tracking-normal">{c.path}</p>
          {children}
        </div>
      )}
      <div className="mt-auto">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted rtl:tracking-normal">{c.valueTitle}</p>
        <ul className="space-y-2">
          {c.value.map((text, index) => {
            const Icon = VALUE_ICONS[index] ?? Sparkles;
            return (
              <li key={text} className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-soft">
                <Icon className="mt-0.5 size-3.5 shrink-0 text-teal-600" aria-hidden />{text}
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

/** Before the first question: what today's check-in covers, how long it takes and why it is worth doing. */
function StartCard({ onBegin }: { onBegin: () => void }) {
  const copy = usePatientCopy();
  const history = useCheckinHistory(30);
  const s = copy.checkin.start;
  return (
    <MoodStage mood={null} className="grid lg:grid-cols-[minmax(0,1fr)_21rem]">
      <section className="flex flex-col gap-7 p-6 sm:p-10" aria-labelledby="checkin-start-title">
        <LuminaLogo size={84} presence float glow />
        <div>
          <h2 id="checkin-start-title" className="text-[clamp(1.625rem,1.2rem+1.4vw,2.25rem)] font-semibold leading-tight tracking-tight text-ink">{s.title}</h2>
          <p className="mt-2 text-sm font-medium text-teal-800">{fill(s.duration, { n: STEPS.length })}</p>
        </div>

        <div>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted rtl:tracking-normal">{s.covers}</p>
          <ul className="flex flex-wrap gap-2">
            {STEPS.map((entry, position) => {
              const Icon = STEP_ICON[entry.key];
              return (
                <motion.li
                  key={entry.key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + position * 0.05 }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-3.5 py-2 text-sm font-medium text-ink shadow-xs"
                >
                  <Icon className="size-4 text-teal-700" aria-hidden />
                  {copy.checkin.steps[entry.key]}
                </motion.li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={onBegin}>{s.begin}<ArrowRight className="rtl:-scale-x-100" aria-hidden /></Button>
          {history.streak >= 2 && <span className="chip chip-pending"><Flame className="size-3" aria-hidden />{fill(s.streak, { n: history.streak })}</span>}
        </div>
      </section>
      <CompanionPanel mood={null} />
    </MoodStage>
  );
}

/** Today's goals, each resolved with one tap (done / partly / not today). */
export function GoalList({ goals, className }: { goals: CheckinGoal[]; className?: string }) {
  const copy = usePatientCopy();
  const { setStatus, pendingGoalId, error } = useSetGoalStatus();
  const labels = copy.checkin.goalStatus;

  return (
    <div className={className}>
      <ul className="space-y-2.5">
        {goals.map((goal) => (
          <li key={goal.id} className="lm-inset px-3.5 py-3">
            <p className="text-sm font-medium text-ink" dir="auto">{goal.title}</p>
            <div role="group" aria-label={goal.title} className="mt-2.5 flex flex-wrap gap-1.5">
              {GOAL_STATUSES.map((status) => {
                const active = goal.status === status;
                return (
                  <motion.button
                    key={status}
                    type="button"
                    aria-pressed={active}
                    disabled={pendingGoalId === goal.id}
                    onClick={() => void setStatus(goal.id, active ? "PENDING" : status)}
                    // A small pop rewards the choice; the press gives way under the finger (MotionConfig stills both under reduced motion).
                    initial={false}
                    animate={active ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                    transition={{ duration: 0.35, ease: EASE_OUT }}
                    whileTap={{ scale: 0.94 }}
                    className={cn(
                      "inline-flex min-h-9 items-center rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:opacity-60",
                      active
                        ? status === "COMPLETED" ? "border-transparent bg-sage-100 text-sage-700" : status === "PARTIAL" ? "border-transparent bg-gold-100 text-gold-700" : "border-transparent bg-rose-50 text-rose-700"
                        : "border-white/80 bg-white/70 text-ink-soft hover:bg-white",
                    )}
                  >
                    {active && status === "COMPLETED" && <Check className="-ms-0.5 me-1 size-3.5" aria-hidden />}
                    {labels[status]}
                  </motion.button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="mt-2 text-xs text-rose-700">{copy.checkin.error}</p>}
    </div>
  );
}

/** Already checked in: today's values, the goals (resolved as the day goes) and the way to update. */
function AlreadyDone({ checkin, onEdit }: { checkin: Checkin; onEdit: () => void }) {
  const copy = usePatientCopy();
  const mood = moodForLevel(checkin.mood);

  return (
    <MoodStage mood={mood} className="grid lg:grid-cols-[minmax(0,1fr)_21rem]">
      <section className="flex flex-col gap-6 p-6 sm:p-10">
        <div className="flex items-start gap-4">
          <span className="stat-tile stat-tile-sage size-12 shrink-0"><Check className="size-5" aria-hidden /></span>
          <div>
            <h2 className="text-2xl font-semibold leading-tight text-ink">{copy.checkin.alreadyTitle}</h2>
            <p className="mt-1 text-sm text-ink-soft">{copy.checkin.alreadyBody}</p>
          </div>
        </div>

        <Snapshot checkin={checkin} />

        {checkin.goals.length > 0 && (
          <div>
            <p className="mb-3 text-sm font-semibold text-ink">{copy.checkin.goalsToday}</p>
            <GoalList goals={checkin.goals} />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button asChild><Link href="/dashboard/journal"><BookOpen aria-hidden />{copy.checkin.result.journal}</Link></Button>
          <Button variant="outline" onClick={onEdit}><PencilLine aria-hidden />{copy.checkin.edit}</Button>
        </div>
      </section>
      <CompanionPanel mood={mood} />
    </MoodStage>
  );
}

/** The four numbers of a check-in as quiet chips. */
function Snapshot({ checkin }: { checkin: Checkin }) {
  const copy = usePatientCopy();
  const mood = moodForLevel(checkin.mood);
  return (
    <div className="flex flex-wrap gap-2">
      <span className="chip">{copy.dimensions.mood}: {mood && <MoodEmoji level={mood} className="align-[-0.15em] text-base" />} {checkin.mood}/5</span>
      <span className="chip">{copy.dimensions.energy}: {checkin.energy}/5</span>
      <span className="chip">{copy.dimensions.focus}: {checkin.focus}/5</span>
      <span className="chip">{copy.dimensions.sleep}: {checkin.sleepHours}{copy.checkin.q.sleep.unit}</span>
    </div>
  );
}

function CheckinResultView({ checkin }: { checkin: Checkin }) {
  const copy = usePatientCopy();
  const history = useCheckinHistory(30);
  const mood = moodForLevel(checkin.mood);
  const streak = Math.max(history.streak, 1);

  return (
    <MoodStage mood={mood} className="grid lg:grid-cols-[minmax(0,1fr)_21rem]">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE_OUT }} className="flex flex-col gap-6 p-6 sm:p-10">
        <div className="flex flex-col items-start gap-3">
          {mood && <MoodEmoji level={mood} className="text-[4.5rem]" />}
          <h2 className="text-[clamp(1.625rem,1.2rem+1.4vw,2.25rem)] font-semibold leading-tight tracking-tight text-ink">{copy.checkin.result.title}</h2>
          <p className="text-sm text-ink-soft">{copy.checkin.result.saved}</p>
          {streak >= 2 && <span className="chip chip-pending"><Flame className="size-3" aria-hidden />{fill(copy.checkin.result.streak, { n: streak })}</span>}
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-ink">{copy.checkin.result.snapshot}</p>
          <Snapshot checkin={checkin} />
        </div>

        {checkin.goals.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-semibold text-ink">{copy.checkin.goalsToday}</p>
            <p className="mb-3 text-xs text-muted-foreground">{copy.checkin.goalsLater}</p>
            <GoalList goals={checkin.goals} />
          </div>
        )}

        <div className="flex flex-wrap gap-2.5">
          <Button asChild size="lg"><Link href="/dashboard/journal"><BookOpen aria-hidden />{copy.checkin.result.journal}</Link></Button>
          <Button asChild size="lg" variant="ghost"><Link href="/dashboard">{copy.checkin.result.home}</Link></Button>
        </div>
      </motion.section>
      <CompanionPanel mood={mood} />
    </MoodStage>
  );
}
