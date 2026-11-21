"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Clock } from "lucide-react";
import { PatientModal } from "@/components/patient/ui/PatientModal";
import { Button } from "@/components/ui/button";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { fill } from "@/lib/i18n/patient";
import type { BreathingPattern, LocalizedExercise } from "@/lib/patient/exercises";

type Phase = "inhale" | "hold" | "exhale";

/** Guided breathing: the orb swells on the in-breath, rests on the hold, softens on the out-breath. */
function BreathingGuide({ pattern }: { pattern: BreathingPattern }) {
  const copy = usePatientCopy();
  const reduce = useReducedMotion();
  const sequence = useMemo(() => {
    const phases: { phase: Phase; seconds: number }[] = [
      { phase: "inhale", seconds: pattern.inhale },
      { phase: "hold", seconds: pattern.hold },
      { phase: "exhale", seconds: pattern.exhale },
    ];
    return Array.from({ length: pattern.cycles }, () => phases).flat();
  }, [pattern]);
  const [tick, setTick] = useState(0);

  // One second per tick; the phase and countdown are derived from elapsed seconds.
  const total = sequence.reduce((sum, item) => sum + item.seconds, 0);
  const finished = tick >= total;
  useEffect(() => {
    if (finished) return;
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [finished]);

  let elapsed = 0;
  let index = 0;
  while (index < sequence.length - 1 && tick >= elapsed + sequence[index].seconds) {
    elapsed += sequence[index].seconds;
    index += 1;
  }
  const current = sequence[index];
  const remaining = finished ? 0 : current.seconds - (tick - elapsed);
  const target = finished || current.phase === "exhale" ? 1 : 1.38;

  return (
    <div className="flex flex-col items-center gap-5 py-4" role="timer" aria-live="polite">
      <div className="relative flex size-56 items-center justify-center">
        <motion.span
          aria-hidden
          className="lm-orb absolute"
          style={{ "--orb": "9rem" } as React.CSSProperties}
          animate={{ scale: reduce ? 1 : target }}
          transition={{ duration: reduce || finished ? 0 : current.seconds, ease: "easeInOut" }}
        />
        <div className="relative text-center text-white drop-shadow">
          {!finished && <p className="text-lg ">{copy.home.exercise[current.phase]}</p>}
          <p className="text-3xl  tabular-nums">{finished ? "✓" : remaining}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {fill(copy.common.outOf, { a: Math.min(pattern.cycles, Math.floor(index / 3) + 1), b: pattern.cycles })}
      </p>
    </div>
  );
}

/** Mounted fresh each time the modal opens, so steps and the timer always start clean. */
function SessionBody({
  exercise,
  onClose,
  onFinish,
}: {
  exercise: LocalizedExercise;
  onClose: () => void;
  onFinish: (durationSeconds: number) => void | Promise<void>;
}) {
  const copy = usePatientCopy();
  const [stepIndex, setStepIndex] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [finishing, setFinishing] = useState(false);
  const lastStep = stepIndex >= exercise.steps.length - 1;

  async function finish() {
    setFinishing(true);
    try {
      await onFinish(Math.max(1, Math.round((Date.now() - startedAt) / 1000)));
      onClose();
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div className="mt-4">
      {exercise.minutes ? (
        <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Clock className="size-3.5" aria-hidden />
          {fill(copy.common.min, { n: exercise.minutes })}
        </p>
      ) : null}

      {exercise.pattern ? (
        <BreathingGuide pattern={exercise.pattern} />
      ) : (
        <ol className="space-y-2.5 py-2">
          {exercise.steps.map((step, index) => (
            <motion.li
              key={step}
              initial={false}
              animate={{ opacity: index <= stepIndex ? 1 : 0.4 }}
              className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/70 p-3.5"
            >
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs  text-teal-800">
                {index < stepIndex ? <Check className="size-3.5" aria-hidden /> : index + 1}
              </span>
              <span className="text-sm leading-relaxed text-ink">{step}</span>
            </motion.li>
          ))}
        </ol>
      )}

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={onClose}>{copy.home.exercise.stop}</Button>
        {!exercise.pattern && !lastStep ? (
          <Button onClick={() => setStepIndex((value) => value + 1)}>{copy.common.next}</Button>
        ) : (
          <Button onClick={() => void finish()} disabled={finishing}>
            <Check aria-hidden />
            {copy.home.exercise.finish}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * A guided exercise in a modal. Breathing exercises run the animated guide; others walk the
 * steps one at a time. Finishing reports the time spent so the plan and reports stay truthful.
 */
export function ExerciseSession({
  exercise,
  open,
  onClose,
  onFinish,
}: {
  exercise: LocalizedExercise | null;
  open: boolean;
  onClose: () => void;
  onFinish: (durationSeconds: number) => void | Promise<void>;
}) {
  if (!exercise) return null;
  return (
    <PatientModal open={open} onOpenChange={(value) => !value && onClose()} title={exercise.title} description={exercise.description} size="md">
      <SessionBody exercise={exercise} onClose={onClose} onFinish={onFinish} />
    </PatientModal>
  );
}
