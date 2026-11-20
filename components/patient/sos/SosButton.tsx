"use client";

import { useState } from "react";
import { CheckCircle2, LifeBuoy, Phone, TriangleAlert } from "lucide-react";
import { PatientModal } from "@/components/patient/ui/PatientModal";
import { LogoSpinner } from "@/components/shared/LogoLoader";
import { Button } from "@/components/ui/button";
import { usePatient } from "@/hooks/patient/usePatient";
import { useSos } from "@/hooks/patient/useSos";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { telHref } from "@/lib/patient/sos";
import { cn } from "@/lib/utils";

function Resources({ lines, title }: { lines: string[]; title: string }) {
  if (lines.length === 0) return null;
  return (
    <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50/80 p-4">
      <p className="text-sm font-semibold text-teal-900">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {lines.map((line) => {
          const href = telHref(line);
          return (
            <li key={line} className="flex items-start gap-2 text-sm text-teal-900" dir="auto">
              <Phone className="mt-0.5 size-4 shrink-0 text-teal-700" aria-hidden />
              {href ? (
                <a href={href} className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500">
                  {line}
                </a>
              ) : (
                <span>{line}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * The SOS control, reachable from every patient screen: a full-width button in the desktop rail, a compact one in the
 * small-screen strip. It never sends on the first press: a confirmation says who will be alerted and that SynQ is not an
 * emergency service. The dialog cannot be dismissed while the alert is on its way.
 */
export function SosButton({ variant }: { variant: "wide" | "compact" }) {
  const copy = usePatientCopy();
  const s = copy.sos;
  const { profile } = usePatient();
  const [open, setOpen] = useState(false);
  const { state, send, reset } = useSos();
  const sending = state.phase === "sending";

  const onOpenChange = (next: boolean) => {
    if (!next && sending) return; // the alert is on its way: keep the status on screen
    setOpen(next);
    if (!next) reset();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={s.openLabel}
        aria-haspopup="dialog"
        className={cn(
          // Visible, never alarming: a rose outline with dark text, solid only on hover / press.
          "group inline-flex items-center justify-center gap-2 rounded-full border border-rose-300 bg-white font-semibold text-ink transition-colors duration-200 hover:border-rose-600 hover:bg-rose-600 hover:text-white active:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500",
          variant === "wide" ? "min-h-11 w-full px-4 text-sm" : "min-h-11 px-3.5 text-xs",
        )}
      >
        <LifeBuoy className={cn("text-rose-600 transition-colors group-hover:text-white", variant === "wide" ? "size-[1.125rem]" : "size-4")} aria-hidden />
        {s.open}
      </button>

      <PatientModal open={open} onOpenChange={onOpenChange} title={state.phase === "sent" ? s.sentTitle : state.phase === "failed" ? s.failedTitle : s.title} size="md">
        <div role="status" aria-live="polite" className="mt-4">
          {state.phase === "sent" ? (
            <>
              <p className="flex items-start gap-2.5 text-sm leading-relaxed text-ink">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-sage-700" aria-hidden />
                <span>{state.result.alreadyOpen ? s.already : state.result.careTeamAlerted ? s.sentTeam : s.sentSupport}</span>
              </p>
              <Resources lines={state.result.emergencyResources} title={s.resources} />
              <p className="mt-4 text-sm font-medium text-ink">{s.emergency}</p>
            </>
          ) : state.phase === "failed" ? (
            <>
              <p role="alert" className="flex items-start gap-2.5 text-sm leading-relaxed text-ink">
                <TriangleAlert className="mt-0.5 size-5 shrink-0 text-rose-700" aria-hidden />
                <span>{state.failure === "rateLimited" ? s.rateLimited : state.failure === "offline" ? s.offline : s.failed}</span>
              </p>
              <p className="mt-4 text-sm font-medium text-ink">{s.emergency}</p>
            </>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-ink-soft">{s.body}</p>
              {!profile.careTeam.hasClinician && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.noTeam}</p>}
              <p className="mt-4 flex items-start gap-2.5 rounded-2xl border border-gold-100 bg-gold-50 p-3.5 text-sm font-medium leading-relaxed text-ink">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-gold-700" aria-hidden />
                {s.warning}
              </p>
            </>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          {state.phase === "sent" ? (
            <Button type="button" onClick={() => onOpenChange(false)}>{s.close}</Button>
          ) : (
            <>
              <Button type="button" variant="outline" disabled={sending} onClick={() => onOpenChange(false)}>{s.cancel}</Button>
              <Button
                type="button"
                disabled={sending}
                aria-busy={sending}
                onClick={() => void send()}
                className="bg-rose-600 text-white hover:bg-rose-700"
              >
                {sending && <LogoSpinner size={18} />}
                {sending ? s.sending : state.phase === "failed" ? s.retry : s.send}
              </Button>
            </>
          )}
        </div>
      </PatientModal>
    </>
  );
}
