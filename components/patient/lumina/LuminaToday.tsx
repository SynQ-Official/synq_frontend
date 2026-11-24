"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Clock, MessageCircle, Play, ShieldCheck, Sparkles } from "lucide-react";
import { ExerciseSession } from "@/components/patient/ui/ExerciseSession";
import { ErrorState, GlassCard, Skeleton } from "@/components/patient/ui/primitives";
import { SosButton } from "@/components/patient/sos/SosButton";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCompleteExercise, useCompletedToday } from "@/hooks/patient/useCare";
import { useLuminaFeedback, useLuminaToday } from "@/hooks/patient/useLumina";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import type { Exercise } from "@/lib/api/patient-types";
import { fill } from "@/lib/i18n/patient";
import { localizeExercise } from "@/lib/patient/exercises";
import { rationaleText } from "@/lib/patient/lumina";
import { RatingRow } from "./RatingRow";

/**
 * Lumina for today (P2.03 / P2.06 / P2.07): up to three reviewed activities chosen for the patient's recent state, each
 * with the reason it was chosen and a usefulness question. When a safety signal is present the server sends no
 * recommendation (SAFETY_YIELD) and this card points to SOS and the care team instead.
 */
export function LuminaToday() {
  const copy = usePatientCopy();
  const { language } = useLanguage();
  const today = useLuminaToday();
  const doneToday = useCompletedToday();
  const { complete } = useCompleteExercise();
  const { rate, sent, failed } = useLuminaFeedback();
  const [active, setActive] = useState<Exercise | null>(null);
  const t = copy.lumina.today;

  if (today.isLoading && !today.data) return <GlassCard><Skeleton className="h-48" /></GlassCard>;
  // A failed request is said out loud (localized) instead of leaving a hole; no recommendation is shown without the server's answer.
  if (!today.data) return today.error ? <ErrorState message={t.error} onRetry={() => void today.refresh()} /> : null;
  const data = today.data;

  if (data.mode === "SAFETY_YIELD") {
    return (
      <GlassCard aria-labelledby="lumina-safety-title">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden />
          <div className="min-w-0">
            <h2 id="lumina-safety-title" className="text-lg text-ink">{copy.lumina.safety.title}</h2>
            <p className="mt-1 text-sm text-ink-soft">{copy.lumina.safety.body}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <SosButton variant="compact" />
              <Button asChild variant="outline">
                <Link href="/dashboard/care"><MessageCircle className="size-4" aria-hidden />{copy.lumina.safety.care}</Link>
              </Button>
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  const done = new Set(doneToday.data ?? []);
  return (
    <GlassCard aria-labelledby="lumina-today-title">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden />
        <div className="min-w-0">
          <h2 id="lumina-today-title" className="text-xl leading-snug text-ink">{t.title}</h2>
          <span className="chip mt-1.5 inline-flex">{copy.lumina.tracks[data.track]}</span>
          <p className="mt-1 text-sm text-ink-soft">{t.subtitle}</p>
        </div>
      </div>
      {data.activities.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">{t.empty}</p>
      ) : (
        <ul className="mt-5 grid gap-3 md:grid-cols-3">
          {data.activities.map(({ exercise, rationaleKey }) => {
            const item = localizeExercise(exercise, language);
            const isDone = done.has(exercise.id);
            return (
              <li key={exercise.id} className="flex min-w-0 flex-col rounded-2xl border border-border p-4">
                <h3 className="text-base leading-snug text-ink">{item.title}</h3>
                {item.minutes !== null && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="size-3.5" aria-hidden />{fill(t.minutes, { n: item.minutes })}</p>
                )}
                <p className="mt-2 text-sm text-ink-soft"><span className="font-medium text-ink">{t.why}: </span>{rationaleText(copy, rationaleKey)}</p>
                <div className="mt-auto pt-3">
                  {isDone ? (
                    <p className="flex items-center gap-1.5 text-sm text-teal-700"><Check className="size-4" aria-hidden />{t.done}</p>
                  ) : (
                    <Button size="sm" onClick={() => setActive(exercise)}><Play className="size-4 rtl:-scale-x-100" aria-hidden />{t.start}</Button>
                  )}
                  <RatingRow
                    className="mt-3"
                    question={copy.lumina.rate.activity}
                    value={sent[exercise.slug]}
                    failed={failed === exercise.slug}
                    onRate={(usefulness) => void rate({ subject: "ACTIVITY", subjectKey: exercise.slug, usefulness, decisionId: data.activityDecisionId ?? undefined })}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <ExerciseSession
        exercise={active ? localizeExercise(active, language) : null}
        open={active !== null}
        onClose={() => setActive(null)}
        onFinish={async (durationSeconds) => {
          if (active) await complete({ exerciseId: active.id, durationSeconds });
        }}
      />
    </GlassCard>
  );
}
