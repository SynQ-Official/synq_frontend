"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookHeart, BookOpenCheck, BedDouble, HeartHandshake, Info, LayoutDashboard, LifeBuoy, NotebookPen, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const PARENT_PACK_BASE = "/dashboard/parent-pack";

const SECTIONS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: PARENT_PACK_BASE, label: "Dashboard", icon: LayoutDashboard },
  { href: `${PARENT_PACK_BASE}/guidance`, label: "Parent Guidance", icon: BookOpenCheck },
  { href: `${PARENT_PACK_BASE}/room`, label: "Room Planner", icon: BedDouble },
  { href: `${PARENT_PACK_BASE}/journal`, label: "Family Journal", icon: NotebookPen },
  { href: `${PARENT_PACK_BASE}/safety`, label: "Safety Plan", icon: LifeBuoy },
  { href: `${PARENT_PACK_BASE}/wellbeing`, label: "Parent Wellbeing", icon: HeartHandshake },
  { href: `${PARENT_PACK_BASE}/library`, label: "Smart Library", icon: BookHeart },
];

export const PARENT_PACK_DISCLAIMER =
  "Parent Pack provides educational and organizational support for families. It does not provide medical diagnosis, treatment, or clinical advice. Its resources do not replace professional healthcare, emergency services, accessibility requirements, or applicable safety standards.";

export type Note = { tone: "success" | "error"; text: string } | null;

/** Inline feedback after a save (the patient app has no toast layer). Announced politely to screen readers. */
export function StatusNote({ note, className }: { note: Note; className?: string }) {
  return (
    <p role="status" aria-live="polite" className={cn("min-h-5 text-sm", note?.tone === "error" ? "text-rose-700" : "text-teal-800", className)}>
      {note?.text}
    </p>
  );
}

export function ParentPackDisclaimer({ className }: { className?: string }) {
  return (
    <p className={cn("flex gap-2.5 rounded-2xl border border-gold-100 bg-gold-50/80 px-4 py-3 text-[0.8125rem] leading-relaxed text-ink-soft", className)}>
      <Info className="mt-0.5 size-4 shrink-0 text-gold-700" aria-hidden />
      <span>{PARENT_PACK_DISCLAIMER}</span>
    </p>
  );
}

/** Parent Pack's own frame inside the patient shell: section navigation, the safety plan always one tap away, and the disclaimer. */
export function ParentPackShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const active = (href: string) => (href === PARENT_PACK_BASE ? pathname === href : pathname.startsWith(href));

  return (
    <div className="lm-rise">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Parent Pack sections" className="-mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-hide">
          {SECTIONS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={active(href) ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[0.8125rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500",
                active(href) ? "border-teal-600 bg-teal-600 text-white shadow-brand" : "border-line bg-white/70 text-ink-soft hover:border-teal-200 hover:bg-teal-50",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
        <Link
          href={`${PARENT_PACK_BASE}/safety#emergency`}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3.5 py-2 text-[0.8125rem] font-semibold text-rose-700 hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
        >
          <LifeBuoy className="size-4" aria-hidden />
          Emergency &amp; safety plan
        </Link>
      </div>
      {children}
      <ParentPackDisclaimer className="mt-10" />
    </div>
  );
}
