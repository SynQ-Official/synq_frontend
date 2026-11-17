"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type TrendPoint = { label: string; value: number | null };

/**
 * A chart's size is unknown until its container has been laid out and measured; Recharts starts from -1 and warns about it
 * on every mount. A minimal positive size for that first render keeps the console clean without drawing anything at a
 * wrong size: the real one arrives with the first measurement.
 */
export const FIRST_MEASURE = { width: 1, height: 1 } as const;

/**
 * Soft area chart for a series (0–10 by default; pass `domain`/`ticks` for another scale). Gaps stay gaps (no invented values). The time axis is
 * always left-to-right, also in Arabic, so "later" never flips meaning.
 */
export function TrendChart({
  data,
  color = "var(--color-teal-600)",
  height = 180,
  domain = [0, 10],
  ticks = [0, 5, 10],
  unit,
  className,
}: {
  data: TrendPoint[];
  color?: string;
  height?: number;
  domain?: [number, number];
  ticks?: number[];
  unit?: string;
  className?: string;
}) {
  const gradientId = useId().replace(/:/g, "");
  return (
    <div dir="ltr" style={{ height }} className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height="100%" initialDimension={FIRST_MEASURE}>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -6, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.38} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgb(44 62 59 / 0.07)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#5f716e" }} interval="preserveStartEnd" />
          <YAxis domain={domain} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8a9a97" }} ticks={ticks} width={34} />
          <Tooltip
            cursor={{ stroke: color, strokeOpacity: 0.25 }}
            contentStyle={{ borderRadius: 12, border: "1px solid #e4e9e8", boxShadow: "0 8px 24px -12px rgb(44 62 59 / 0.3)", fontSize: 12 }}
            formatter={(value) => [`${value}${unit ?? ""}`, ""]}
            separator=""
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            connectNulls={false}
            dot={{ r: 3, strokeWidth: 2, fill: "#fff", stroke: color }}
            activeDot={{ r: 5 }}
            isAnimationActive
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** A tiny line with no axes, for cards. */
export function Sparkline({ values, color = "var(--color-teal-600)", height = 40, domain = [0, 10] }: { values: (number | null)[]; color?: string; height?: number; domain?: [number, number] }) {
  const gradientId = useId().replace(/:/g, "");
  const data = values.map((value, index) => ({ index, value }));
  return (
    <div dir="ltr" style={{ height }} className="w-full" aria-hidden>
      <ResponsiveContainer width="100%" height="100%" initialDimension={FIRST_MEASURE}>
        <AreaChart data={data} margin={{ top: 4, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={domain} />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} connectNulls dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
