"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Feather, Flame, LockKeyhole, PencilLine, Sparkles, Wind } from "lucide-react";
import { GlassCard, Skeleton } from "@/components/patient/ui/primitives";
import { Button } from "@/components/ui/button";
import { useJournalInsights } from "@/hooks/patient/useJournal";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { cn } from "@/lib/utils";

/**
 * The column beside today's page: what the patient has built so far, one gentle prompt for
 * today, a breathing moment before writing, and the promise of what happens to their words.
 */
export function JournalCompanion({ onUsePrompt }: { onUsePrompt: (prompt: string) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <WritingStats />
      <PromptOfTheDay onUse={onUsePrompt} />
      <BreathRitual />
      <JournalPromise />
    </div>
  );
}

function WritingStats() {
  const copy = usePatientCopy();
  const s = copy.journal.stats;
  const insights = useJournalInsights(30);
  const totals = insights.data?.totals;
  return (
    <GlassCard aria-label={s.title}>
      <p className="text-sm  text-ink">{s.title}</p>
      {!totals ? (
        <div className="mt-3 grid grid-cols-3 gap-2"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
      ) : totals.entries === 0 ? (
        <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-ink-soft"><Feather className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden />{s.first}</p>
      ) : (
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            { label: s.entries, value: totals.entries },
            { label: s.streak, value: totals.currentStreak, icon: <Flame className="size-4 text-gold-600" aria-hidden /> },
            { label: s.days, value: totals.activeDays },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white/70 px-2 py-3">
              <dd className="flex items-center justify-center gap-1 text-xl  tabular-nums text-ink">{stat.icon}{stat.value}</dd>
              <dt className="mt-0.5 text-[0.6875rem] leading-tight text-muted-foreground">{stat.label}</dt>
            </div>
          ))}
        </dl>
      )}
    </GlassCard>
  );
}

/** One prompt a day, the same all day, so it feels chosen rather than random. */
function PromptOfTheDay({ onUse }: { onUse: (prompt: string) => void }) {
  const copy = usePatientCopy();
  const p = copy.journal.prompt;
  const [prompt, setPrompt] = useState<string | null>(null);

  useEffect(() => {
    // Picked on the client so the server and the patient's local day agree.
    const start = new Date(new Date().getFullYear(), 0, 0).getTime();
    const day = Math.floor((Date.now() - start) / 86_400_000);
    const timer = window.setTimeout(() => setPrompt(p.list[day % p.list.length]), 0);
    return () => window.clearTimeout(timer);
  }, [p.list]);

  return (
    <section aria-label={p.title} className="lm-hero p-5">
      <p className="lm-eyebrow flex items-center gap-2"><Sparkles className="size-3.5" aria-hidden />{p.title}</p>
      <p className="mt-3 min-h-12 text-[1.0625rem] font-medium leading-snug text-ink" dir="auto">{prompt ?? " "}</p>
      <Button size="sm" variant="outline" className="mt-4" disabled={!prompt} onClick={() => prompt && onUse(prompt)}>
        <PencilLine aria-hidden />{p.use}
      </Button>
    </section>
  );
}

const BREATHS = 3;
const INHALE_MS = 4000;
const EXHALE_MS = 6000;

/** Three slow breaths before writing: in for four, out for six. */
function BreathRitual() {
  const copy = usePatientCopy();
  const r = copy.journal.ritual;
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<"idle" | "in" | "out" | "done">("idle");
  const [breath, setBreath] = useState(0);

  useEffect(() => {
    if (phase === "idle" || phase === "done") return;
    const timer = window.setTimeout(() => {
      if (phase === "in") setPhase("out");
      else if (breath + 1 >= BREATHS) setPhase("done");
      else {
        setBreath(breath + 1);
        setPhase("in");
      }
    }, phase === "in" ? INHALE_MS : EXHALE_MS);
    return () => window.clearTimeout(timer);
  }, [phase, breath]);

  const running = phase === "in" || phase === "out";
  const label = phase === "in" ? copy.home.exercise.inhale : phase === "out" ? copy.home.exercise.exhale : phase === "done" ? r.done : r.body;

  return (
    <GlassCard aria-label={r.title}>
      <div className="flex items-center gap-4">
        <div className="relative grid size-20 shrink-0 place-items-center">
          <motion.span
            className="lm-breath absolute inset-2"
            animate={reduce ? undefined : { scale: phase === "in" ? 1.18 : phase === "out" ? 0.82 : 1 }}
            transition={{ duration: (phase === "in" ? INHALE_MS : EXHALE_MS) / 1000, ease: "easeInOut" }}
          />
          <Wind className="relative size-5 text-teal-700" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm  text-ink">{r.title}</p>
          <AnimatePresence mode="wait">
            <motion.p key={label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-live="polite" className={cn("mt-0.5 text-sm leading-snug", running ? "font-medium text-teal-800" : "text-ink-soft")}>
              {label}{running && <span className="ms-1.5 text-xs text-ink-muted tabular-nums">{breath + 1}/{BREATHS}</span>}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
      {!running && (
        <Button size="sm" variant="ghost" className="mt-3" onClick={() => { setBreath(0); setPhase("in"); }}>
          <Wind aria-hidden />{phase === "done" ? r.again : r.start}
        </Button>
      )}
    </GlassCard>
  );
}

const PROMISE_ICONS = [LockKeyhole, Sparkles, PencilLine];

function JournalPromise() {
  const copy = usePatientCopy();
  const p = copy.journal.promise;
  return (
    <section aria-label={p.title} className="rounded-[var(--radius-card)] border border-white/70 bg-white/40 p-5">
      <p className="text-sm  text-ink">{p.title}</p>
      <ul className="mt-3 space-y-3">
        {p.items.map((text, index) => {
          const Icon = PROMISE_ICONS[index] ?? Sparkles;
          return (
            <li key={text} className="flex items-start gap-3 text-[0.8125rem] leading-relaxed text-ink-soft">
              <span className="stat-tile stat-tile-sage size-8 shrink-0"><Icon className="size-3.5" aria-hidden /></span>
              <span className="pt-1">{text}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
