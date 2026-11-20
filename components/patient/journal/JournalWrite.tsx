"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Flame, HeartHandshake, Lightbulb, RotateCcw, ShieldAlert, Sparkles, Wind } from "lucide-react";
import { AnalysisNote } from "@/components/patient/journal/AnalysisNote";
import { EMPTY_ENTRY, EntryForm, saveDraft, type EntryValues } from "@/components/patient/journal/EntryForm";
import { Skeleton } from "@/components/patient/ui/primitives";
import { Button } from "@/components/ui/button";
import type { JournalEntry } from "@/lib/api/patient-types";
import { useJournalActions, useJournalInsights } from "@/hooks/patient/useJournal";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { crisisBodyFor, fill } from "@/lib/i18n/patient";
import { journalLabels } from "@/lib/patient/journal-labels";
import { toFiveScale } from "@/lib/patient/moods";
import { EASE_OUT } from "@/lib/motion";
import { LogoSpinner } from "@/components/shared/LogoLoader";

/**
 * Today's entry: write on today's page, save, and see how it fits the picture being
 * building over time. `insert` carries a prompt chosen in the companion column.
 */
export function JournalWrite({ onOpenInsights, insert }: { onOpenInsights: () => void; insert?: { text: string; nonce: number } }) {
  const copy = usePatientCopy();
  const { create, isSaving } = useJournalActions();
  const [saved, setSaved] = useState<JournalEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  async function submit(values: EntryValues) {
    setError(null);
    try {
      const entry = await create({
        content: values.content,
        entryType: "DAILY",
        ...(values.moodScore !== null ? { moodScore: values.moodScore } : {}),
        ...(values.goalScore !== null ? { goalScore: values.goalScore } : {}),
        ...(values.emotions.length ? { emotions: values.emotions } : {}),
        isPrivate: values.isPrivate,
      });
      saveDraft("");
      setSaved(entry);
      setFormKey((key) => key + 1);
    } catch {
      setError(copy.journal.saveError);
    }
  }

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {saved && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE_OUT }}>
            <SavedResult key={saved.id} entry={saved} onDismiss={() => setSaved(null)} onOpenInsights={onOpenInsights} />
          </motion.div>
        )}
      </AnimatePresence>
      <EntryForm key={formKey} variant="page" insert={insert} initial={EMPTY_ENTRY} persistDraft submitLabel={copy.journal.save} isSaving={isSaving} error={error} onSubmit={submit} />
    </div>
  );
}

/**
 * The result of a save, in three honest steps: what the patient gave, what was read from it,
 * and how it sits inside the longer picture. Nothing here names a clinical category.
 */
