"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BedDouble, BookOpen, CalendarCheck, Compass, HeartPulse, LayoutDashboard, Library, ShieldCheck, Stethoscope, TrendingUp, TriangleAlert, type LucideIcon } from "lucide-react";
import { familyApi, type Overview } from "@/lib/family/api";
import { visibleTabs, type FamilyTab } from "@/lib/family/logic";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ChildCheckin, ChildJournal, ChildProgress } from "./ChildRecords";
import { ChildGuidance, ChildResources, ChildSafety } from "./ChildSupport";
import { ChildRoom, RoomPreviewCard } from "./ChildRoom";
import { Card, LoadError, PrimaryButton, useFamilyCopy, useLoad } from "./FamilyShell";

const TAB_ICON: Record<FamilyTab, LucideIcon> = {
  overview: LayoutDashboard, checkin: HeartPulse, journal: BookOpen, guidance: Compass, progress: TrendingUp, resources: Library, room: BedDouble, safety: ShieldCheck,
};

/** One dashboard cell that settles a beat after the one before it (still under reduced motion: the shell sets MotionConfig). */
function Cell({ index, className, children }: { index: number; className?: string; children: ReactNode }) {
  return (
    <motion.div className={cn("min-w-0", className)} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.05 + index * 0.06 }}>
      {children}
    </motion.div>
  );
}

/**
 * One child's space. Everything comes from the server for THIS child id (checked against the parent session on every
 * call): switching child reloads everything, so nothing of one child can show under another.
 */
