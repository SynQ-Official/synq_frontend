"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { legalUi } from "@/lib/i18n/legal";
import { cn } from "@/lib/utils";
import { Clock3 } from "lucide-react";

/**
 * The one rendering of a fact SynQ has not confirmed yet (a `null` in config/legal.ts or config/clinical.ts):
 * "<label>: To be confirmed before launch". Sober on purpose, and never a guess.
 */
export function PendingLegalField({ label, className }: { label?: string; className?: string }) {
  const { language } = useLanguage();
  return (
    <span data-pending-field className={cn("inline-flex items-start gap-2 rounded-xl border border-dashed border-line-strong bg-canvas px-3 py-2 text-base leading-6 text-ink-soft", className)}>
      <Clock3 className="mt-1 size-4 shrink-0 text-ink-muted" strokeWidth={1.75} aria-hidden />
      <span>
        {label ? <span className="font-medium text-ink">{label}: </span> : null}
        {legalUi[language].pending}
      </span>
    </span>
  );
}
