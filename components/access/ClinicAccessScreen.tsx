"use client";

import { Card } from "@/components/auth/PasswordResetScreens";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { PSY_APP_URL } from "@/lib/config/routes";
import { accessCopy } from "@/lib/i18n/access";
import { ExternalLink, ShieldAlert, Stethoscope } from "lucide-react";

/**
 * /clinic-access: clinicians and clinics sign up in the clinician app. The primary action links there; until its public
 * address is configured (NEXT_PUBLIC_PSY_URL) no link is rendered, only a short note, so nothing points nowhere.
 */
export function ClinicAccessScreen() {
  const { language } = useLanguage();
  const copy = accessCopy[language].clinic;
  const signUpHref = PSY_APP_URL ? `${PSY_APP_URL}/signup` : null;

  return (
    <Card
      icon={
        <span className="flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
          <Stethoscope className="size-5" strokeWidth={1.5} aria-hidden />
        </span>
      }
      title={copy.title}
    >
      <p className="text-base leading-7 text-ink-soft">{copy.body}</p>
      <p role="note" className="flex items-start gap-2.5 rounded-xl border border-gold-100 bg-gold-50 px-4 py-3 text-base font-medium leading-6 text-ink">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-gold-700" aria-hidden />
        {copy.noPatientData}
      </p>

      {signUpHref ? (
        <Button asChild size="lg" className="min-h-12 w-full sm:w-auto">
          <a href={signUpHref} target="_blank" rel="noopener noreferrer">
            {copy.signUp}
            <ExternalLink className="ms-2 inline size-4 shrink-0" aria-hidden />
            <span className="sr-only"> {copy.opensNewTab}</span>
          </a>
        </Button>
      ) : (
        <p role="status" className="rounded-xl border border-gold-100 bg-gold-50 px-4 py-3 text-base leading-6 text-ink">
          {copy.signUpUnavailable}
        </p>
      )}
    </Card>
  );
}
