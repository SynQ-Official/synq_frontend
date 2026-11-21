"use client";

import { Fragment } from "react";
import { CallLink } from "@/components/help/EmergencyNumbers";
import { EMERGENCY_LINES, COUNTRY_ORDER } from "@/config/emergency";
import { useLanguage } from "@/contexts/LanguageContext";
import { helpCopy } from "@/lib/i18n/help";
import { cn } from "@/lib/utils";
import { LifeBuoy } from "lucide-react";

/**
 * The footer's emergency line, built from config/emergency.ts:
 * "In danger right now? UAE: 998 (Ambulance) · Abu Dhabi: 800-SAKINA (800 725462, 24/7) · Tunisia: 190 (SAMU). SynQ cannot respond to emergencies."
 */
export function EmergencyNote({ className }: { className?: string }) {
  const { language } = useLanguage();
  const copy = helpCopy[language];
  const comma = language === "ar" ? "، " : ", ";
  const lines = COUNTRY_ORDER[language].flatMap((country) => EMERGENCY_LINES.filter((line) => line.country === country && line.inBanner));

  return (
    <p role="note" className={cn("flex items-start gap-2.5 rounded-2xl border border-gold-100 bg-gold-50 px-4 py-2.5 text-[0.875rem] font-medium leading-6 text-ink-soft", className)}>
      <LifeBuoy className="mt-1 size-4 shrink-0 text-gold-700" strokeWidth={1.5} aria-hidden />
      <span>
        <span className=" text-ink">{copy.bannerLead}</span>{" "}
        {lines.map((line, index) => (
          <Fragment key={line.id}>
            {index > 0 ? " · " : null}
            {line.region ? copy.regions[line.region] : copy.countries[line.country]}:{" "}
            <CallLink line={line} className=" text-teal-800 underline" />{" "}
            (
            {line.alias ? (
              <>
                <bdi dir="ltr">{line.display}</bdi>
                {comma}
                {line.hours === "24/7" ? copy.allDay : <bdi dir="ltr">{line.hours}</bdi>}
              </>
            ) : (
              copy.bannerService[line.labelKey]
            )}
            )
          </Fragment>
        ))}
        . {copy.bannerLimit}
      </span>
    </p>
  );
}