function SavedResult({ entry, onDismiss, onOpenInsights }: { entry: JournalEntry; onDismiss: () => void; onOpenInsights: () => void }) {
  const copy = usePatientCopy();
  const j = copy.journal;
  const { retryAnalysis } = useJournalActions();
  const insights = useJournalInsights(30);
  const [current, setCurrent] = useState(entry);
  const [retrying, setRetrying] = useState(false);
  const crisis = current.support?.level === "CRISIS";
  const heavy = Boolean(current.analysis?.heavy) || current.support?.level === "ELEVATED";
  const noticed = current.analysis?.current ? journalLabels(current.analysis, copy).slice(0, 5) : [];
  const totals = insights.data?.totals;
  // The same entry always gets the same line.
  const affirm = j.affirm[[...entry.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % j.affirm.length];

  async function retry() {
    setRetrying(true);
    try {
      setCurrent(await retryAnalysis(current.id));
    } catch {
      /* the note keeps offering the retry */
    } finally {
      setRetrying(false);
    }
  }

  return (
    <section aria-label={j.saved} className="overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-br from-white/90 via-sage-50/80 to-teal-50/80 shadow-[var(--shadow-soft)]" role="status">
      <div className="flex items-start gap-3 p-5">
        <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} className="stat-tile stat-tile-sage size-12 shrink-0"><Check className="size-5" aria-hidden /></motion.span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-ink">{affirm}</p>
          <p className="text-xs text-ink-muted">{j.saved}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
            {current.analysisStatus === "PENDING" ? <LogoSpinner size={14} /> : <Sparkles className="size-3.5 text-teal-600" aria-hidden />}
            <AnalysisNote entry={current} />
          </p>
          {current.analysisStatus === "FAILED" && (
            <Button size="sm" variant="outline" className="mt-3" onClick={() => void retry()} disabled={retrying}>
              <RotateCcw aria-hidden />{j.analysis.retry}
            </Button>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={onDismiss}>{copy.common.close}</Button>
      </div>

      {crisis ? (
        <div role="alert" className="mx-5 mb-5 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">{j.crisis.title}</p>
            <p className="mt-0.5">{crisisBodyFor(j.crisis, current.support?.emergencyResources)}</p>
            {current.support?.emergencyResources?.length ? (
              <ul className="mt-1.5 list-inside list-disc" dir="auto">{current.support.emergencyResources.map((item) => <li key={item}>{item}</li>)}</ul>
            ) : null}
            <p className="mt-3 font-semibold">{j.crisis.stepsTitle}</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">{j.crisis.steps.map((step) => <li key={step}>{step}</li>)}</ul>
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-semibold">
              <a href={j.crisis.helplineUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{j.crisis.helpline}</a>
              <Link href="/support" className="underline underline-offset-2">{j.crisis.careTeam}</Link>
            </p>
          </div>
        </div>
      ) : heavy ? (
        <div className="mx-5 mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold-100 bg-gold-50/90 px-4 py-3.5">
          <div className="flex min-w-0 items-start gap-3">
            <HeartHandshake className="mt-0.5 size-5 shrink-0 text-gold-700" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-ink">{j.heavy.title}</p>
              <p className="mt-0.5 text-sm text-ink-soft">{j.heavy.body}</p>
            </div>
          </div>
          <Button asChild size="sm"><Link href="/dashboard"><Wind aria-hidden />{j.heavy.cta}</Link></Button>
        </div>
      ) : null}

      {noticed.length > 0 && !crisis && (
        <div className="mx-5 mb-5">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-teal-800"><Lightbulb className="size-3.5" aria-hidden />{j.result.noticed}</p>
          <ul className="flex flex-wrap gap-2">
            {noticed.map((label) => <li key={label} className="chip" dir="auto">{label}</li>)}
          </ul>
        </div>
      )}

      <div className="border-t border-white/80 bg-white/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink">{j.result.title}</p>
          <Button size="sm" variant="ghost" onClick={onOpenInsights}>{j.result.openInsights}<ArrowRight className="rtl:-scale-x-100" aria-hidden /></Button>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{j.result.perDay}</p>
        {insights.isLoading || !totals ? (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label={j.result.entries} value={String(totals.entries)} />
              <Stat label={j.result.streak} value={String(totals.currentStreak)} icon={<Flame className="size-4 text-gold-600" aria-hidden />} />
              <Stat label={j.result.mood} value={insights.data?.mood.average !== null && insights.data?.mood.average !== undefined ? `${toFiveScale(insights.data.mood.average)}/5` : "—"} />
              <Stat label={j.result.goals} value={insights.data?.goals.average !== null && insights.data?.goals.average !== undefined ? `${insights.data.goals.average}` : "—"} />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-teal-800">
              {insights.data?.confidence === "ESTABLISHED" ? fill(j.insights.confidence.ESTABLISHED, { n: totals.activeDays }) : insights.data ? j.insights.confidence[insights.data.confidence] : ""}
            </p>
          </>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/75 px-3 py-3">
      <p className="flex items-center gap-1 text-xl font-semibold tabular-nums text-ink">{icon}{value}</p>
      <p className="mt-0.5 text-[0.6875rem] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}
