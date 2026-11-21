"use client";

import { AgentAvatar } from "@/components/layout/site-header";
import { SERIF } from "@/components/home/typography";
import type { MiraPreviewCopy } from "@/lib/i18n/agents";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Download, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

/** Example strength of each screening area, 0–100, in the order of `result.areas`. */
const EXAMPLE_SCORES = [64, 38, 12] as const;
const CURRENT_CHAPTER = 2;

/** Mount-time reveal: these screens remount when the step changes, so they animate on mount, not on scroll. */
const rise = (delay: number, reduce: boolean | null) => ({
  initial: reduce ? false : { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: EASE_OUT, delay },
});

/** Room under the notch, one column, and an app bar that every screen shares. */
function Screen({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#ffffff,var(--color-canvas))] px-4 pb-5 pt-12">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <AgentAvatar agent="mira" className="size-8 rounded-xl ring-1 ring-line" />
          <span className="text-[0.875rem]  text-ink">Mira</span>
        </span>
        {right}
      </div>
      {children}
    </div>
  );
}

function Pill({ children, tone = "teal" }: { children: ReactNode; tone?: "teal" | "sage" | "gold" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.6875rem] ",
        tone === "teal" && "border-teal-200 bg-teal-50 text-teal-700",
        tone === "sage" && "border-sage-100 bg-sage-50 text-sage-700",
        tone === "gold" && "border-gold-100 bg-gold-100 text-gold-700",
      )}
    >
      {children}
    </span>
  );
}

function ChapterRail({ chapters }: { chapters: readonly string[] }) {
  const reduce = useReducedMotion();
  return (
    <ol className="mt-4 grid grid-cols-4 gap-1.5">
      {chapters.map((chapter, index) => (
        <li key={chapter} className="min-w-0">
          <span className="relative block h-1 overflow-hidden rounded-full bg-line">
            <motion.span
              className={cn("absolute inset-0 origin-left rounded-full rtl:origin-right", index === CURRENT_CHAPTER ? "bg-gold" : "bg-teal-500")}
              initial={reduce ? false : { scaleX: 0 }}
              animate={{ scaleX: index <= CURRENT_CHAPTER ? 1 : 0 }}
              transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.2 + index * 0.12 }}
            />
          </span>
          <span className={cn("mt-1 block truncate text-[0.625rem] font-medium", index === CURRENT_CHAPTER ? "text-ink" : "text-ink-muted")}>{chapter}</span>
        </li>
      ))}
    </ol>
  );
}

