"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Lock, Target } from "lucide-react";
import { AnalysisNote } from "@/components/patient/journal/AnalysisNote";
import { EntryDetail } from "@/components/patient/journal/EntryDetail";
import { EmptyState, ErrorState, GlassCard, Skeleton } from "@/components/patient/ui/primitives";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useJournalEntries } from "@/hooks/patient/useJournal";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import type { JournalEntry } from "@/lib/api/patient-types";
import { fill } from "@/lib/i18n/patient";
import { formatDay, formatTime } from "@/lib/patient/format";
import { moodFor, type EmotionKey } from "@/lib/patient/moods";
import { MoodEmoji } from "@/components/patient/ui/MoodEmoji";
import { cn } from "@/lib/utils";

const RANGES = [7, 30, 90] as const;
const PAGE = 12;

/** Skeleton rows that mirror the real entry cards, shown while entries load. */
export function HistorySkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="space-y-3" aria-hidden>
      {Array.from({ length: rows }, (_, index) => (
        <li key={index} className="lm-glass flex gap-4 p-4">
          <Skeleton className="size-12 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-4/5" />
            <div className="flex gap-2 pt-1"><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-5 w-14 rounded-full" /></div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function JournalHistory() {
  const copy = usePatientCopy();
  const h = copy.journal.history;
  const { language } = useLanguage();
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  /** Pages of the API's list shown so far: "Show more" asks for the next one while `meta.totalPages` has more. */
  const [pages, setPages] = useState(1);
  const [open, setOpen] = useState<JournalEntry | null>(null);
  const first = useJournalEntries(days, 1, PAGE);
  const totalPages = first.data?.meta.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">{h.title}</h2>
        <div role="group" aria-label={h.title} className="segmented">
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              aria-pressed={days === range}
              onClick={() => {
                setDays(range);
                setPages(1);
              }}
              className="lm-tab"
            >
              {h.ranges[String(range) as "7" | "30" | "90"]}
            </button>
          ))}
        </div>
      </div>

      {first.error && !first.data ? (
        <ErrorState message={h.loadError} onRetry={() => void first.refresh()} />
      ) : !first.data ? (
        <HistorySkeleton />
      ) : first.data.data.length === 0 ? (
        <EmptyState icon={BookOpen} title={days === 30 ? h.empty : h.emptyFiltered} />
      ) : (
        <>
          <ul className="space-y-3">
            <EntryItems entries={first.data.data} language={language} onOpen={setOpen} />
            {Array.from({ length: pages - 1 }, (_, index) => (
              <HistoryPage key={index + 2} days={days} page={index + 2} language={language} onOpen={setOpen} />
            ))}
          </ul>
          {pages < totalPages && (
            <div className="flex justify-center"><Button variant="outline" onClick={() => setPages((value) => value + 1)}>{h.more}</Button></div>
          )}
        </>
      )}

      <EntryDetail entry={open} onClose={() => setOpen(null)} />
      <span className="sr-only">{fill(copy.common.days, { n: days })}</span>
    </div>
  );
}

type EntryListProps = { language: "en" | "ar"; onOpen: (entry: JournalEntry) => void };

function EntryItems({ entries, language, onOpen }: EntryListProps & { entries: JournalEntry[] }) {
  return entries.map((entry, index) => (
    <motion.li key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.35 }}>
      <EntryCard entry={entry} language={language} onOpen={() => onOpen(entry)} />
    </motion.li>
  ));
}

/** One more page of the list, loaded on demand (its own cache key, refreshed with the rest of the journal). */
function HistoryPage({ days, page, ...list }: EntryListProps & { days: number; page: number }) {
  const h = usePatientCopy().journal.history;
  const entries = useJournalEntries(days, page, PAGE);
  if (entries.error && !entries.data) {
    return <li><ErrorState message={h.loadError} onRetry={() => void entries.refresh()} /></li>;
  }
  if (!entries.data) return <li><HistorySkeleton rows={2} /></li>;
  return <EntryItems entries={entries.data.data} {...list} />;
}

function EntryCard({ entry, language, onOpen }: { entry: JournalEntry; language: "en" | "ar"; onOpen: () => void }) {
  const copy = usePatientCopy();
  const mood = moodFor(entry.moodScore);
  const preview = entry.title || entry.content;
  return (
    <GlassCard as="div" lift className="p-0">
      <button type="button" onClick={onOpen} className="flex w-full gap-4 rounded-[inherit] p-4 text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500">
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
          style={{ background: mood ? mood.soft : "rgb(227 238 239 / 0.7)" }}
          aria-hidden
        >
          {mood ? <MoodEmoji level={mood} className="text-2xl" /> : <BookOpen className="size-5 text-teal-700" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold text-ink">{formatDay(entry.createdAt, language, { weekday: "short", month: "short", day: "numeric" })}</span>
            <span className="text-xs text-muted-foreground">{formatTime(entry.createdAt, language)}</span>
          </span>
          <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-ink-soft" dir="auto">{preview}</span>
          <span className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {entry.emotions.slice(0, 3).map((emotion) => (
              <span key={emotion} className="chip">{copy.journal.emotions[emotion as EmotionKey] ?? emotion}</span>
            ))}
            {entry.goalScore !== null && <span className="chip chip-success"><Target className="size-3" aria-hidden />{fill(copy.journal.history.goal, { n: entry.goalScore })}</span>}
            {entry.isPrivate && <span className="chip chip-pending"><Lock className="size-3" aria-hidden />{copy.common.private}</span>}
            <span className={cn("ms-auto text-[0.6875rem] text-muted-foreground")}><AnalysisNote entry={entry} /></span>
          </span>
        </span>
      </button>
    </GlassCard>
  );
}
