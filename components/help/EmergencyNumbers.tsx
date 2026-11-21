import { linesByCountry, type EmergencyLine } from "@/config/emergency";
import { helpCopy } from "@/lib/i18n/help";
import type { Lang } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { Phone } from "lucide-react";

/** A number as a call link, kept left-to-right so "800 725462" is never reordered in Arabic. */
export function CallLink({ line, className, children }: { line: EmergencyLine; className?: string; children?: React.ReactNode }) {
  return (
    <a href={line.telHref} className={cn("rounded-md underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500", className)}>
      {children ?? <bdi dir="ltr">{line.alias ?? line.display}</bdi>}
    </a>
  );
}

/**
 * Every emergency and support line from config/emergency.ts, grouped by country in the interface language's order.
 * No hooks: the static /help page renders it on the server, the "Need help now" panel on the client.
 */
export function EmergencyNumbers({ language, className }: { language: Lang; className?: string }) {
  const copy = helpCopy[language];
  return (
    <div className={cn("space-y-6", className)}>
      {linesByCountry(language).map(({ country, lines }) => (
        <section key={country} aria-labelledby={`help-${country}`}>
          <h3 id={`help-${country}`} className="text-sm  uppercase tracking-[0.12em] text-teal-800 rtl:tracking-normal">
            {copy.countries[country]}
          </h3>
          <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-white">
            {lines.map((line) => (
              <li key={line.id}>
                <a
                  href={line.telHref}
                  className="flex min-h-14 items-center gap-3 px-4 py-3 outline-none transition-colors duration-200 hover:bg-teal-50/70 focus-visible:bg-teal-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                    <Phone className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-medium leading-snug text-ink">
                      {copy.lines[line.labelKey]}
                      {line.region ? <span className="text-ink-soft"> · {copy.regions[line.region]}</span> : null}
                    </span>
                    <span className="mt-0.5 block text-sm text-ink-soft">
                      {line.hours === "24/7" ? copy.allDay : <bdi dir="ltr">{line.hours}</bdi>}
                    </span>
                  </span>
                  <span className="shrink-0 text-end">
                    <bdi dir="ltr" className="block text-base  tabular-nums text-teal-900">{line.display}</bdi>
                    {line.alias ? <bdi dir="ltr" className="block text-sm text-ink-soft">{line.alias}</bdi> : null}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="rounded-2xl bg-canvas px-4 py-3 text-base leading-6 text-ink-soft">{copy.limit}</p>
    </div>
  );
}
