"use client";

import type { CSSProperties } from "react";
import { scaleColor } from "@/lib/patient/moods";

/**
 * A 0–10 (or custom) slider whose fill and thumb take the colour of the value.
 * Always left-to-right so "more" is never mirrored. The native input keeps keyboard
 * and screen-reader behaviour.
 */
export function ScaleSlider({
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
  inverted = false,
  lowLabel,
  highLabel,
  ariaLabel,
  format,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  inverted?: boolean;
  lowLabel?: string;
  highLabel?: string;
  ariaLabel: string;
  format?: (value: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const color = scaleColor(((value - min) / (max - min)) * 10, inverted);
  return (
    <div dir="ltr" className="w-full">
      <div className="mb-3 flex justify-center">
        <span className="rounded-full px-4 py-1 text-2xl  tabular-nums" style={{ color, background: `${color}1a` }}>
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel}
        onChange={(event) => onChange(Number(event.target.value))}
        // Choosing the value the thumb already rests on fires no change event, so confirm it explicitly:
        // otherwise a patient whose answer is the default could never continue.
        onPointerUp={(event) => onChange(Number(event.currentTarget.value))}
        onKeyUp={(event) => {
          if (["Enter", " "].includes(event.key)) onChange(Number(event.currentTarget.value));
        }}
        className="lm-range"
        style={{ "--pct": `${pct}%`, "--range-color": color } as CSSProperties}
      />
      {(lowLabel || highLabel) && (
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </div>
  );
}
