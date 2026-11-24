"use client";

import { usePatientCopy } from "@/hooks/usePatientCopy";
import { cn } from "@/lib/utils";

/** A 1-5 usefulness answer (Lumina P2.07). Buttons with text labels, so it reads the same in English and Arabic. */
export function RatingRow({ question, value, failed, onRate, className }: {
  question: string;
  value: number | undefined;
  failed: boolean;
  onRate: (usefulness: number) => void;
  className?: string;
}) {
  const copy = usePatientCopy();
  const r = copy.lumina.rate;
  if (value) return <p className={cn("text-sm text-teal-700", className)} role="status">{r.thanks}</p>;
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="text-sm text-ink-soft">{question}</legend>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {r.scale.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => onRate(i + 1)}
            className="min-h-9 rounded-full border border-border px-3 text-xs text-ink transition-colors hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
          >
            {label}
          </button>
        ))}
      </div>
      {failed && <p className="mt-2 text-xs text-destructive" role="alert">{r.error}</p>}
    </fieldset>
  );
}
