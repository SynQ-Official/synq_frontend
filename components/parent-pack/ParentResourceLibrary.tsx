"use client";

import Link from "next/link";
import { BookHeart, Headphones, Music } from "lucide-react";
import { EmptyState, ErrorState, GlassCard, PageIntro, Skeleton } from "@/components/patient/ui/primitives";
import { Button } from "@/components/ui/button";
import { useAmbiences } from "@/hooks/patient/useAmbiences";
import { usePatient } from "@/hooks/patient/usePatient";
import { useLanguage } from "@/contexts/LanguageContext";
import { showsReads } from "@/lib/patient/content";

/**
 * Smart Library inside Parent Pack: the same comfort sounds and reading the patient app already serves (no second audio
 * engine: listening opens the existing player, which applies the track's rules and the clinician's settings).
 */
export function ParentResourceLibrary() {
  const ambiences = useAmbiences();
  const { profile } = usePatient();
  const { language } = useLanguage();
  const reads = profile.track !== undefined && showsReads(profile.track);

  return (
    <>
      <PageIntro eyebrow="Smart Library" icon={BookHeart} title="Sounds and reading for everyday routines"
        subtitle="Nature sounds, ambient sounds and brown noise for wind-down and homework time, from SynQ's Smart Library." />
      <div className="grid items-start gap-5 lg:grid-cols-[1.3fr_1fr]">
        <GlassCard className="p-5" aria-labelledby="pp-sounds">
          <h2 id="pp-sounds" className="mb-3 flex items-center gap-2 text-base font-semibold text-ink"><Headphones className="size-4" aria-hidden />Comfort sounds</h2>
          {ambiences.error && !ambiences.data ? <ErrorState onRetry={() => void ambiences.refresh()} /> : ambiences.isLoading ? <Skeleton className="h-40" /> : !ambiences.available ? (
            <EmptyState icon={Music} title="No sounds available for this account yet" body="On some tracks the care team switches sounds on first." />
          ) : (
            <>
              <ul className="grid gap-2 sm:grid-cols-2">
                {ambiences.sounds.map((sound) => (
                  <li key={sound.id} className="rounded-xl border border-line bg-white/70 px-3 py-2.5">
                    <span className="block text-sm font-medium text-ink" dir="auto">{language === "ar" ? sound.label.ar : sound.label.en}</span>
                    <span className="block text-xs capitalize text-ink-muted">{sound.category.toLowerCase().replace(/_/g, " ")}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-4"><Link href="/dashboard/ambiances"><Headphones aria-hidden />Open the sound player</Link></Button>
            </>
          )}
        </GlassCard>
        <GlassCard className="p-5" aria-labelledby="pp-reads">
          <h2 id="pp-reads" className="mb-2 flex items-center gap-2 text-base font-semibold text-ink"><BookHeart className="size-4" aria-hidden />Reading</h2>
          {reads ? (
            <>
              <p className="text-sm text-ink-soft">Trusted articles matched to your child&apos;s track, opened at their public source.</p>
              <Button asChild variant="outline" className="mt-4"><Link href="/dashboard/library">Open the library</Link></Button>
            </>
          ) : <p className="text-sm text-ink-soft">The reading library is not part of this track. Parent Guidance has the family resources.</p>}
        </GlassCard>
      </div>
    </>
  );
}
