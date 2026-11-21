"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { fill } from "@/lib/i18n/patient";
import { cn } from "@/lib/utils";

const LENGTHS = [5, 10, 15, 25] as const;
const RADIUS = 44;
const CIRC = 2 * Math.PI * RADIUS;

/**
 * A round focus timer. The length Spark suggests for today is preselected (short when focus is low); a finished
 * round is reported once through `onComplete`. The clock, not the tick count, is the source of truth, so a
 * throttled background tab still ends on time.
 */
export function FocusTimer({
  suggested,
  today,
  onComplete,
}: {
  suggested?: number;
  today: { rounds: number; minutes: number };
  onComplete: (minutes: number) => void;
}) {
  const copy = usePatientCopy().spark.focus;
  const reduce = useReducedMotion();
  const start = LENGTHS.includes(suggested as (typeof LENGTHS)[number]) ? (suggested as (typeof LENGTHS)[number]) : 10;
  const [minutes, setMinutes] = useState<number>(start);
  const [left, setLeft] = useState(start * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const endAt = useRef(0);
  const reported = useRef(onComplete);
  useEffect(() => {
    reported.current = onComplete;
  });

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) {
        window.clearInterval(timer);
        setRunning(false);
        setFinished(true);
        reported.current(minutes);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [running, minutes]);

  const choose = (value: number) => {
    setMinutes(value);
    setLeft(value * 60);
    setRunning(false);
    setFinished(false);
  };
  const toggle = () => {
    setFinished(false);
    if (running) {
      setRunning(false);
      return;
    }
    const seconds = left === 0 ? minutes * 60 : left;
    setLeft(seconds);
    endAt.current = Date.now() + seconds * 1000;
    setRunning(true);
  };
  const progress = 1 - left / (minutes * 60);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="lm-soft flex flex-col items-center gap-4 p-4 sm:flex-row sm:gap-5">
      <div className="relative size-28 shrink-0" role="timer" aria-label={`${mm}:${ss}`}>
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="var(--color-teal-100)" strokeWidth="6" />
          <circle
            cx="50" cy="50" r={RADIUS} fill="none" stroke="var(--color-teal-600)" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - progress)} style={{ transition: reduce ? "none" : "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-2xl  tabular-nums text-ink" dir="ltr">{mm}:{ss}</span>
          {running && <span className="size-1.5 animate-pulse rounded-full bg-teal-500" aria-hidden />}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-center gap-3 sm:items-start">
        <div className="flex flex-wrap justify-center gap-1.5 sm:justify-start" role="group" aria-label={copy.title}>
          {LENGTHS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => choose(value)}
              aria-pressed={minutes === value}
              title={value === suggested ? copy.suggested : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-xs  transition-colors",
                minutes === value ? "border-teal-600 bg-teal-600 text-white" : "border-line-strong bg-white/60 text-ink-soft hover:bg-white",
                value === suggested && minutes !== value && "border-teal-300",
              )}
            >
              {fill(copy.minutes, { n: value })}
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground sm:text-start" aria-live="polite">
          {finished ? copy.finished : running ? copy.running : today.rounds ? fill(copy.today, { n: today.rounds, m: today.minutes }) : copy.none}
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={toggle}>
            {running ? <Pause aria-hidden /> : <Play aria-hidden />}
            {running ? copy.pause : copy.start}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => choose(minutes)}>
            <RotateCcw aria-hidden />
            {copy.reset}
          </Button>
        </div>
      </div>
    </div>
  );
}
