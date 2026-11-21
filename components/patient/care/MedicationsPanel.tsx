"use client";

import { useState } from "react";
import { Pill } from "lucide-react";
import { EmptyState, ErrorState, GlassCard, Skeleton } from "@/components/patient/ui/primitives";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLogIntake, useMedicationIntakes, useMedications } from "@/hooks/patient/useCare";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { ApiError } from "@/lib/api/client";
import type { IntakeStatus, Medication, MedicationIntake } from "@/lib/api/patient-types";
import { fill } from "@/lib/i18n/patient";
import { formatDay, localDay } from "@/lib/patient/format";
import { cn } from "@/lib/utils";

const STATUSES: IntakeStatus[] = ["TAKEN", "SKIPPED", "MISSED"];
const TONE: Record<IntakeStatus, string> = {
  TAKEN: "bg-sage-100 text-sage-700",
  SKIPPED: "bg-gold-100 text-gold-700",
  MISSED: "bg-rose-100 text-rose-700",
};

/** `YYYY-MM-DDTHH:mm` in the patient's own time zone, the value a `datetime-local` field reads. */
function localDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${localDay(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink" dir="auto">{value}</dd>
    </div>
  );
}

function MedicationCard({ medication, intakes }: { medication: Medication; intakes: MedicationIntake[] }) {
  const copy = usePatientCopy().care.medications;
  const { language } = useLanguage();
  const { log, busy } = useLogIntake();
  // One "now" for the field's limit and default: the API accepts a dose up to a day ahead, not more.
  const [now] = useState(() => new Date());
  const [doseTime, setDoseTime] = useState(() => localDateTime(now));
  const [result, setResult] = useState<"logged" | "tooFar" | "failed" | null>(null);
  const recent = intakes.filter((intake) => intake.medicationId === medication.id).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));

  async function record(status: IntakeStatus) {
    const when = new Date(doseTime);
    if (Number.isNaN(when.getTime()) || busy) return;
    setResult(null);
    try {
      await log(medication.id, { scheduledAt: when.toISOString(), status });
      setResult("logged");
    } catch (error) {
      setResult(error instanceof ApiError && error.status === 400 ? "tooFar" : "failed");
    }
  }

  const dates = [
    fill(copy.since, { date: formatDay(medication.startDate, language, { month: "short", day: "numeric", year: "numeric" }) }),
    medication.endDate ? fill(copy.until, { date: formatDay(medication.endDate, language, { month: "short", day: "numeric", year: "numeric" }) }) : null,
  ].filter(Boolean).join(" · ");

  return (
    <GlassCard as="article" aria-label={medication.name}>
      <header className="flex items-start gap-3">
        <span className="stat-tile size-10 shrink-0"><Pill className="size-[1.125rem]" aria-hidden /></span>
        <div className="min-w-0">
          <h3 className="text-base  text-ink" dir="auto">{medication.name}</h3>
          <p className="text-xs text-muted-foreground">{dates}</p>
        </div>
      </header>

      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <Detail label={copy.dosage} value={medication.dosage} />
        <Detail label={copy.frequency} value={medication.frequency} />
        <Detail label={copy.instructions} value={medication.instructions} />
      </dl>

      <div className="mt-5 rounded-2xl border border-white/80 bg-white/65 p-4">
        <label htmlFor={`dose-${medication.id}`} className="block text-sm font-medium text-ink">{copy.logDose}</label>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            id={`dose-${medication.id}`}
            type="datetime-local"
            value={doseTime}
            max={localDateTime(new Date(now.getTime() + 24 * 60 * 60 * 1000))}
            onChange={(event) => { setDoseTime(event.target.value); setResult(null); }}
            aria-label={copy.dose}
            className="field-soft px-3 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((status) => (
              <Button key={status} type="button" size="sm" variant={status === "TAKEN" ? "default" : "outline"} disabled={busy || !doseTime} onClick={() => void record(status)}>
                {status === "TAKEN" ? copy.taken : status === "SKIPPED" ? copy.skipped : copy.missed}
              </Button>
            ))}
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{copy.sameDose}</p>
        <p role="status" className={cn("mt-1 min-h-5 text-sm", result === "logged" ? "text-sage-700" : "text-rose-700")}>
          {result === "logged" ? copy.logged : result === "tooFar" ? copy.tooFar : result === "failed" ? copy.logError : ""}
        </p>
      </div>

      <section aria-label={copy.recent} className="mt-4">
        <h4 className="text-xs  uppercase tracking-wide text-muted-foreground">{copy.recent}</h4>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{copy.noRecent}</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {recent.map((intake) => (
              <li key={intake.id} className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium", TONE[intake.status])}>
                <time dateTime={intake.scheduledAt}>{formatDay(intake.scheduledAt, language, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time>
                <span>{copy.status[intake.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </GlassCard>
  );
}

/**
 * The medication the care team prescribed, read only, with a dose log the patient keeps. The app never creates, edits
 * or stops a prescription: those belong to the psychiatrist, and the note under the list says so.
 */
export function MedicationsPanel() {
  const copy = usePatientCopy().care.medications;
  const medications = useMedications();
  const intakes = useMedicationIntakes(7);

  if (medications.error && !medications.data) return <ErrorState onRetry={() => void medications.refresh()} />;
  if (!medications.data) return <Skeleton className="h-64" />;
  if (medications.data.length === 0) return <EmptyState icon={Pill} title={copy.title} body={copy.empty} />;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
      {intakes.error && !intakes.data && <ErrorState onRetry={() => void intakes.refresh()} />}
      <div className="grid gap-5 xl:grid-cols-2">
        {medications.data.map((medication) => <MedicationCard key={medication.id} medication={medication} intakes={intakes.data ?? []} />)}
      </div>
      <p role="note" className="text-sm font-medium text-ink">{copy.note}</p>
    </div>
  );
}
