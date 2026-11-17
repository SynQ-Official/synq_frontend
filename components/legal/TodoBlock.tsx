import { cn } from "@/lib/utils";
import { Construction } from "lucide-react";

/** A section whose approved text has not been supplied yet: visible on purpose, so nothing is mistaken for final wording. */
export function TodoBlock({ label, detail, className }: { label: string; detail: string; className?: string }) {
  return (
    <div role="note" data-legal-todo className={cn("mt-6 flex items-start gap-3 rounded-2xl border-2 border-dashed border-gold-700 bg-gold-50 p-4 text-[0.9375rem] leading-6 text-ink", className)}>
      <Construction className="mt-0.5 size-5 shrink-0 text-gold-700" strokeWidth={1.5} aria-hidden />
      <p>
        <strong className="block font-semibold">{label}</strong>
        <span className="text-ink-soft">{detail}</span>
      </p>
    </div>
  );
}
