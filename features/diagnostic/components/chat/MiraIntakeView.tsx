"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/config/routes";
import { copy, type Lang } from "@/lib/i18n/config";

/**
 * Before the conversation can go on: the consent to the orientation is missing or withdrawn. Accepting it resumes
 * the SAME orientation where it stopped.
 */
export function MiraIntakeView({ language, busy, failed, onAccept }: { language: Lang; busy: boolean; failed: boolean; onAccept: () => void }) {
  const consent = copy[language].diagnostic.consent;
  return (
    <div className="relative mx-auto flex w-full max-w-lg flex-1 items-center px-4 py-10">
      <div className="orientation-glass w-full p-6 text-center sm:p-8" role="alertdialog" aria-labelledby="mira-consent-title" aria-describedby="mira-consent-body">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-teal-700 shadow-xs">
          <ShieldCheck className="h-6 w-6" aria-hidden />
        </span>
        <h1 id="mira-consent-title" className="mt-4 text-xl  text-ink">{consent.title}</h1>
        <p id="mira-consent-body" className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-muted">{consent.body}</p>
        <p className="mx-auto mt-3 max-w-sm text-xs leading-5 text-ink-muted">{consent.once}</p>
        {failed && <p role="alert" className="mt-3 text-sm text-rose-700">{consent.error}</p>}
        <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
          <Button variant="default" size="lg" disabled={busy} onClick={onAccept}>
            {busy ? consent.accepting : consent.accept}
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={ROUTES.support}>{consent.support}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
