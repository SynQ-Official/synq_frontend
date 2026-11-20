"use client";

import { CountUp } from "@/components/home/CountUp";
import type { PsyPreviewCopy } from "@/lib/i18n/agents";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, CalendarPlus, Check, ChevronRight, ClipboardCheck, FileText, Inbox, NotebookPen, ShieldCheck, TrendingDown, X } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";
import { monthSeries, smoothPath } from "../lumina/chartData";
import { ACTIVITY, ATTENTION_KINDS, ATTENTION_TONES, KPI_DELTAS, KPI_SPARKS, KPI_SPARK_COLORS, PATIENT_ROWS, PSY_COLOR, RISK_VALUES, TRAFFIC } from "./psyData";

const ARROW = "rtl:-scale-x-100";

/** Staggered entrance shared by every block of a screen; collapses to nothing for reduced motion. */
function useRise() {
  const reduce = useReducedMotion();
  return (delay: number) => ({
    initial: reduce ? (false as const) : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: EASE_OUT, delay },
  });
}

/* ─────────── Pieces the real app is built from, drawn the same way ─────────── */

function Panel({ title, description, action, children, className, flush }: { title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string; flush?: boolean }) {
  return (
    <section className={cn("flex min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm", className)}>
      <header className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
        {action}
      </header>
      <div className={cn("min-h-0 flex-1", !flush && "px-5 pb-5")}>{children}</div>
    </section>
  );
}

function Segmented({ options, active = 0 }: { options: readonly string[]; active?: number }) {
  return (
    <div className="inline-flex shrink-0 rounded-lg border border-slate-200/80 bg-slate-100/70 p-0.5">
      {options.map((option, index) => (
        <span key={option} className={cn("rounded-md px-2.5 py-1 text-xs font-medium", index === active ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80" : "text-slate-500")}>
          {option}
        </span>
      ))}
    </div>
  );
}

function Sparkline({ values, color, delay }: { values: readonly number[]; color: string; delay: number }) {
  const reduce = useReducedMotion();
  const id = useId().replace(/:/g, "");
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => [(index / (values.length - 1)) * 100, 28 - ((value - min) / span) * 24] as const);
  const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-9 w-24 shrink-0 overflow-visible rtl:-scale-x-100" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.26} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.path d={`${line} L100,32 L0,32 Z`} fill={`url(#${id})`} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.6, duration: 0.8 }} />
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay, duration: 1.2, ease: EASE_OUT }}
      />
    </svg>
  );
}

function Delta({ pct, goodWhen, caption }: { pct: number | null; goodWhen: "up" | "down"; caption: string }) {
  if (pct === null) return <p className="text-xs text-slate-500">{caption}</p>;
  const up = pct > 0;
  const good = up === (goodWhen === "up");
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
      <span dir="ltr" className={cn("inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold tabular-nums", good ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
        <Icon size={12} aria-hidden />
        {Math.abs(pct)}%
      </span>
      {caption}
    </span>
  );
}

/** Two letters in a soft coloured disc, like the patient avatars of the real lists. */
export function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) {
  const letters = name.replace(/\./g, "").split(/\s+/).map((part) => part[0]).join("").slice(0, 2);
  const palette = ["bg-[#f0fdfa] text-[#115e59] ring-[#99f6e4]", "bg-indigo-50 text-indigo-800 ring-indigo-200", "bg-sky-50 text-sky-800 ring-sky-200", "bg-violet-50 text-violet-800 ring-violet-200"];
  const hue = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length;
  return (
    <span aria-hidden className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold ring-1", size === "sm" ? "size-8 text-[11px]" : "size-14 text-lg", palette[hue])}>
      {letters}
    </span>
  );
}

export function TrafficChip({ light, label }: { light: 0 | 1 | 2; label: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset", TRAFFIC[light].chip)}>
      <span className="size-1.5 rounded-full" style={{ background: TRAFFIC[light].color }} />
      {label}
    </span>
  );
}

