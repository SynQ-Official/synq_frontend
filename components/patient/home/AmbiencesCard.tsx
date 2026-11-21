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
    <GlassCard className="flex h-full flex-col gap-4">
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-800" aria-hidden>
        <Headphones className="size-5" />
      </span>
      <div className="min-w-0">
        <h2 className="text-base text-ink">{copy.title[ambiences.track]}</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">{copy.subtitle[ambiences.track]}</p>
      </div>
      <Button asChild variant="outline" size="lg" className="mt-auto min-h-11 w-full rounded-full sm:w-auto sm:self-start">
        <Link href="/dashboard/ambiances">{copy.open}</Link>
      </Button>
    </GlassCard>
  );
}
