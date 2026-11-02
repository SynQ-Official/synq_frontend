"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { GlassCard } from "@/components/patient/ui/primitives";
import { Button } from "@/components/ui/button";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import type { AmbienceAnswer, PatientTrack } from "@/lib/api/patient-types";

/**
 * The optional question after a session of five minutes or more. Concentration for ADHD, how the patient feels for the
 * other tracks. Never required, never repeated for the same session: it can be skipped or ignored. The answer is health
 * data and goes to the patient's own clinician only; nothing about it is sent anywhere else.
 */
export function AmbienceFeedbackCard({ track, onAnswer, onClose }: { track: PatientTrack; onAnswer: (answer: AmbienceAnswer) => Promise<void>; onClose: () => void }) {
  const copy = usePatientCopy().ambiences;
  const words = track === "ADHD" ? copy.feedback.ADHD : copy.feedback.CALM;
  const questionId = useId();
  const [state, setState] = useState<"asking" | "sending" | "thanks" | "failed">("asking");

  // The thanks line stays a moment, then the card leaves by itself.
  useEffect(() => {
    if (state !== "thanks") return;
    const timer = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(timer);
  }, [state, onClose]);

  const choose = async (answer: AmbienceAnswer) => {
    setState("sending");
    try {
      await onAnswer(answer);
      setState("thanks");
    } catch {
      setState("failed");
    }
  };

  const options: { answer: AmbienceAnswer; label: string }[] = [
    { answer: "BETTER", label: words.better },
    { answer: "SAME", label: words.same },
    { answer: "WORSE", label: words.worse },
  ];

  return (
    <GlassCard role="region" aria-label={copy.feedback.title} className="space-y-4 p-5 sm:p-6">
      {state === "thanks" ? (
        <p role="status" className="text-[0.9375rem] text-ink">{copy.feedback.thanks}</p>
      ) : (
        <>
          <p className="text-sm font-medium text-ink-soft">{copy.feedback.title}</p>
          <p id={questionId} className="font-medium text-ink">{words.question}</p>
          <p className="text-[0.8125rem] leading-5 text-ink-muted">
            {copy.feedback.sharing}{" "}
            <Link href="/dashboard/settings" className="rounded-sm font-medium text-ink underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {copy.feedback.sharingLink}
            </Link>
          </p>
          <div role="group" aria-labelledby={questionId} className="flex flex-wrap gap-2">
            {options.map(({ answer, label }) => (
              <Button key={answer} type="button" variant="outline" size="lg" aria-disabled={state === "sending"} onClick={() => state !== "sending" && void choose(answer)} className="min-h-11 rounded-full">
                {label}
              </Button>
            ))}
            <Button type="button" variant="ghost" size="lg" onClick={onClose} className="min-h-11 rounded-full text-ink-muted">
              {copy.feedback.skip}
            </Button>
          </div>
          {state === "failed" && <p role="alert" className="text-sm text-rose-700">{copy.errors.answer}</p>}
        </>
      )}
    </GlassCard>
  );
}
