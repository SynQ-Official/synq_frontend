"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type SignalDatum = { key: string; label: string; percent: number; raw: number };

/** Axis label split over two lines when it is long, so the longest spectrum name is never clipped by the chart edge. */
type TickProps = { x?: number | string; y?: number | string; cy?: number | string; textAnchor?: string; payload?: { value?: string | number } };

function AxisTick({ x: rawX = 0, y: rawY = 0, cy: rawCy = 0, textAnchor, payload }: TickProps) {
  const x = Number(rawX);
  const y = Number(rawY);
  const cy = Number(rawCy);
  const text = String(payload?.value ?? "");
  const words = text.split(" ");
  const lines = text.length > 14 && words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")] : [text];
  // Labels above the centre sit higher, so the second line never touches the chart.
  const dy = y < cy ? -(lines.length - 1) * 15 : 0;
  return (
    <text x={x} y={y + dy} textAnchor={textAnchor as "start" | "middle" | "end" | undefined} fill="var(--color-ink-soft)" fontSize={12.5} fontWeight={500}>
      {lines.map((line, i) => (
        <tspan key={line} x={x} dy={i === 0 ? 0 : 15}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

/**
 * Primary comparison chart: a radar/spider chart is the right chart type here
 * because we're comparing 3+ named dimensions (condition scores) against the
 * same 0–100 scale at once — a shape a stack of bars can't show as directly.
 */
export function SignalRadar({ data, label }: { data: SignalDatum[]; label: string }) {
  const reduceMotion = useReducedMotion();
  const chartData = data.map((d) => ({ subject: d.label, value: d.percent, fullMark: 100 }));

  return (
    <div className="h-72 w-full sm:h-80 xl:h-[22rem]" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} margin={{ top: 24, right: 36, bottom: 24, left: 36 }} outerRadius="76%">
          <PolarGrid stroke="var(--color-line-strong)" strokeOpacity={0.7} />
          <PolarAngleAxis dataKey="subject" tick={(props) => <AxisTick {...props} />} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name={label}
            dataKey="value"
            stroke="var(--color-teal-700)"
            fill="var(--color-teal-500)"
            fillOpacity={0.26}
            strokeWidth={2}
            dot={{ r: 3.5, fill: "var(--color-gold)", stroke: "#fff", strokeWidth: 1.5 }}
            isAnimationActive={!reduceMotion}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Exact numeric readout that pairs with the radar — accessible list, one row per condition, each with its own bar. */
export function SignalList({ data, strongestLabel }: { data: SignalDatum[]; strongestLabel?: string }) {
  return (
    <ul className="space-y-1">
      {data.map((item, i) => {
        const strongest = i === 0;
        return (
          <li
            key={item.key}
            title={`${item.label}: ${item.raw.toFixed(3)}`}
            className="rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-teal-50/70"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0">
                <span className={cn("block text-[0.9375rem] leading-snug", strongest ? "font-semibold text-ink" : "text-ink-soft")}>{item.label}</span>
                {strongest && strongestLabel ? <span className="mt-0.5 block text-[0.75rem] font-medium text-gold-700">{strongestLabel}</span> : null}
              </span>
              <span className="shrink-0 text-[0.9375rem] font-semibold tabular-nums text-ink" dir="ltr">
                {item.percent}
                <span className="text-[0.8125rem] font-normal text-ink-muted">%</span>
              </span>
            </div>
            <span aria-hidden className="mt-2 block h-1.5 overflow-hidden rounded-full bg-teal-100">
              <motion.span
                className={cn("block h-full origin-left rounded-full rtl:origin-right", strongest ? "bg-[linear-gradient(90deg,var(--color-teal-600),var(--color-gold))]" : "bg-teal-400")}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: Math.max(0.02, item.percent / 100) }}
                viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                transition={{ duration: 1, delay: 0.1 + i * 0.08, ease: EASE_OUT }}
              />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

const LEVELS = ["LOW", "MODERATE", "HIGH"] as const;

export function MatchStrengthMeter({
  level,
  label,
  levelLabel,
  tone = "default",
  hideLabel = false,
}: {
  level: (typeof LEVELS)[number];
  label: string;
  levelLabel: string;
  /** The surrounding tile already names the metric; keep the label for assistive tech only. */
  hideLabel?: boolean;
  /** "inverse" renders light-on-dark for the result hero (prints in brand teal). */
  tone?: "default" | "inverse";
}) {
  const filled = LEVELS.indexOf(level) + 1;
  const inverse = tone === "inverse";
  return (
    <div className="min-w-0">
      <p className={cn("text-[0.8125rem]", inverse ? "text-teal-100" : "text-ink-soft", hideLabel && "sr-only")}>{label}</p>
      <div className={cn("flex items-center gap-3", !hideLabel && "mt-1.5")}>
        <div role="meter" aria-label={label} aria-valuemin={1} aria-valuemax={3} aria-valuenow={filled} aria-valuetext={levelLabel} className="flex gap-1">
          {LEVELS.map((step, i) => (
            <span key={step} className={cn("h-2 w-8 overflow-hidden rounded-full", inverse ? "bg-white/20 print:bg-teal-100" : "bg-teal-100")}>
              <motion.span
                className={cn("block h-full origin-left rounded-full rtl:origin-right", inverse ? "bg-white print:bg-teal-600" : "bg-teal-700")}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: i < filled ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.14, ease: EASE_OUT }}
              />
            </span>
          ))}
        </div>
        <span className={cn("text-[0.9375rem] font-semibold", inverse ? "text-white" : "text-ink")}>{levelLabel}</span>
      </div>
    </div>
  );
}
