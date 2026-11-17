"use client";

import { useEffect, useState } from "react";
import { AlertCircle, LockKeyhole, Save } from "lucide-react";
import { MoodPicker } from "@/components/patient/ui/MoodPicker";
import { ScaleSlider } from "@/components/patient/ui/ScaleSlider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { patientKey } from "@/lib/api/tokens";
import { fill } from "@/lib/i18n/patient";
import { formatDay } from "@/lib/patient/format";
import { EMOTION_KEYS, moodFor, type EmotionKey } from "@/lib/patient/moods";
import { cn } from "@/lib/utils";
import { LogoSpinner } from "@/components/shared/LogoLoader";

export type EntryValues = {
  content: string;
  moodScore: number | null;
  goalScore: number | null;
  emotions: EmotionKey[];
  isPrivate: boolean;
};

export const EMPTY_ENTRY: EntryValues = { content: "", moodScore: null, goalScore: null, emotions: [], isPrivate: false };

const DRAFT_KEY = "vitamind_journal_draft";

/**
 * A half-written entry survives a refresh or a dropped connection (text only, on this device). It is stored under
 * the signed-in patient's id and wiped on sign-out, so another patient on a shared device never sees it.
 */
export function loadDraft(): string {
  try {
    const key = patientKey(DRAFT_KEY);
    return key ? window.localStorage.getItem(key) ?? "" : "";
  } catch {
    return "";
  }
}
export function saveDraft(text: string) {
  try {
    const key = patientKey(DRAFT_KEY);
    if (!key) return;
    if (text) window.localStorage.setItem(key, text);
    else window.localStorage.removeItem(key);
  } catch {
    /* draft protection is best-effort */
  }
}

/**
 * The Smart Journal entry: mood, the emotions in the mix, the day in the patient's words and how
 * much of their intentions they achieved. Used to write and to edit. Nothing here is required
 * except a few words — ratings the patient skips stay unrecorded rather than defaulted.
 * `variant="page"` is today's page: dated, on ruled paper, in the light of the chosen mood.
 * `insert` appends a prompt (from the companion column) to the text.
 */