function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-medium text-[#0f766e]">{eyebrow}</p>}
        {/* A screen inside the product mockup, not the page's own heading (that is the hero <h1>). */}
        <h3 className="mt-1 text-[1.625rem] font-semibold leading-tight tracking-tight text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

const buttonBase = "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium";
const GhostButton = ({ children }: { children: ReactNode }) => <span className={cn(buttonBase, "border border-slate-200 bg-white text-slate-700 shadow-sm")}>{children}</span>;
const InkButton = ({ children }: { children: ReactNode }) => <span className={cn(buttonBase, "bg-slate-900 text-white shadow-sm")}>{children}</span>;

/* ─────────── The activity chart: thirty days of sessions, stacked ─────────── */

function ActivityChart({ legend }: { legend: readonly string[] }) {
  const reduce = useReducedMotion();
  const W = 600;
  const H = 168;
  const left = 22;
  const base = 146;
  const top = 8;
  const yMax = 6;
  const step = (W - left) / ACTIVITY.length;
  const barW = step * 0.58;
  const colors = [PSY_COLOR.teal, PSY_COLOR.tealSoft, PSY_COLOR.slate] as const;
  const totals = colors.map((_, series) => ACTIVITY.reduce((sum, day) => sum + day[series], 0));
  const unit = (base - top) / yMax;

  return (
    <div>
      <dl className="mb-3 flex flex-wrap gap-x-6 gap-y-2">
        {legend.map((label, index) => (
          <div key={label}>
            <dt className="flex items-center gap-1.5 text-xs text-slate-500">
              <span aria-hidden className="size-2 rounded-sm" style={{ background: colors[index] }} />
              {label}
            </dt>
            <dd dir="ltr" className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900 tabular-nums rtl:text-end">
              <CountUp value={String(totals[index])} />
            </dd>
          </div>
        ))}
      </dl>
      <svg style={{ direction: "ltr" }} viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden>
        {[0, 2, 4, 6].map((tick) => (
          <g key={tick}>
            <line x1={left} x2={W} y1={base - tick * unit} y2={base - tick * unit} stroke="#f1f5f9" strokeDasharray="3 3" />
            <text x={left - 8} y={base - tick * unit + 3.5} textAnchor="end" fontSize="10" fill="#64748b">
              {tick}
            </text>
          </g>
        ))}
        {ACTIVITY.map((day, index) => {
          let y = base;
          return (
            <motion.g
              key={index}
              style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
              initial={reduce ? false : { scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.35 + index * 0.018 }}
            >
              {day.map((value, series) => {
                if (!value) return null;
                const height = value * unit;
                y -= height;
                return <rect key={series} x={left + index * step + (step - barW) / 2} y={y} width={barW} height={height - 1} rx={series === 2 ? 2 : 1.5} fill={colors[series]} />;
              })}
            </motion.g>
          );
        })}
        {[0, 7, 14, 21, 29].map((index) => (
          <text key={index} x={left + index * step + step / 2} y={base + 18} textAnchor="middle" fontSize="10" fill="#64748b">
            {index + 1}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ─────────── Overview ─────────── */

/**
 * The overview, as the app's first screen: the greeting and its two buttons, four KPIs with a trend each, the month's activity
 * beside the caseload's risk, what needs the clinician, today's agenda and the patients to see first.
 */
export function OverviewScreen({ copy, compact }: { copy: PsyPreviewCopy; compact: boolean }) {
  const rise = useRise();
  const total = RISK_VALUES.reduce((sum, value) => sum + value, 0);

  return (
    <div className="space-y-5">
      <motion.div {...rise(0.05)}>
        <PageHeader
          title={copy.greeting}
          description={copy.summary}
          actions={
            <>
              <Segmented options={[copy.period]} />
              {!compact && (
                <>
                  <GhostButton>
                    <AlertTriangle size={14} aria-hidden /> {copy.actions[0]}
                  </GhostButton>
                  <InkButton>
                    <CalendarPlus size={14} aria-hidden /> {copy.actions[1]}
                  </InkButton>
                </>
              )}
            </>
          }
        />
      </motion.div>

      <motion.dl {...rise(0.15)} className={cn("grid gap-px overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-200/70 shadow-sm", compact ? "grid-cols-2" : "grid-cols-4")}>
        {copy.kpis.map(([label, value, caption], index) => (
          <div key={label} className="bg-white p-4">
            <dt className="flex items-center gap-1.5 text-[13px] font-medium text-slate-600">
              {index === 0 && <span aria-hidden className="size-1.5 rounded-full bg-red-500" />}
              {index === 3 && <span aria-hidden className="size-1.5 rounded-full bg-amber-500" />}
              <span className="truncate">{label}</span>
            </dt>
            <dd className="mt-2 flex items-end justify-between gap-2">
              <span className="min-w-0">
                <span dir="ltr" className="block text-[1.75rem] font-semibold leading-none tracking-tight text-slate-900 tabular-nums rtl:text-end">
                  <CountUp value={value} />
                </span>
                <span className="mt-2.5 block min-h-5">
                  <Delta pct={KPI_DELTAS[index].pct} goodWhen={KPI_DELTAS[index].goodWhen} caption={caption} />
                </span>
              </span>
              {!compact && KPI_SPARKS[index].length > 0 && <Sparkline values={KPI_SPARKS[index]} color={KPI_SPARK_COLORS[index]} delay={0.4 + index * 0.12} />}
            </dd>
          </div>
        ))}
      </motion.dl>

      <motion.div {...rise(0.3)} className={cn("grid gap-5", !compact && "grid-cols-3")}>
        <Panel className={cn(!compact && "col-span-2")} title={copy.activity.title} description={copy.activity.description} action={compact ? undefined : <Segmented options={copy.activity.tabs} />}>
          <ActivityChart legend={copy.activity.legend} />
        </Panel>

        <Panel title={copy.risk.title} description={copy.risk.description}>
          <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-slate-100">
            {RISK_VALUES.map((value, index) => (
              <motion.span
                key={index}
                className="h-full first:rounded-s-full last:rounded-e-full"
                style={{ background: TRAFFIC[index].color }}
                initial={{ width: 0 }}
                animate={{ width: `${(value / total) * 100}%` }}
                transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.5 + index * 0.1 }}
              />
            ))}
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-2">
            {copy.risk.labels.map((label, index) => (
              <div key={label} className="min-w-0">
                <dt className="flex items-center gap-1.5 truncate text-xs text-slate-500">
                  <span aria-hidden className="size-2 shrink-0 rounded-sm" style={{ background: TRAFFIC[index].color }} />
                  {label}
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-900 tabular-nums">
                  {RISK_VALUES[index]}
                  <span className="ms-1 text-xs font-normal text-slate-500">{Math.round((RISK_VALUES[index] / total) * 100)}%</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50/60 px-3 py-2 text-xs font-medium text-orange-800">
            <TrendingDown size={14} className="shrink-0" aria-hidden />
            <span className="min-w-0 flex-1">{copy.risk.worsened}</span>
            <ChevronRight size={13} className={cn("shrink-0", ARROW)} aria-hidden />
          </p>
        </Panel>
      </motion.div>

      <motion.div {...rise(0.45)} className={cn("grid gap-5", !compact && "grid-cols-3")}>
        <Panel className={cn(!compact && "col-span-2")} title={copy.attention.title} description={copy.attention.description} flush>
          <ul className="divide-y divide-slate-100 border-t border-slate-100">
            {copy.attention.items.map(([title, meta, badge], index) => {
              const kind = ATTENTION_KINDS[index];
              const Icon = kind === "alert" ? AlertTriangle : kind === "report" ? FileText : ClipboardCheck;
              const badgeTone = ["bg-orange-50 text-orange-700 ring-orange-200", "bg-amber-50 text-amber-700 ring-amber-200", "bg-red-50 text-red-700 ring-red-200", "bg-sky-50 text-sky-700 ring-sky-200"][index];
              return (
                <li key={title} className="flex items-center gap-3 px-5 py-3">
                  <span aria-hidden className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", ATTENTION_TONES[kind])}>
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-slate-900">{title}</span>
                    <span className="block truncate text-xs text-slate-500">{meta}</span>
                  </span>
                  <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset", badgeTone)}>{badge}</span>
                  <ChevronRight size={15} aria-hidden className={cn("shrink-0 text-slate-300", ARROW)} />
                </li>
              );
            })}
          </ul>
        </Panel>

        {!compact && (
          <Panel title={copy.agenda.title} description={copy.agenda.description}>
            <p className="mb-1.5 text-[11px] font-medium text-slate-500">{copy.agenda.today}</p>
            <ol className="space-y-1">
              {copy.agenda.items.map(([time, patient, line], index) => (
                <li key={time} className="flex items-center gap-3 rounded-lg px-2 py-2">
                  <span dir="ltr" className="w-11 shrink-0 text-xs font-semibold text-slate-900 tabular-nums">
                    {time}
                  </span>
                  <span aria-hidden className={cn("h-7 w-0.5 shrink-0 rounded-full", index === 0 ? "bg-[#0d9488]" : "bg-[#99f6e4]")} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-slate-900">{patient}</span>
                    <span className="block text-[11px] text-slate-500">{line}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
        )}
      </motion.div>

      {!compact && (
        <motion.div {...rise(0.6)}>
          <Panel title={copy.patients.title} description={copy.patients.description} flush>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/60 text-start text-xs font-medium text-slate-500">
                  {copy.patients.columns.map((column, index) => (
                    <th key={column} scope="col" className={cn("py-2.5 font-medium", index === 0 ? "px-5 text-start" : index > 2 ? "px-3 text-end last:px-5" : "px-3 text-start")}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {copy.patients.rows.map(([name, code, last], index) => {
                  const [light, drift, alerts, worsened] = PATIENT_ROWS[index];
                  return (
                    <tr key={code}>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-3">
                          <Avatar name={name} />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-slate-900">{name}</span>
                            <span dir="ltr" className="block text-start text-xs text-slate-500 rtl:text-end">
                              {code}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-1.5">
                          <TrafficChip light={light} label={copy.risk.labels[light]} />
                          {worsened && <ArrowDownRight size={14} className="text-red-500" aria-hidden />}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <motion.span
                              className="block h-full rounded-full"
                              style={{ background: TRAFFIC[light].color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${drift * 100}%` }}
                              transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.8 + index * 0.08 }}
                            />
                          </span>
                          <span dir="ltr" className="text-xs font-medium text-slate-700 tabular-nums">
                            {drift.toFixed(2)}
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-3 text-end tabular-nums">{alerts > 0 ? <span className="font-semibold text-red-700">{alerts}</span> : <span className="text-slate-400">0</span>}</td>
                      <td className="px-5 py-3 text-end text-xs text-slate-500">{last}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>
        </motion.div>
      )}
    </div>
  );
}

/* ─────────── Requests ─────────── */

/** The inbox of patients proposed to the clinician: the amber banner, two rows, and the first one accepted on its own. */
export function RequestsScreen({ copy, compact }: { copy: PsyPreviewCopy; compact: boolean }) {
  const reduce = useReducedMotion();
  const rise = useRise();
  const { requests } = copy;
  const [accepted, setAccepted] = useState(reduce ?? false);

  useEffect(() => {
    if (reduce) return;
    const timer = window.setTimeout(() => setAccepted(true), 1600);
    return () => window.clearTimeout(timer);
  }, [reduce]);

  return (
    <div className="space-y-5">
      <motion.div {...rise(0.05)}>
        <PageHeader title={requests.title} description={requests.description} />
      </motion.div>

      <motion.div {...rise(0.15)} className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white px-5 py-3.5">
        <span className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
            <Inbox size={17} aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-semibold text-amber-950">{requests.waiting}</span>
            <span className="block text-xs text-amber-900/70">{requests.note}</span>
          </span>
        </span>
      </motion.div>

      <motion.div {...rise(0.3)}>
        <Panel title={requests.title} description={requests.description} flush>
          <ul className="divide-y divide-slate-100 border-t border-slate-100">
            {requests.items.map(([name, code, line, wait], index) => {
              const done = index === 0 && accepted;
              return (
                <li key={code} className={cn("flex gap-3 px-5 py-4", compact ? "flex-col" : "items-center justify-between")}>
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar name={name} />
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-slate-900">
                        {name}
                        <span dir="ltr" className="text-xs font-normal text-slate-500">
                          {code}
                        </span>
                        {index === 0 && <span className="rounded-md bg-[#f0fdfa] px-1.5 py-0.5 text-[11px] font-medium text-[#115e59]">{requests.primary}</span>}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">{line}</span>
                      <span className="mt-0.5 block text-xs font-medium text-amber-700">{wait}</span>
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-2">
                    {done ? (
                      <span className={cn(buttonBase, "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200")}>
                        <Check size={14} strokeWidth={3} aria-hidden /> {requests.accepted}
                      </span>
                    ) : (
                      <>
                        <GhostButton>
                          <X size={14} aria-hidden /> {requests.decline}
                        </GhostButton>
                        <InkButton>
                          <Check size={14} aria-hidden /> {requests.accept}
                        </InkButton>
                      </>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </motion.div>
    </div>
  );
}

/* ─────────── One patient ─────────── */

const CHART = { w: 520, h: 150, top: 46, bottom: 98 } as const;
const SERIES = monthSeries(CHART.w, CHART.top, CHART.bottom, 1.7);
const LINE = smoothPath(SERIES);
const LAST = SERIES[SERIES.length - 1];

export function LifeChart({ band }: { band: string }) {
  const reduce = useReducedMotion();
  const id = useId().replace(/:/g, "");
  return (
    <div>
      <svg style={{ direction: "ltr" }} viewBox={`0 0 ${CHART.w} ${CHART.h}`} className="h-auto w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={PSY_COLOR.teal} stopOpacity="0.24" />
            <stop offset="1" stopColor={PSY_COLOR.teal} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[20, 74, 128].map((y) => (
          <line key={y} x1="0" x2={CHART.w} y1={y} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
        ))}
        <motion.rect x="0" y={CHART.top} width={CHART.w} height={CHART.bottom - CHART.top} rx="10" fill={PSY_COLOR.tealFaint} stroke={PSY_COLOR.tealSoft} strokeOpacity="0.6" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }} />
        <motion.path d={`${LINE} L ${CHART.w} ${CHART.h} L 0 ${CHART.h} Z`} fill={`url(#${id})`} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.9 }} />
        <motion.path d={LINE} fill="none" stroke={PSY_COLOR.teal} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease: EASE_OUT, delay: 0.3 }} />
        <motion.circle cx={LAST[0]} cy={LAST[1]} r="5" fill={PSY_COLOR.teal} stroke="#fff" strokeWidth="2" initial={reduce ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.8, type: "spring", stiffness: 300, damping: 16 }} style={{ transformBox: "fill-box", transformOrigin: "center" }} />
      </svg>
      <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
        <span className="h-2 w-4 rounded-sm bg-[#f0fdfa] ring-1 ring-[#99f6e4]" />
        {band}
      </p>
    </div>
  );
}

/** A patient's page: the summary card and the open alert on one side, the tabs and the month against their own range on the other. */
export function PatientScreen({ copy, compact }: { copy: PsyPreviewCopy; compact: boolean }) {
  const rise = useRise();
  const { patient } = copy;

  return (
    <div className="space-y-4">
      <motion.p {...rise(0.05)} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500">
        <ArrowLeft size={14} className="rtl:-scale-x-100" aria-hidden /> {patient.back}
      </motion.p>
      <motion.p {...rise(0.1)} className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] leading-5 text-amber-900">
        <ShieldCheck size={15} className="mt-0.5 shrink-0" aria-hidden />
        {patient.notShared}
      </motion.p>

      <div className={cn("grid items-start gap-5", !compact && "grid-cols-[250px_minmax(0,1fr)]")}>
        <motion.aside {...rise(0.2)} className="space-y-4">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3.5">
              <Avatar name={patient.name} size="lg" />
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold tracking-tight text-slate-900">{patient.name}</h2>
                <p dir="ltr" className="text-start text-[13px] text-slate-500 rtl:text-end">
                  {patient.code}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <TrafficChip light={0} label={copy.risk.labels[0]} />
              {patient.chips.map((chip) => (
                <span key={chip} dir="auto" className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {chip}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs font-medium text-slate-500">{patient.statusTitle}</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-slate-100 pt-3 text-[13px]">
              {patient.facts.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="font-medium text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-2xl border border-red-200 bg-white shadow-sm">
            <h3 className="flex items-center gap-1.5 px-5 pb-2 pt-4 text-xs font-semibold text-red-800">
              <AlertTriangle size={13} aria-hidden /> {patient.alertsTitle}
            </h3>
            <p className="flex items-start gap-2.5 px-5 pb-4">
              <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: PSY_COLOR.orange }} />
              <span className="text-[13px] font-medium text-slate-900">{patient.alert}</span>
            </p>
          </section>
        </motion.aside>

        <motion.div {...rise(0.35)} className="min-w-0">
          <ul className="flex gap-5 border-b border-slate-200 text-[13px] font-medium text-slate-500">
            {patient.tabs.map((tab, index) => (
              <li key={tab} className={cn("-mb-px border-b-2 pb-2.5", index === 0 ? "border-[#0f766e] text-slate-900" : "border-transparent")}>
                {tab}
              </li>
            ))}
          </ul>

          <Panel className="mt-5" title={patient.chartTitle}>
            <LifeChart band={patient.baseline} />
            <p className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-[#0f766e]">
              <span className="size-2 rounded-full bg-[#0d9488]" />
              {patient.verdict}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {patient.signals.map((signal, index) => (
                <motion.li
                  key={signal}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 20, delay: 0.9 + index * 0.1 }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#99f6e4] bg-[#f0fdfa] px-3 py-1 text-xs font-medium text-[#115e59]"
                >
                  <span className="size-1.5 rounded-full bg-[#0d9488]" />
                  {signal}
                </motion.li>
              ))}
            </ul>
          </Panel>
        </motion.div>
      </div>
    </div>
  );
}

/* ─────────── A monthly report ─────────── */

/** A monthly report open beside the list: its sections, the annotation settling in, and the acknowledge button turning green. */
export function ReportsScreen({ copy, compact }: { copy: PsyPreviewCopy; compact: boolean }) {
  const reduce = useReducedMotion();
  const rise = useRise();
  const { report } = copy;
  const [done, setDone] = useState(reduce ?? false);
  const spark = smoothPath(monthSeries(120, 6, 30));

  useEffect(() => {
    if (reduce) return;
    const timer = window.setTimeout(() => setDone(true), 2000);
    return () => window.clearTimeout(timer);
  }, [reduce]);

  return (
    <div className="space-y-5">
      <motion.div {...rise(0.05)}>
        <PageHeader title={report.title} description={report.description} />
      </motion.div>

      <div className={cn("grid items-start gap-5", !compact && "grid-cols-[220px_minmax(0,1fr)]")}>
        {!compact && (
          <motion.ul {...rise(0.15)} className="space-y-2">
            {copy.patients.rows.slice(1, 4).map(([name], index) => (
              <li key={name} className={cn("flex items-center gap-2.5 rounded-xl border p-3", index === 1 ? "border-[#99f6e4] bg-[#f0fdfa]/60 shadow-sm" : "border-slate-200/80 bg-white")}>
                <Avatar name={name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-slate-900">{name}</span>
                  <span className="block truncate text-[11px] text-slate-500">{report.period}</span>
                </span>
                <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: TRAFFIC[index === 1 ? 0 : index === 0 ? 1 : 2].color }} />
              </li>
            ))}
          </motion.ul>
        )}

        <motion.div {...rise(0.3)}>
          <Panel
            title={report.headline}
            description={`${report.patient} · ${report.period}`}
            action={<TrafficChip light={0} label={copy.risk.labels[0]} />}
          >
            <ul className="grid gap-3 sm:grid-cols-3">
              {report.sections.map((section, index) => (
                <motion.li key={section} {...rise(0.5 + index * 0.12)} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <p className="text-xs font-semibold text-[#0f766e]">{section}</p>
                  {index === 0 ? (
                    <svg style={{ direction: "ltr" }} viewBox="0 0 120 36" className="mt-2 h-9 w-full" preserveAspectRatio="none" aria-hidden>
                      <path d={spark} fill="none" stroke={PSY_COLOR.teal} strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                    </svg>
                  ) : (
                    <div className="mt-3 space-y-1.5" aria-hidden>
                      <span className="block h-1.5 w-full rounded-full bg-slate-200" />
                      <span className={cn("block h-1.5 rounded-full bg-slate-200", index === 1 ? "w-3/5" : "w-4/5")} />
                    </div>
                  )}
                </motion.li>
              ))}
            </ul>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT, delay: 1.1 }}
              className="mt-4 rounded-xl border border-[#99f6e4] bg-[#f0fdfa]/70 p-4"
            >
              <p className="flex items-center gap-2 text-xs font-semibold text-[#115e59]">
                <NotebookPen size={14} aria-hidden /> {report.annotate}
              </p>
              <p className="mt-1.5 text-[13px] leading-6 text-slate-800">{report.annotation}</p>
            </motion.div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <CalendarDays size={13} aria-hidden /> {report.period}
              </span>
              <span className={cn(buttonBase, "transition-colors duration-500", done ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-slate-900 text-white")}>
                <Check size={14} strokeWidth={done ? 3 : 2} aria-hidden /> {done ? report.acknowledged : report.acknowledge}
                {!done && <ArrowRight size={13} className={ARROW} aria-hidden />}
              </span>
            </div>
          </Panel>
        </motion.div>
      </div>
    </div>
  );
}