function TypingDots() {
  const reduce = useReducedMotion();
  return (
    <span aria-hidden className="inline-flex items-center gap-1">
      {[0, 1, 2].map((dot) => (
        <motion.span
          key={dot}
          className="size-1.5 rounded-full bg-teal-500"
          animate={reduce ? undefined : { opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: dot * 0.18, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

/** The hero phone: a slice of the conversation. */
export function ChatScreen({ copy }: { copy: MiraPreviewCopy }) {
  const reduce = useReducedMotion();
  const { chat } = copy;
  return (
    <Screen right={<Pill>{chat.chapter}</Pill>}>
      <ChapterRail chapters={copy.chapters} />
      <div className="mt-5 space-y-2.5">
        <motion.p {...rise(0.4, reduce)} className="max-w-[92%] rounded-2xl rounded-ss-md bg-teal-50 px-3.5 py-2.5 text-[0.8125rem] leading-5 text-ink">
          {chat.question}
        </motion.p>
        <motion.p {...rise(0.9, reduce)} className="ms-auto w-fit max-w-[82%] rounded-2xl rounded-se-md bg-ink px-3.5 py-2.5 text-[0.8125rem] leading-5 text-white">
          {chat.answer}
        </motion.p>
        <motion.p {...rise(1.4, reduce)} className="flex items-center gap-2 ps-1 text-[0.75rem] text-ink-muted">
          <TypingDots />
          {chat.typing}
        </motion.p>
      </div>
      <div className="mt-auto flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-[0.75rem] text-ink-subtle shadow-xs">
        <span className="flex-1 truncate">…</span>
        <span className="flex size-6 items-center justify-center rounded-full bg-ink text-white">
          <Check className="size-3" aria-hidden />
        </span>
      </div>
    </Screen>
  );
}

export function HelloScreen({ copy }: { copy: MiraPreviewCopy["screens"]["hello"] }) {
  const reduce = useReducedMotion();
  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <motion.span {...rise(0, reduce)} className="relative flex size-24 items-center justify-center">
          {[0, 1].map((ring) => (
            <motion.span
              key={ring}
              aria-hidden
              className="absolute inset-0 rounded-full border border-teal-300"
              animate={reduce ? undefined : { scale: [1, 1.5], opacity: [0.6, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: ring * 1.5, ease: "easeOut" }}
            />
          ))}
          <AgentAvatar agent="mira" className="size-20 rounded-3xl ring-1 ring-line shadow-float" />
        </motion.span>
        <motion.p {...rise(0.2, reduce)} className={cn(SERIF, "mt-6 text-[1.625rem] font-light leading-tight tracking-[-0.02em] text-ink rtl:font-normal rtl:tracking-normal")}>
          {copy.greeting}
        </motion.p>
        <motion.p {...rise(0.35, reduce)} className="mt-1.5 text-[0.875rem] text-ink-soft">
          {copy.ask}
        </motion.p>
        <motion.div {...rise(0.5, reduce)} className="mt-6 flex w-full items-center rounded-2xl border border-teal-300 bg-white px-4 py-3 text-start shadow-[0_0_0_4px_rgb(91_144_145/0.12)]">
          <span className="text-[0.9375rem] font-medium text-ink">
            {Array.from(copy.name).map((char, index) => (
              <motion.span key={`${char}-${index}`} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 + index * 0.18 }}>
                {char}
              </motion.span>
            ))}
          </span>
          <motion.span aria-hidden className="ms-0.5 h-4 w-px bg-teal-600" animate={reduce ? undefined : { opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} />
        </motion.div>
      </div>
      <motion.span {...rise(0.7, reduce)} className="flex min-h-11 items-center justify-center rounded-full bg-ink text-[0.875rem]  text-white">
        {copy.cta}
      </motion.span>
    </Screen>
  );
}

export function DaysScreen({ copy, chapters }: { copy: MiraPreviewCopy["screens"]["days"]; chapters: readonly string[] }) {
  const reduce = useReducedMotion();
  return (
    <Screen right={<Pill>{copy.chapter}</Pill>}>
      <ChapterRail chapters={chapters} />
      <motion.p {...rise(0.3, reduce)} className="mt-6 rounded-2xl rounded-ss-md bg-teal-50 px-4 py-3.5 text-[0.9375rem] leading-6 text-ink">
        {copy.question}
      </motion.p>
      <ul className="mt-5 space-y-2.5">
        {copy.options.map((option, index) => {
          const picked = index === 1;
          return (
            <motion.li
              key={option}
              {...rise(0.55 + index * 0.1, reduce)}
              className="relative flex min-h-12 items-center justify-between overflow-hidden rounded-2xl border border-line bg-white px-4 text-[0.9375rem] font-medium text-ink-soft"
            >
              {picked && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 origin-left bg-teal-600 rtl:origin-right"
                  initial={reduce ? false : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, ease: EASE_OUT, delay: 1.5 }}
                />
              )}
              <motion.span className="relative" animate={picked ? { color: "#ffffff" } : undefined} transition={{ delay: 1.7, duration: 0.3 }}>
                {option}
              </motion.span>
              {picked && (
                <motion.span className="relative flex size-5 items-center justify-center rounded-full bg-white text-teal-700" initial={reduce ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.9, type: "spring", stiffness: 400, damping: 18 }}>
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                </motion.span>
              )}
            </motion.li>
          );
        })}
      </ul>
    </Screen>
  );
}

export function SafetyScreen({ copy }: { copy: MiraPreviewCopy["screens"]["safety"] }) {
  const reduce = useReducedMotion();
  const bars = [0.35, 0.7, 0.5, 0.95, 0.6, 0.85, 0.4, 0.7, 0.3];
  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <span className="relative flex size-28 items-center justify-center">
          {[0, 1, 2].map((ring) => (
            <motion.span
              key={ring}
              aria-hidden
              className="absolute inset-0 rounded-full border border-teal-300"
              animate={reduce ? { opacity: 0.25 } : { scale: [0.7, 1.45], opacity: [0.7, 0] }}
              transition={{ duration: 3.6, repeat: Infinity, delay: ring * 1.2, ease: "easeOut" }}
            />
          ))}
          <motion.span {...rise(0, reduce)} className="flex size-20 items-center justify-center rounded-full bg-[linear-gradient(150deg,var(--color-teal-400),var(--color-teal-700))] text-white shadow-[0_18px_34px_-14px_rgb(17_76_97/0.7)]">
            <ShieldCheck className="size-9" strokeWidth={1.5} aria-hidden />
          </motion.span>
        </span>
        <motion.p {...rise(0.2, reduce)} className={cn(SERIF, "mt-7 text-[1.5rem] font-light tracking-[-0.02em] text-ink rtl:font-normal rtl:tracking-normal")}>
          {copy.title}
        </motion.p>
        <motion.div {...rise(0.35, reduce)} aria-hidden className="mt-4 flex h-8 items-center gap-1">
          {bars.map((height, index) => (
            <motion.span
              key={index}
              className="w-1 rounded-full bg-teal-400"
              style={{ height: `${height * 100}%` }}
              animate={reduce ? undefined : { scaleY: [1, 0.35, 1] }}
              transition={{ duration: 1.1 + (index % 3) * 0.25, repeat: Infinity, ease: "easeInOut", delay: index * 0.07 }}
            />
          ))}
        </motion.div>
        <motion.p {...rise(0.45, reduce)} className="mt-2 text-[0.8125rem] text-ink-muted">
          {copy.status}
        </motion.p>
      </div>
      <motion.span {...rise(0.7, reduce)} className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-sage-100 bg-sage-50 text-[0.875rem]  text-sage-700">
        <Check className="size-4" aria-hidden />
        {copy.ok}
      </motion.span>
    </Screen>
  );
}

const AXES = [-90, 30, 150].map((degrees) => (degrees * Math.PI) / 180);
const CX = 100;
const CY = 98;
const RADIUS = 66;
const at = (axis: number, ratio: number, radius = RADIUS) => [CX + radius * ratio * Math.cos(AXES[axis]), CY + radius * ratio * Math.sin(AXES[axis])] as const;
const polygon = (ratio: number) => AXES.map((_, axis) => at(axis, ratio).join(",")).join(" ");

/**
 * A three-axis radar of the screening areas: nested triangles for the scale, a gold shape that grows from the centre,
 * and a numbered dot at each corner that the legend repeats.
 */
export function RadarChart({ scores, className }: { scores: readonly number[]; className?: string }) {
  const reduce = useReducedMotion();
  const shape = scores.map((score, axis) => at(axis, score / 100).join(",")).join(" ");
  return (
    <svg viewBox="0 0 200 190" className={cn("h-auto w-full overflow-visible", className)} aria-hidden>
      <polygon points={polygon(1)} fill="var(--color-teal-50)" stroke="var(--color-teal-200)" />
      <polygon points={polygon(0.66)} fill="none" stroke="var(--color-teal-200)" strokeDasharray="2 4" />
      <polygon points={polygon(0.33)} fill="none" stroke="var(--color-teal-200)" strokeDasharray="2 4" />
      {AXES.map((_, axis) => (
        <line key={axis} x1={CX} y1={CY} x2={at(axis, 1)[0]} y2={at(axis, 1)[1]} stroke="var(--color-teal-200)" />
      ))}
      <motion.polygon
        points={shape}
        fill="rgb(201 175 111 / 0.3)"
        stroke="var(--color-gold-600)"
        strokeWidth="2"
        strokeLinejoin="round"
        style={{ transformOrigin: `${CX}px ${CY}px` }}
        initial={reduce ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.3 }}
      />
      {scores.map((score, axis) => (
        <motion.circle
          key={axis}
          cx={at(axis, score / 100)[0]}
          cy={at(axis, score / 100)[1]}
          r="3.5"
          fill="var(--color-gold-600)"
          stroke="#fff"
          strokeWidth="1.5"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 + axis * 0.1 }}
        />
      ))}
      {AXES.map((_, axis) => {
        const [x, y] = at(axis, 1, RADIUS + 15);
        return (
          <g key={axis}>
            <circle cx={x} cy={y} r="8" fill="#fff" stroke="var(--color-teal-300)" />
            <text x={x} y={y + 3.2} textAnchor="middle" fontSize="9" fontWeight="400" fill="var(--color-teal-800)">
              {axis + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function ResultScreen({ copy }: { copy: MiraPreviewCopy["screens"]["result"] }) {
  const reduce = useReducedMotion();
  return (
    <Screen>
      <motion.p {...rise(0.1, reduce)} className={cn(SERIF, "mt-4 text-[1.375rem] font-light tracking-[-0.02em] text-ink rtl:font-normal rtl:tracking-normal")}>
        {copy.title}
      </motion.p>
      <div className="mx-auto mt-1 w-[88%]">
        <RadarChart scores={EXAMPLE_SCORES} />
      </div>
      <ul className="mt-1 space-y-2">
        {copy.areas.map((area, index) => (
          <motion.li key={area} {...rise(0.6 + index * 0.1, reduce)} className="flex items-center gap-2.5 text-[0.75rem]">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-teal-300 text-[0.625rem]  text-teal-800">{index + 1}</span>
            <span className={cn("min-w-0 flex-1 truncate", index === 0 ? " text-ink" : "text-ink-soft")}>{area}</span>
            <span dir="ltr" className="font-mono tabular-nums text-ink-muted">
              {EXAMPLE_SCORES[index]}
            </span>
          </motion.li>
        ))}
      </ul>
      <motion.p {...rise(0.95, reduce)} className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3 text-[0.75rem] text-ink-soft">
        {copy.review}
        <Pill tone="gold">{copy.reviewValue}</Pill>
      </motion.p>
      <motion.span {...rise(1.05, reduce)} className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink text-[0.8125rem]  text-white">
        <Download className="size-4" aria-hidden />
        {copy.download}
      </motion.span>
    </Screen>
  );
}
