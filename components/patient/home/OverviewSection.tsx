import type { ReactNode } from "react";
import { SERIF } from "@/components/home/typography";
import { cn } from "@/lib/utils";

/**
 * A titled band of the overview: a small eyebrow and a title over a hairline, then the cards of that band. Three of them
 * (today, this week, support) turn the overview from a stack of cards into a page that reads top to bottom.
 */
export function OverviewSection({ id, eyebrow, title, className, children }: { id: string; eyebrow: string; title: string; className?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-title`} className={cn("mt-9 lg:mt-12", className)}>
      <header className="mb-4 flex items-end justify-between gap-4 border-b border-ink/10 pb-3 lg:mb-5">
        <div className="min-w-0">
          <p className="lm-eyebrow">{eyebrow}</p>
          <h2 id={`${id}-title`} className={cn(SERIF, "mt-1 text-[1.375rem] font-light leading-tight tracking-[-0.02em] text-ink rtl:font-normal rtl:tracking-normal")}>
            {title}
          </h2>
        </div>
      </header>
      {children}
    </section>
  );
}