export function ChildSpace({ childId }: { childId: string }) {
  const { t } = useFamilyCopy();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const overview = useLoad(() => familyApi.overview(childId).then((r) => r.data), [childId]);
  const siblings = useLoad(() => familyApi.children().then((r) => r.data.filter((c) => c.status === "ACTIVE")), []);

  if (overview.error) return <LoadError error={overview.error} retry={overview.reload} />;
  if (!overview.data) return <SpaceSkeleton label={t.loading} />;
  const data = overview.data;
  const tabs = visibleTabs(data.access.permissions);
  const asked = params.get("tab") as FamilyTab | null;
  const tab: FamilyTab = asked && tabs.includes(asked) ? asked : "overview";
  const go = (next: FamilyTab) => router.replace(`${pathname}?tab=${next}`, { scroll: false });

  return (
    <div className="space-y-5 lg:space-y-6">
      <ChildHeader data={data} childId={childId} siblings={siblings.data ?? []} onSwitch={(id) => router.push(`/family/children/${id}`)} />

      <nav className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label={data.child.firstName ?? ""}>
        <ul className="lm-glass flex w-max min-w-full gap-1 rounded-full p-1.5">
          {tabs.map((key) => {
            const Icon = TAB_ICON[key];
            const active = tab === key;
            return (
              <li key={key} className="relative">
                <button type="button" onClick={() => go(key)} aria-current={active ? "page" : undefined}
                  className={cn("relative inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500",
                    active ? "text-white" : "text-ink-soft hover:bg-white/80 hover:text-teal-800")}>
                  {active && <motion.span layoutId="family-tab-pill" aria-hidden className="absolute inset-0 rounded-full bg-teal-700 shadow-brand" transition={{ duration: 0.45, ease: EASE_OUT }} />}
                  <Icon aria-hidden className="relative size-4 shrink-0" />
                  <span className="relative whitespace-nowrap">{t.tabs[key]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {tab === "overview" && <OverviewPanel data={data} childId={childId} tabs={tabs} go={go} />}
      {tab === "checkin" && <ChildCheckin childId={childId} onSaved={overview.reload} />}
      {tab === "journal" && <ChildJournal childId={childId} />}
      {tab === "guidance" && <ChildGuidance childId={childId} />}
      {tab === "progress" && <ChildProgress childId={childId} />}
      {tab === "resources" && <ChildResources childId={childId} />}
      {tab === "room" && <ChildRoom childId={childId} />}
      {tab === "safety" && <ChildSafety childId={childId} />}
    </div>
  );
}

/** The child at a glance: who, their care path, their clinician, and the switch to a sibling. */
function ChildHeader({ data, childId, siblings, onSwitch }: { data: Overview; childId: string; siblings: { childId: string; firstName: string | null }[]; onSwitch: (id: string) => void }) {
  const { t } = useFamilyCopy();
  const chip = "inline-flex min-h-8 items-center gap-1.5 rounded-full bg-white/75 px-3 text-xs font-medium text-ink-soft ring-1 ring-line";
  return (
    <section className="lm-welcome p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span aria-hidden className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-300 to-teal-700 text-xl  text-white shadow-brand sm:size-16">
            {(data.child.firstName?.trim()[0] ?? "·").toUpperCase()}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-title  tracking-[-0.02em]" dir="auto">{data.child.firstName}</h1>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {data.child.age !== null && <li className={chip}>{t.overview.ageYears(data.child.age)}</li>}
              <li className={chip}><Compass aria-hidden className="size-3.5 text-teal-700" />{data.child.track ? `${t.overview.carePath}: ${data.child.track}` : t.overview.noCarePath}</li>
              {data.clinician && <li className={chip}><Stethoscope aria-hidden className="size-3.5 text-teal-700" />{t.overview.clinician}: {data.clinician.name}</li>}
            </ul>
          </div>
        </div>
        {siblings.length > 1 && (
          <label className="text-sm">
            <span className="sr-only">{t.nav.spaces}</span>
            <select className="min-h-11 rounded-full border border-line-strong bg-white/90 px-4 text-sm font-medium" value={childId} onChange={(e) => onSwitch(e.target.value)}>
              {siblings.map((c) => <option key={c.childId} value={c.childId}>{c.firstName}</option>)}
            </select>
          </label>
        )}
      </div>
    </section>
  );
}

function OverviewPanel({ data, childId, tabs, go }: { data: Overview; childId: string; tabs: FamilyTab[]; go: (tab: FamilyTab) => void }) {
  const { t, lang } = useFamilyCopy();
  const date = (iso: string) => new Date(iso).toLocaleDateString(lang === "ar" ? "ar" : "en", { day: "numeric", month: "short" });
  const crisis = data.attention.find((a) => a.code === "CRISIS_NOTE_OPEN");
  const room = tabs.includes("room");
  const next = data.nextStep === "RECORD_TODAY" ? { text: t.overview.nextRecord, tab: "checkin" as const, icon: HeartPulse }
    : data.nextStep === "WRITE_FIRST_NOTE" ? { text: t.overview.nextNote, tab: "journal" as const, icon: BookOpen } : null;

  return (
    <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
      {data.attention.length > 0 && (
        <Cell index={0} className="lg:col-span-3">
          <Card tone={crisis ? "danger" : "warn"} className="flex items-start gap-3 sm:items-center">
            <span aria-hidden className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-xl", crisis ? "bg-rose-100 text-rose-700" : "bg-gold-100 text-gold-700")}><TriangleAlert className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm ">{t.overview.attention}</h2>
              <ul className="mt-0.5 space-y-0.5 text-sm">
                {data.attention.map((a) => (
                  <li key={a.code}>
                    {a.code === "CRISIS_NOTE_OPEN" ? t.overview.crisisOpen(a.data?.careTeamAlerted === true) : a.code === "SAFETY_PLAN_NO_EMERGENCY_NUMBER" ? t.overview.noEmergencyNumber : a.code}
                  </li>
                ))}
              </ul>
            </div>
            {!crisis && tabs.includes("safety") && data.attention.some((a) => a.code === "SAFETY_PLAN_NO_EMERGENCY_NUMBER") && (
              <button type="button" onClick={() => go("safety")} className="hidden shrink-0 items-center gap-1.5 rounded-full bg-white/80 px-4 py-2 text-sm  text-gold-700 ring-1 ring-gold-100 hover:bg-white sm:inline-flex">
                {t.tabs.safety}<ArrowRight aria-hidden className="size-4 rtl:-scale-x-100" />
              </button>
            )}
          </Card>
        </Cell>
      )}

      {room && (
        <Cell index={1} className="lg:col-span-2 lg:row-span-2">
          <RoomPreviewCard childId={childId} onOpen={() => go("room")} className="h-full min-h-[30rem]" />
        </Cell>
      )}

      <Cell index={2} className={cn(!room && "lg:col-span-2")}>
        <Card tone="calm" className="flex h-full flex-col">
          <h2 className="text-sm  text-ink-soft">{t.overview.next}</h2>
          {next ? (
            <>
              <p className="mt-3 flex items-center gap-3 text-lg  leading-snug">
                <span aria-hidden className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm"><next.icon className="size-5" /></span>
                {next.text}
              </p>
              <PrimaryButton className="mt-5 self-start" onClick={() => go(next.tab)}>{t.tabs[next.tab]}<ArrowRight aria-hidden className="size-4 rtl:-scale-x-100" /></PrimaryButton>
            </>
          ) : <p className="mt-3 text-sm text-ink-muted">{t.overview.nextNone}</p>}
        </Card>
      </Cell>

      <Cell index={3}>
        <Card className="h-full">
          <h2 className="flex items-center gap-2 text-sm "><CalendarCheck aria-hidden className="size-4 text-teal-700" />{t.overview.last7}</h2>
          <p className="mt-3 text-[clamp(2rem,1.4rem+1.6vw,2.75rem)]  leading-none tracking-[-0.03em] tabular-nums text-teal-800">{data.last7Days.checkins}<span className="ms-1 text-base font-medium text-ink-subtle">/ 7</span></p>
          {data.childLastSelfCheckin && <p className="mt-4 text-sm text-ink-muted">{t.overview.childAnswered}: <span className="font-medium text-ink">{date(data.childLastSelfCheckin)}</span></p>}
        </Card>
      </Cell>

      <Cell index={4} className="lg:col-span-2">
        <Card className="h-full">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm "><HeartPulse aria-hidden className="size-4 text-teal-700" />{t.overview.lastCheckin}</h2>
            {data.lastCheckin && <span className="text-xs text-ink-muted">{date(data.lastCheckin.date)}</span>}
          </div>
          {data.lastCheckin ? (
            <dl className="mt-4 grid grid-cols-2 gap-2.5 text-sm sm:grid-cols-4">
              {(["mood", "energy", "focus", "sleepHours"] as const).map((f) => (
                <div key={f} className="lm-inset p-3">
                  <dt className="text-xs text-ink-muted">{t.checkin.fields[f]}</dt>
                  <dd className="mt-1 text-lg  tabular-nums">{data.lastCheckin![f] ?? t.checkin.unknown}</dd>
                  {data.lastCheckin![f] !== null && <dd className="text-xs text-ink-muted">{t.source[data.lastCheckin!.sources[f] ?? "OBSERVED"]}</dd>}
                </div>
              ))}
            </dl>
          ) : (
            <div className="lm-inset mt-4 flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="text-sm text-ink-muted">{t.overview.none}</p>
              {tabs.includes("checkin") && <button type="button" onClick={() => go("checkin")} className="text-sm  text-teal-700 underline-offset-4 hover:underline">{t.checkin.title}</button>}
            </div>
          )}
        </Card>
      </Cell>

      <Cell index={5}>
        <Card className="h-full">
          <h2 className="flex items-center gap-2 text-sm "><BookOpen aria-hidden className="size-4 text-teal-700" />{t.overview.recentNotes}</h2>
          {data.recentNotes.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {data.recentNotes.map((n) => (
                <li key={n.id} className="lm-inset flex items-baseline gap-3 px-3 py-2.5">
                  <span className="shrink-0 text-xs tabular-nums text-ink-muted">{date(n.createdAt)}</span>
                  <span className="min-w-0 truncate" dir="auto">{n.title ?? "—"}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-sm text-ink-muted">{t.journal.empty}</p>}
          {tabs.includes("journal") && (
            <button type="button" onClick={() => go("journal")} className="mt-4 inline-flex items-center gap-1.5 text-sm  text-teal-700 underline-offset-4 hover:underline">
              {t.tabs.journal}<ArrowRight aria-hidden className="size-4 rtl:-scale-x-100" />
            </button>
          )}
        </Card>
      </Cell>
    </div>
  );
}

function SpaceSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-5" aria-busy aria-label={label}>
      <div className="lm-glass h-32 animate-pulse" />
      <div className="lm-glass h-14 animate-pulse rounded-full" />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lm-glass h-[30rem] animate-pulse lg:col-span-2" />
        <div className="space-y-5"><div className="lm-glass h-56 animate-pulse" /><div className="lm-glass h-56 animate-pulse" /></div>
      </div>
    </div>
  );
}
