"use client";

import { AgentAvatar } from "@/components/layout/site-header";
import type { PsyPreviewCopy } from "@/lib/i18n/agents";
import { cn } from "@/lib/utils";
import { BarChart3, Bell, CalendarDays, ChevronRight, ChevronsUpDown, ClipboardCheck, Inbox, LayoutDashboard, NotebookPen, Search, Settings, ShieldPlus, UsersRound, AlertTriangle, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ACTIVE_NAV, type PsyScreen } from "./psyData";

/** The rail's icons, group by group, in the order of the real app's navigation. */
const NAV_ICONS: readonly (readonly LucideIcon[])[] = [
  [LayoutDashboard, Inbox, AlertTriangle, UsersRound, CalendarDays],
  [ClipboardCheck, BarChart3, NotebookPen],
  [ShieldPlus, Bell],
];
/** Badges the real rail shows beside a few items: alerts in red, requests in amber. */
const BADGES: Record<string, string> = { "0-1": "bg-amber-500 text-white", "0-2": "bg-red-500 text-white" };
const BADGE_VALUES: Record<string, string> = { "0-1": "2", "0-2": "3" };

/** The widths the app is drawn at before it is scaled down to the room it has: wide, with its labelled rail, and compact (a single column, sized to the room it has). */
const DESIGN_WIDTH = { wide: 940, compactMin: 460, compactMax: 560, breakpoint: 640 } as const;

