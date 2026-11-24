"use client";

import { BellRing, CheckCircle2, Clock3, TriangleAlert, UserCheck, type LucideIcon } from "lucide-react";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import type { SosStatus } from "@/lib/api/patient-types";
import { sosStatusKey } from "@/lib/patient/messages";
import { fill } from "@/lib/i18n/patient";
import { cn } from "@/lib/utils";

const ICON: Record<ReturnType<typeof sosStatusKey>, LucideIcon> = {
  transmitted: Clock3,
  unrouted: TriangleAlert,
  acknowledged: UserCheck,
  escalated: BellRing,
  resolved: CheckCircle2,
};

/**
 * Where the patient's SOS stands: sent, taken by a named clinician, escalated, or closed. It states only what the API
 * reports. In particular it never says that help is on its way before a clinician has actually taken the alert.
 */
export function SosTracker({ status, className }: { status: SosStatus; className?: string }) {
  const copy = usePatientCopy().sos.status;
  const key = sosStatusKey(status);
  const Icon = ICON[key];
  const attention = key === "escalated" || key === "unrouted";
  const text = key === "acknowledged"
    ? status.clinicianName ? fill(copy.acknowledged, { name: status.clinicianName }) : copy.acknowledgedAnon
    : copy[key];

  return (
    <div
      role="status"
      aria-live="polite"
      data-sos-state={status.state}
      className={cn(
        "rounded-2xl border p-3.5 text-sm leading-relaxed text-ink",
        attention ? "border-gold-100 bg-gold-50" : "border-teal-100 bg-teal-50/70",
        className,
      )}
    >
      <p className="text-xs font-medium text-ink-muted">{copy.title}</p>
      <p className="mt-1 flex items-start gap-2.5" dir="auto">
        <Icon className={cn("mt-0.5 size-4 shrink-0", attention ? "text-gold-700" : "text-teal-700")} aria-hidden />
        <span>{text}</span>
      </p>
    </div>
  );
}