export function EntryForm({
  initial = EMPTY_ENTRY,
  submitLabel,
  isSaving,
  error,
  onSubmit,
  persistDraft = false,
  onCancel,
  variant = "plain",
  insert,
}: {
  initial?: EntryValues;
  submitLabel: string;
  isSaving: boolean;
  error?: string | null;
  onSubmit: (values: EntryValues) => void | Promise<void>;
  persistDraft?: boolean;
  onCancel?: () => void;
  variant?: "page" | "plain";
  insert?: { text: string; nonce: number };
}) {
  const copy = usePatientCopy();
  const { language } = useLanguage();
  const j = copy.journal;
  const page = variant === "page";
  const [values, setValues] = useState<EntryValues>(initial);
  const [goalTouched, setGoalTouched] = useState(initial.goalScore !== null);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (!persistDraft) return;
    const draft = loadDraft();
    // Restore a saved draft once, on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (draft) setValues((current) => (current.content ? current : { ...current, content: draft }));
  }, [persistDraft]);

  useEffect(() => {
    if (!persistDraft) return;
    const timer = window.setTimeout(() => saveDraft(values.content), 400);
    return () => window.clearTimeout(timer);
  }, [persistDraft, values.content]);

  useEffect(() => {
    if (!insert) return;
    // A prompt chosen beside the page lands at the end of the text, ready to answer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues((current) => ({ ...current, content: current.content ? `${current.content.trimEnd()}

${insert.text} ` : `${insert.text} ` }));
    document.getElementById("journal-text")?.focus();
  }, [insert]);

  const update = (patch: Partial<EntryValues>) => setValues((current) => ({ ...current, ...patch }));
  const toggleEmotion = (emotion: EmotionKey) =>
    update({ emotions: values.emotions.includes(emotion) ? values.emotions.filter((item) => item !== emotion) : [...values.emotions, emotion].slice(0, 8) });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setAttempted(true);
    if (!values.content.trim()) {
      // Nothing is sent: bring the patient back to the page they still need to write.
      document.getElementById("journal-text")?.focus();
      return;
    }
    await onSubmit({ ...values, content: values.content.trim(), goalScore: goalTouched ? values.goalScore ?? 5 : null });
  }

  const form = (
    <form onSubmit={submit} className="space-y-7" noValidate>
      {page && (
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-white/70 pb-5">
          <p className="text-sm font-medium text-ink-muted">{formatDay(new Date(), language, { weekday: "long", month: "long", day: "numeric" })}</p>
          {values.isPrivate && <span className="chip"><LockKeyhole className="size-3" aria-hidden />{copy.common.private}</span>}
        </header>
      )}
      <fieldset>
        <legend className="text-base font-semibold text-ink">{page ? j.page.feel : j.mood.title}</legend>
        <p className="mb-3 mt-0.5 text-sm text-muted-foreground">{j.mood.hint}</p>
        <MoodPicker value={values.moodScore} onChange={(score) => update({ moodScore: score })} labels={j.mood.labels} ariaLabel={j.mood.title} />
      </fieldset>

      <fieldset>
        <legend className="text-base font-semibold text-ink">{j.emotions.title}</legend>
        <p className="mb-3 mt-0.5 text-sm text-muted-foreground">{j.emotions.hint}</p>
        <div className="flex flex-wrap gap-2">
          {EMOTION_KEYS.map((emotion) => {
            const active = values.emotions.includes(emotion);
            return (
              <button
                key={emotion}
                type="button"
                aria-pressed={active}
                onClick={() => toggleEmotion(emotion)}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500",
                  active ? "border-transparent bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-brand" : "border-line-strong bg-white/75 text-ink-soft hover:-translate-y-0.5 hover:bg-white",
                )}
              >
                {j.emotions[emotion]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="journal-text" className="text-base font-semibold text-ink">{page ? j.page.words : j.describe.title}</label>
        {page && <p className="mt-0.5 text-sm text-muted-foreground">{j.page.wordsHint}</p>}
        <div className="mb-3 mt-2 flex flex-wrap gap-2">
          {j.describe.prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => update({ content: values.content ? `${values.content.trimEnd()}\n\n${prompt} ` : `${prompt} ` })}
              className="rounded-full border border-teal-200 bg-teal-50/70 px-3 py-1.5 text-xs font-medium text-teal-800 hover:bg-teal-100"
            >
              {prompt}
            </button>
          ))}
        </div>
        <textarea
          id="journal-text"
          value={values.content}
          onChange={(event) => update({ content: event.target.value })}
          rows={page ? 9 : 7}
          maxLength={12000}
          dir="auto"
          placeholder={j.describe.placeholder}
          aria-invalid={attempted && !values.content.trim()}
          aria-describedby="journal-count"
          className={cn(
            page
              ? "lm-paper w-full resize-y text-base text-ink outline-none placeholder:text-muted-foreground"
              : "field-soft w-full resize-y px-4 py-3 text-[0.9375rem] leading-relaxed text-ink outline-none placeholder:text-muted-foreground",
            attempted && !values.content.trim() && "border-rose-700",
          )}
        />
        <div className="mt-1 flex items-center justify-between text-xs" id="journal-count">
          <span className="text-rose-700" role="alert">{attempted && !values.content.trim() ? j.needText : ""}</span>
          <span className="text-muted-foreground tabular-nums">{fill(j.describe.count, { n: values.content.length })}</span>
        </div>
      </div>

      <fieldset>
        <legend className="text-base font-semibold text-ink">{j.goals.title}</legend>
        <p className="mb-4 mt-0.5 text-sm text-muted-foreground">{j.goals.hint}</p>
        <ScaleSlider
          value={values.goalScore ?? 5}
          min={1}
          max={10}
          ariaLabel={j.goals.title}
          lowLabel={j.goals.low}
          highLabel={j.goals.high}
          format={(value) => (goalTouched ? fill(j.goals.value, { n: value }) : "—")}
          onChange={(value) => {
            setGoalTouched(true);
            update({ goalScore: value });
          }}
        />
      </fieldset>

      <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/80 bg-white/65 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="stat-tile stat-tile-sage size-10 shrink-0"><LockKeyhole className="size-4" aria-hidden /></span>
          <div>
            <label htmlFor="journal-private" className="text-sm font-semibold text-ink">{j.private.title}</label>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{j.private.body}</p>
          </div>
        </div>
        <Switch id="journal-private" checked={values.isPrivate} onCheckedChange={(checked) => update({ isPrivate: checked })} />
      </div>

      {attempted && !values.content.trim() && (
        <p role="alert" className="flex items-start gap-2.5 rounded-xl border border-gold-100 bg-gold-50 px-4 py-3 text-sm font-medium text-gold-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />{j.needText}
        </p>
      )}
      {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>{copy.common.cancel}</Button>}
        <Button type="submit" size="lg" disabled={isSaving}>
          {isSaving ? <LogoSpinner size={18} /> : <Save aria-hidden />}
          {isSaving ? j.saving : submitLabel}
        </Button>
      </div>
    </form>
  );

  if (!page) return form;
  const mood = moodFor(values.moodScore);
  return (
    <div data-mood={mood?.level ?? 3} className="lm-mood-stage p-5 sm:p-8">
      {form}
    </div>
  );
}
