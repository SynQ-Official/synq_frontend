"use client";

import { useState } from "react";
import { Repeat } from "lucide-react";
import { GlassCard, Skeleton } from "@/components/patient/ui/primitives";
import { useJournalSynthesis } from "@/hooks/patient/useLumina";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { fill } from "@/lib/i18n/patient";
import { signalLabel } from "@/lib/patient/lumina";
import { cn } from "@/lib/utils";

const MEASURES = ["mood", "energy", "focus", "sleep_hours"] as const;

/**
 * Smart Journal synthesis (P2.05): what came back in the patient's own entries and check-ins over 7 or 30 days.
 * Observations only, with how many days they rest on. Caregiver entries are never part of it (server side).
 */
export function JournalSynthesis() {
  const copy = usePatientCopy();
  const s = copy.lumina.synthesis;
  const [window, setWindow] = useState<7 | 30>(30);
  const res = useJournalSynthesis(window);
  const data = res.data;

  return (
    <GlassCard aria-labelledby="journal-synthesis-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="journal-synthesis-title" className="flex items-center gap-2 text-lg text-ink"><Repeat className="size-5 text-teal-700" aria-hidden />{s.title}</h2>
          <p className="mt-1 text-sm text-ink-soft">{s.subtitle}</p>
        </div>
        <div role="group" aria-label={s.title} className="flex gap-1">
          {([7, 30] as const).map((w) => (
            <button
              key={w}
              type="button"
              aria-pressed={window === w}
              onClick={() => setWindow(w)}
              className={cn("min-h-9 rounded-full px-3 text-xs", window === w ? "bg-teal-700 text-white" : "border border-border text-ink")}
            >
              {s.window[String(w) as "7" | "30"]}
            </button>
          ))}
        </div>
      </div>

      {res.isLoading && !data && <Skeleton className="mt-4 h-32" />}
      {data && !data.available && <p className="mt-4 text-sm text-ink-soft">{s.unavailable}</p>}
      {data?.available && data.status === "insufficient_data" && <p className="mt-4 text-sm text-ink-soft">{s.insufficient}</p>}
      {data?.available && data.status === "ok" && (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <section className="min-w-0">
            <h3 className="text-sm font-medium text-ink">{s.trends}</h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              {MEASURES.map((m) => (
                <li key={m} className="flex justify-between gap-3">
                  <span className="text-ink-soft">{s.measures[m]}</span>
                  <span className="text-ink">{s.status[data.trends[m].status]}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="min-w-0">
            <h3 className="text-sm font-medium text-ink">{s.recurring}</h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              {data.recurring_signals.slice(0, 4).map((r) => (
                <li key={r.signal} className="flex justify-between gap-3">
                  <span className="text-ink">{signalLabel(copy, r.signal)}</span>
                  <span className="text-muted-foreground">{fill(s.days, { n: r.days })}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="min-w-0">
            <h3 className="text-sm font-medium text-ink">{s.together}</h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              {data.co_occurrences.slice(0, 3).map((c) => (
                <li key={c.signals.join("+")} className="text-ink">
                  {c.signals.map((x) => signalLabel(copy, x)).join(" · ")}
                  <span className="ms-2 text-muted-foreground">{fill(s.days, { n: c.co_occurrence_days })}</span>
                </li>
              ))}
            </ul>
          </section>
          <p className="text-xs text-muted-foreground md:col-span-3">{s.certainty[data.uncertainty]}</p>
        </div>
      )}
    </GlassCard>
  );
}
