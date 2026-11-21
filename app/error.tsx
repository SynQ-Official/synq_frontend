"use client";

import { LuminaOrb } from "@/components/patient/ui/primitives";
import { Button } from "@/components/ui/button";
import { HelpNow } from "@/components/help/HelpNow";
import { usePatientCopy } from "@/hooks/usePatientCopy";

/** Last resort for a screen that threw while rendering: a calm message and a retry, never Next's raw error page. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const copy = usePatientCopy();
  return (
    <main className="lm-canvas flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center" role="alert">
      <LuminaOrb size={56} breathe={false} />
      <p className="max-w-sm text-sm text-muted-foreground">{copy.common.loadError}</p>
      <Button onClick={reset}>{copy.common.retry}</Button>
      <HelpNow className="mt-2" />
    </main>
  );
}
