"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { EMERGENCY } from "@/lib/config/brand";
import { legalUi } from "@/lib/i18n/legal";
import { cn } from "@/lib/utils";
import { LifeBuoy } from "lucide-react";

/** "In danger? Call 999 (UAE)". TODO(owner): confirm the number (lib/config/brand.ts) and add a local helpline line. */
export function EmergencyNote({ className }: { className?: string }) {
  const { language } = useLanguage();
  return (
    <p role="note" className={cn("inline-flex items-center gap-2.5 rounded-full border border-gold-100 bg-gold-50 px-4 py-2 text-[0.875rem] font-medium leading-6 text-ink-soft", className)}>
      <LifeBuoy className="size-4 shrink-0 text-gold-700" strokeWidth={1.5} aria-hidden />
      <span>{legalUi[language].emergency.replace("{number}", EMERGENCY.number)}</span>
    </p>
  );
}
