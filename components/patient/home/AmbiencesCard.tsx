"use client";

import Link from "next/link";
import { Headphones } from "lucide-react";
import { GlassCard } from "@/components/patient/ui/primitives";
import { Button } from "@/components/ui/button";
import { useAmbiences } from "@/hooks/patient/useAmbiences";
import { usePatientCopy } from "@/hooks/usePatientCopy";

/**
 * A way into the comfort sounds from home (small screens have no rail). It renders nothing until the server says there
 * are sounds for this patient: never for the psychosis track before the clinician has switched them on.
 */
export function AmbiencesCard() {
  const copy = usePatientCopy().ambiences;
  const { ambiences, available } = useAmbiences();
  if (!ambiences || !available) return null;

  return (
    <div className="mb-5 lg:mb-6">
      <GlassCard className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-800" aria-hidden>
          <Headphones className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-ink">{copy.title[ambiences.track]}</h2>
          <p className="text-sm text-ink-soft">{copy.subtitle[ambiences.track]}</p>
        </div>
        <Button asChild variant="outline" size="lg" className="min-h-11 rounded-full">
          <Link href="/dashboard/ambiances">{copy.open}</Link>
        </Button>
      </GlassCard>
    </div>
  );
}
