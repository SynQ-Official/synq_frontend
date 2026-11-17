"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useConsents } from "@/hooks/patient/useCare";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { fill } from "@/lib/i18n/patient";
import { formatDay } from "@/lib/patient/format";
import type { Consent } from "@/lib/api/patient-types";

const SETTINGS_PATH = "/dashboard/settings";
const CATEGORIES = ["mood", "sleep", "medication", "exercises", "ambiences", "diagnostics"] as const;

/** Relationships whose sharing the patient still has to confirm. Not blocking until `required`. */
function usePendingReconfirm() {
  const consents = useConsents();
  const pending = (consents.data ?? []).filter((consent) => consent.reconfirm?.pending);
  return { ...consents, pending, required: pending.filter((consent) => consent.reconfirm?.required) };
}

/** A calm reminder on the dashboard: look at what you share with your clinician and confirm it. */
export function SharingReconfirmBanner() {
  const { language } = useLanguage();
  const s = usePatientCopy().settings.privacy.reconfirm;
  const { pending } = usePendingReconfirm();
  if (pending.length === 0) return null;
  const due = pending.map((consent) => consent.reconfirm?.dueAt).filter(Boolean).sort()[0];
  return (
    <aside role="note" className="lm-glass lm-card mb-5 flex flex-wrap items-center justify-between gap-3 p-4 lg:mb-6">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-ink">{s.bannerTitle}</p>
          <p className="text-sm text-ink-soft">{s.bannerBody}{due ? ` ${fill(s.dueNote, { date: formatDay(due as string, language) })}` : ""}</p>
        </div>
      </div>
      <Button asChild size="sm" variant="outline">
        <Link href={SETTINGS_PATH}>{s.bannerCta}</Link>
      </Button>
    </aside>
  );
}

function GateRow({ consent }: { consent: Consent }) {
  const copy = usePatientCopy();
  const s = copy.settings.privacy;
  const { reconfirm } = useConsents();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const name = `${consent.clinician.firstName} ${consent.clinician.lastName}`.trim();
  return (
    <li className="rounded-2xl border border-line bg-white/70 p-4">
      <p className="text-sm font-semibold text-ink" dir="auto">{name}</p>
      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-ink-soft">
        {CATEGORIES.map((key) => (
          <li key={key} className="flex justify-between gap-2">
            <span>{s.categories[key]}</span>
            <span className={consent.categories[key] ? "font-medium text-teal-700" : "text-muted-foreground"}>{consent.categories[key] ? s.reconfirm.gateShared : s.reconfirm.gateNotShared}</span>
          </li>
        ))}
        <li className="flex justify-between gap-2">
          <span>{s.journal}</span>
          <span className="text-muted-foreground">{s.journalOptions[consent.categories.journal]}</span>
        </li>
      </ul>
      <Button
        className="mt-3"
        size="sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setFailed(false);
          try {
            await reconfirm(consent.assignmentId);
          } catch {
            setFailed(true);
          } finally {
            setBusy(false);
          }
        }}
      >
        {s.reconfirm.confirm}
      </Button>
      {failed && <p role="alert" className="mt-2 text-xs text-rose-700">{s.saveError}</p>}
    </li>
  );
}

/**
 * Mandatory once the 30 days have passed: opens on the next page the patient opens and stays until each pending
 * relationship is confirmed (or the patient goes to their settings to change it, where it never covers the page).
 */
export function SharingReconfirmGate() {
  const pathname = usePathname();
  const s = usePatientCopy().settings.privacy.reconfirm;
  const { required } = usePendingReconfirm();
  if (required.length === 0 || pathname?.startsWith(SETTINGS_PATH)) return null;
  return (
    <Dialog open>
      <DialogContent onEscapeKeyDown={(event) => event.preventDefault()} onPointerDownOutside={(event) => event.preventDefault()} onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{s.gateTitle}</DialogTitle>
          <DialogDescription>{s.gateBody}</DialogDescription>
        </DialogHeader>
        <ul className="space-y-3">{required.map((consent) => <GateRow key={consent.assignmentId} consent={consent} />)}</ul>
        <Button asChild variant="outline" size="sm">
          <Link href={SETTINGS_PATH}>{s.gateReview}</Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