function Rail({ copy, screen, compact }: { copy: PsyPreviewCopy; screen: PsyScreen; compact: boolean }) {
  const [activeGroup, activeItem] = ACTIVE_NAV[screen];
  const [name, role] = copy.clinician;
  const initials = name.replace(/^(Dr\.|د\.)\s*/, "").split(/\s+/).map((part) => part[0]).join("").slice(0, 2);

  return (
    <aside className={cn("flex shrink-0 flex-col p-3", compact ? "w-[64px] items-center" : "w-[204px]")}>
      <div className={cn("flex h-11 items-center gap-2.5", compact ? "justify-center" : "px-1")}>
        <AgentAvatar agent="psy" className="size-9 rounded-xl bg-white ring-1 ring-slate-200/80" />
        {!compact && <span className="text-sm  text-slate-900">SynQ</span>}
      </div>

      <nav aria-hidden className="mt-3 flex-1">
        {copy.nav.map(([group, items], groupIndex) => (
          <div key={group} className="mb-4 last:mb-0">
            {compact ? <div className="mx-auto mb-2 h-px w-5 bg-slate-200" /> : <p className="mb-1 px-2.5 text-[11px] font-medium text-slate-500">{group}</p>}
            <ul className="space-y-0.5">
              {items.map((label, itemIndex) => {
                const Icon = NAV_ICONS[groupIndex][itemIndex];
                const active = groupIndex === activeGroup && itemIndex === activeItem;
                const key = `${groupIndex}-${itemIndex}`;
                return (
                  <li
                    key={label}
                    className={cn(
                      "relative flex h-8 items-center gap-2.5 rounded-lg text-[13px] font-medium",
                      compact ? "mx-auto w-9 justify-center" : "px-2.5",
                      active ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80" : "text-slate-600",
                    )}
                  >
                    <Icon size={16} strokeWidth={active ? 2.2 : 1.85} className={active ? "text-[#0f766e]" : "text-slate-500"} />
                    {!compact && <span className="truncate">{label}</span>}
                    {BADGES[key] && !compact && <span className={cn("ms-auto min-w-5 rounded-md px-1.5 text-center text-[11px]  leading-5 tabular-nums", BADGES[key])}>{BADGE_VALUES[key]}</span>}
                    {BADGES[key] && compact && <span className={cn("absolute -end-0.5 -top-0.5 size-2 rounded-full ring-2 ring-[#f4f5f7]", key === "0-2" ? "bg-red-500" : "bg-amber-500")} />}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn("mt-2 space-y-2", compact && "flex flex-col items-center")}>
        {!compact && (
          <div className="rounded-xl border border-red-200 bg-gradient-to-b from-red-50 to-white p-3">
            <p className="flex items-center gap-2 text-xs  text-red-800">
              <span className="relative flex size-2">
                <span className="relative inline-flex size-2 rounded-full bg-red-500" />
              </span>
              {copy.triage[0]}
            </p>
            <p className="mt-1 flex items-center gap-0.5 text-[11px] text-red-700/80">
              {copy.triage[1]}
              <ChevronRight size={12} className="rtl:-scale-x-100" />
            </p>
          </div>
        )}
        <div className={cn("flex h-8 items-center gap-2.5 rounded-lg text-[13px] font-medium text-slate-600", compact ? "w-9 justify-center" : "px-2.5")}>
          <Settings size={16} className="text-slate-500" />
          {!compact && copy.settings}
        </div>
        <div className={cn("flex items-center gap-2.5 rounded-xl p-1.5", compact ? "justify-center" : "border border-slate-200/80 bg-white shadow-sm")}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0d9488] to-[#115e59] text-[11px]  text-white">{initials}</span>
          {!compact && (
            <>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[13px]  text-slate-900">{name}</span>
                <span className="block truncate text-[11px] text-slate-500">{role}</span>
              </span>
              <ChevronsUpDown size={14} className="shrink-0 text-slate-400" />
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

/** The top bar of the inset panel: the command-palette search on one side, the bell on the other. */
function TopBar({ copy, compact }: { copy: PsyPreviewCopy; compact: boolean }) {
  return (
    <div className="flex h-12 items-center justify-between gap-3 border-b border-slate-100 px-5">
      <span className={cn("flex h-8 items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 text-xs text-slate-400", compact ? "w-44" : "w-64")}>
        <Search size={14} aria-hidden />
        <span className="truncate">{copy.search}</span>
        {!compact && (
          <kbd dir="ltr" className="ms-auto rounded border border-slate-200 bg-white px-1.5 text-[10px] font-medium text-slate-500">
            ⌘K
          </kbd>
        )}
      </span>
      <span className="relative flex size-8 items-center justify-center rounded-lg text-slate-500">
        <Bell size={16} aria-hidden />
        <span className="absolute end-1.5 top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />
      </span>
    </div>
  );
}

/**
 * The clinician app as it is: the grey canvas with the labelled rail, the white inset panel, the top bar and the screen. It is
 * drawn at its own size and scaled to the room the page gives it, so it reads like the real thing on a phone and on a desk.
 * `crop` cuts it at a design height and fades the cut, like a screenshot. Decorative: the page that uses it carries the words.
 */
export function PsyWindow({ screen, copy, crop, className, children }: { screen: PsyScreen; copy: PsyPreviewCopy; crop?: number; className?: string; children: (compact: boolean) => ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const frame = outer.current;
    const content = inner.current;
    if (!frame || !content) return;
    const measure = () => setBox({ width: frame.clientWidth, height: content.offsetHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  const compact = box ? box.width < DESIGN_WIDTH.breakpoint : false;
  // On a phone the app is drawn narrow, so its text stays readable once scaled down to the screen.
  const designWidth = compact ? Math.min(Math.max(box?.width ?? 0, DESIGN_WIDTH.compactMin), DESIGN_WIDTH.compactMax) : DESIGN_WIDTH.wide;
  const scale = box ? box.width / designWidth : 0.6;
  const shown = box ? Math.min(box.height, crop ?? box.height) * scale : undefined;

  return (
    <div
      aria-hidden
      ref={outer}
      style={{ height: shown }}
      className={cn("relative w-full overflow-hidden rounded-[1.75rem] border border-white bg-[#f4f5f7] shadow-float ring-1 ring-line", crop && "[mask-image:linear-gradient(to_bottom,#000_86%,transparent)]", !box && "min-h-64", className)}
    >
      <div ref={inner} style={{ width: designWidth, transform: `scale(${scale})` }} className="absolute start-0 top-0 flex origin-top-left text-slate-900 rtl:origin-top-right">
        <Rail copy={copy} screen={screen} compact={compact} />
        <div className="my-2 me-2 min-w-0 flex-1 rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
          <TopBar copy={copy} compact={compact} />
          <div className="p-5">{children(compact)}</div>
        </div>
      </div>
    </div>
  );
}
