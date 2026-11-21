"use client";

import { useRef, useState } from "react";
import { NotebookPen, Pencil, RotateCcw, Share2, Target, Trash2, X } from "lucide-react";
import { AnalysisNote } from "@/components/patient/journal/AnalysisNote";
import { EntryForm, type EntryValues } from "@/components/patient/journal/EntryForm";
import { PatientModal } from "@/components/patient/ui/PatientModal";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useJournalActions } from "@/hooks/patient/useJournal";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { journalApi } from "@/lib/api/patient";
import type { JournalEntry } from "@/lib/api/patient-types";
import { fill } from "@/lib/i18n/patient";
import { formatDay } from "@/lib/patient/format";
import { moodFor, type EmotionKey } from "@/lib/patient/moods";
import { MoodEmoji } from "@/components/patient/ui/MoodEmoji";
import { invalidatePatientData, usePatientResource } from "@/hooks/usePatientResource";

/** One entry in full: read, edit, delete, retry the read, or share a passage with the care team. */
export function EntryDetail({ entry, onClose }: { entry: JournalEntry | null; onClose: () => void }) {
  const copy = usePatientCopy();
  return (
    <PatientModal open={Boolean(entry)} onOpenChange={(value) => !value && onClose()} title={copy.journal.history.untitled} hideTitle size="lg">
      {entry && <EntryBody key={entry.id} entry={entry} onClose={onClose} />}
    </PatientModal>
  );
}

function EntryBody({ entry, onClose }: { entry: JournalEntry; onClose: () => void }) {
  const copy = usePatientCopy();
  const h = copy.journal.history;
  const { language } = useLanguage();
  const { update, remove, retryAnalysis, isSaving } = useJournalActions();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  // The list omits shared passages; the full entry has them.
  const detail = usePatientResource<JournalEntry>(`journal:detail:${entry.id}`, (signal) => journalApi.get(entry.id, signal), { staleMs: 0 });
  const [localExcerpts, setLocalExcerpts] = useState<NonNullable<JournalEntry["excerpts"]> | null>(null);
  const excerpts = localExcerpts ?? detail.data?.excerpts ?? [];
  const textRef = useRef<HTMLParagraphElement>(null);
  const mood = moodFor(entry.moodScore);

  async function save(values: EntryValues) {
    try {
      await update(entry.id, {
        content: values.content,
        moodScore: values.moodScore ?? undefined,
        goalScore: values.goalScore ?? undefined,
        emotions: values.emotions,
        isPrivate: values.isPrivate,
      });
      setMode("view");
      onClose();
    } catch {
      setMessage({ tone: "error", text: copy.journal.saveError });
    }
  }

  async function share() {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";
    if (!text || !textRef.current || !selection?.anchorNode || !textRef.current.contains(selection.anchorNode)) {
      setMessage({ tone: "error", text: h.shareNone });
      return;
    }
    try {
      const shared = await journalApi.shareExcerpt(entry.id, text);
      setLocalExcerpts([...excerpts, shared]);
      setMessage({ tone: "ok", text: h.shareDone });
    } catch {
      setMessage({ tone: "error", text: h.shareError });
    }
  }

  async function unshare(id: string) {
    await journalApi.unshareExcerpt(id).catch(() => undefined);
    setLocalExcerpts(excerpts.filter((item) => item.id !== id));
    invalidatePatientData("journal");
  }

  if (mode === "edit") {
    return (
      <div className="mt-2">
        <h2 className="mb-5 pe-10 text-lg  text-ink">{h.edit}</h2>
        <EntryForm
          initial={{
            content: entry.content,
            moodScore: entry.moodScore,
            goalScore: entry.goalScore,
            emotions: entry.emotions as EmotionKey[],
            isPrivate: entry.isPrivate,
          }}
          submitLabel={copy.common.save}
          isSaving={isSaving}
          error={message?.tone === "error" ? message.text : null}
          onSubmit={save}
          onCancel={() => setMode("view")}
        />
      </div>
    );
  }

  return (
    <div className="mt-1">
      <div className="flex items-center gap-3 pe-10">
        <span className="flex size-12 items-center justify-center rounded-2xl text-2xl" style={{ background: mood?.soft ?? "#e3eeef" }} aria-hidden>{mood ? <MoodEmoji level={mood} className="text-3xl" /> : <NotebookPen className="size-5 text-teal-700" />}</span>
        <div>
          <h2 className="text-lg  text-ink">{formatDay(entry.createdAt, language, { weekday: "long", month: "long", day: "numeric" })}</h2>
          <p className="text-xs text-muted-foreground"><AnalysisNote entry={entry} /></p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {entry.emotions.map((emotion) => <span key={emotion} className="chip">{copy.journal.emotions[emotion as EmotionKey] ?? emotion}</span>)}
        {entry.goalScore !== null && <span className="chip chip-success"><Target className="size-3" aria-hidden />{fill(h.goal, { n: entry.goalScore })}</span>}
      </div>

      <p ref={textRef} className="mt-5 select-text whitespace-pre-wrap rounded-2xl bg-white/70 p-4 text-[0.9375rem] leading-relaxed text-ink" dir="auto">{entry.content}</p>

      {!entry.isPrivate && (
        <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
          <p className="text-sm  text-ink">{h.shareTitle}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{h.shareHint}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => void share()}><Share2 aria-hidden />{h.share}</Button>
          {excerpts.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-xs  text-teal-800">{h.shared}</p>
              <ul className="space-y-1.5">
                {excerpts.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-2 rounded-xl bg-white/80 px-3 py-2 text-sm text-ink-soft">
                    <span className="min-w-0 line-clamp-3" dir="auto">{item.content}</span>
                    <button type="button" onClick={() => void unshare(item.id)} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-rose-700 hover:underline"><X className="size-3" aria-hidden />{h.unshare}</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {message && <p role="status" className={`mt-4 rounded-xl px-4 py-2.5 text-sm ${message.tone === "ok" ? "bg-sage-50 text-sage-700" : "bg-rose-50 text-rose-700"}`}>{message.text}</p>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        {confirming ? (
          <div className="flex flex-wrap items-center gap-2" role="alertdialog" aria-label={h.confirmDelete}>
            <span className="text-sm text-rose-700">{h.confirmDelete}</span>
            <Button size="sm" variant="destructive" onClick={() => void remove(entry.id).then(onClose)}>{copy.common.delete}</Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>{copy.common.cancel}</Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" className="text-rose-700 hover:bg-rose-50 hover:text-rose-700" onClick={() => setConfirming(true)}><Trash2 aria-hidden />{copy.common.delete}</Button>
        )}
        <div className="flex gap-2">
          {entry.analysisStatus === "FAILED" && !entry.isPrivate && (
            <Button size="sm" variant="outline" onClick={() => void retryAnalysis(entry.id)}><RotateCcw aria-hidden />{copy.journal.analysis.retry}</Button>
          )}
          <Button size="sm" onClick={() => setMode("edit")}><Pencil aria-hidden />{copy.common.edit}</Button>
        </div>
      </div>
    </div>
  );
}
