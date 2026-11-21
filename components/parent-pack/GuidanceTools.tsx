"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Pause, Play, Plus, RotateCcw, Star } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { usePatient } from "@/hooks/patient/usePatient";
import { asBoolArray, asCount, exerciseKey, readStored, writeStored } from "@/lib/parent-pack/storage";
import { cn } from "@/lib/utils";

/** State kept on this device only (ticks and tokens are not clinical data). */
function useExerciseState<T>(id: string, sanitize: (raw: unknown) => T | null, fallback: T) {
  const { profile } = usePatient();
  const key = exerciseKey(profile.id, id);
  // Rendered only once the guidance has loaded in the browser, so reading storage on the first render is safe. Callers key it by exercise.
  const [value, setValue] = useState<T>(() => readStored(key, sanitize, fallback));
  const update = (next: T) => {
    setValue(next);
    writeStored(key, next);
  };
  return [value, update] as const;
}

export function Checklist({ id, items }: { id: string; items: string[] }) {
  const [ticks, setTicks] = useExerciseState<boolean[]>(id, asBoolArray, []);
  const done = items.filter((_, i) => ticks[i]).length;
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-ink-muted" aria-live="polite">{done} of {items.length} done</p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={item}>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-white/70 px-3 py-2.5 text-sm text-ink has-[:checked]:border-teal-200 has-[:checked]:bg-teal-50">
              <input
                type="checkbox"
                className="size-4 accent-teal-600"
                checked={!!ticks[i]}
                onChange={(e) => setTicks(items.map((_, j) => (j === i ? e.target.checked : !!ticks[j])))}
              />
              <span className={cn(ticks[i] && "text-ink-muted line-through")}>{item}</span>
            </label>
          </li>
        ))}
      </ul>
      {done > 0 && <Button variant="ghost" size="sm" className="mt-2" onClick={() => setTicks([])}><RotateCcw aria-hidden />Start again</Button>}
    </div>
  );
}

const TOKEN_GOAL = 10;

export function TokenBoard({ id }: { id: string }) {
  const [tokens, setTokens] = useExerciseState<number>(id, asCount, 0);
  return (
    <div>
      <div role="img" aria-label={`${tokens} of ${TOKEN_GOAL} tokens`} className="grid grid-cols-5 gap-2 sm:max-w-xs">
        {Array.from({ length: TOKEN_GOAL }, (_, i) => (
          <span key={i} className={cn("flex aspect-square items-center justify-center rounded-full border", i < tokens ? "border-gold-300 bg-gold-100 text-gold-700" : "border-dashed border-line-strong text-line-strong")}>
            <Star className={cn("size-5", i < tokens && "fill-current")} aria-hidden />
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => setTokens(Math.min(TOKEN_GOAL, tokens + 1))} disabled={tokens >= TOKEN_GOAL}><Plus aria-hidden />Add a token</Button>
        <Button size="sm" variant="outline" onClick={() => setTokens(Math.max(0, tokens - 1))} disabled={tokens === 0} aria-label="Undo last token"><Minus aria-hidden /></Button>
        {tokens >= TOKEN_GOAL && <span className="text-sm  text-gold-700" role="status">Goal reached: time for the agreed reward.</span>}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Tokens are a reminder of effort. They are never taken back as a punishment.</p>
    </div>
  );
}

const TIMER_CHOICES = [2, 5, 10, 15];

export function VisualTimer() {
  const [minutes, setMinutes] = useState(5);
  const [left, setLeft] = useState(5 * 60);
  const [running, setRunning] = useState(false);
  const reduced = useReducedMotion();
  const tick = useRef<number | null>(null);

  // The clock stops by itself at zero: `active` turns false and the interval is cleared.
  const active = running && left > 0;
  useEffect(() => {
    if (!active) return;
    tick.current = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => { if (tick.current) window.clearInterval(tick.current); };
  }, [active]);

  const total = minutes * 60;
  const fraction = left / total;
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const label = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
      <svg viewBox="0 0 120 120" className="size-36 shrink-0" role="timer" aria-label={`${label} left`}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-teal-100)" strokeWidth="12" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke="var(--color-teal-600)" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - fraction)} transform="rotate(-90 60 60)"
          style={{ transition: reduced ? undefined : "stroke-dashoffset 1s linear" }}
        />
        <text x="60" y="66" textAnchor="middle" className="fill-ink text-[1.25rem]  tabular-nums">{label}</text>
      </svg>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Timer length">
          {TIMER_CHOICES.map((m) => (
            <Button key={m} size="sm" variant={m === minutes ? "default" : "outline"} aria-pressed={m === minutes} onClick={() => { setMinutes(m); setLeft(m * 60); setRunning(false); }}>
              {m} min
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => (left === 0 ? (setLeft(total), setRunning(true)) : setRunning(!active))}>
            {active ? <><Pause aria-hidden />Pause</> : <><Play aria-hidden />{left === 0 ? "Again" : "Start"}</>}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setRunning(false); setLeft(total); }}><RotateCcw aria-hidden />Reset</Button>
        </div>
        {left === 0 && <p role="status" className="text-sm  text-teal-800">Time is up.</p>}
      </div>
    </div>
  );
}
