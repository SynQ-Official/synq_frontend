"use client";

import { HomeSection } from "@/components/home/HomeSection";
import { SectionHeader } from "@/components/home/SectionHeader";
import { BODY_SM, DISPLAY_S, LABEL, SERIF } from "@/components/home/typography";
import type { PsyPreviewCopy } from "@/lib/i18n/agents";
import { EASE_OUT, REVEAL_VIEWPORT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { BellRing, FileText, NotebookPen, ShieldCheck } from "lucide-react";
import type { PointerEvent } from "react";
import { useAgentPage } from "../shared";
import { AGENT_THEME } from "../theme";
import { ATTENTION_KINDS, ATTENTION_TONES } from "./psyData";
import { Avatar, LifeChart, TrafficChip } from "./PsyScreens";

const rise = (delay: number) => ({ initial: { opacity: 0, y: 10 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-10%" }, transition: { duration: 0.5, ease: EASE_OUT, delay } });

/** One small picture per thing SynQ Psy holds: the app's own card, drawn with example content. */
function RoleVisual({ index, preview }: { index: number; preview: PsyPreviewCopy }) {
  const { requests, patient, report } = preview;
  switch (index) {
    case 0:
      return (
        <ul className="space-y-2.5">
          {requests.items.map(([, code, , wait], row) => (
            <motion.li key={code} {...rise(0.1 + row * 0.1)} className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-sm">
              <Avatar name={code} />
              <span className="min-w-0 flex-1">
                {/* A request shows a pseudonymous code until the clinician accepts it. */}
                <span dir="ltr" className="block truncate text-start text-[0.8125rem] text-slate-900 rtl:text-end">{code}</span>
                <span className="block truncate text-[0.6875rem] font-medium text-amber-700">{wait}</span>
              </span>
              <span className={cn("shrink-0 rounded-lg px-3 py-1.5 text-[0.75rem] font-medium", row === 0 ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700")}>{requests.accept}</span>
            </motion.li>
          ))}
        </ul>
      );
    case 1:
      return (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          {preview.attention.items.slice(0, 3).map(([title, meta], row) => (
            <motion.li key={title} {...rise(0.1 + row * 0.08)} className="flex items-center gap-3 px-3 py-2.5">
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", ATTENTION_TONES[ATTENTION_KINDS[row]])}>
                {ATTENTION_KINDS[row] === "alert" ? <BellRing className="size-4" aria-hidden /> : <FileText className="size-4" aria-hidden />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[0.8125rem] font-medium text-slate-900">{title}</span>
                <span className="block truncate text-[0.6875rem] text-slate-500">{meta}</span>
              </span>
            </motion.li>
          ))}
        </ul>
      );
    case 2:
      return (
        <div>
          <p className="mb-3 flex items-center gap-3">
            <Avatar name={patient.name} size="lg" />
            <span className="min-w-0">
              <span className="block truncate text-[1rem]  tracking-tight text-slate-900">{patient.name}</span>
              <span className="mt-1 flex flex-wrap gap-1.5">
                <TrafficChip light={0} label={preview.risk.labels[0]} />
              </span>
            </span>
          </p>
          <LifeChart band={patient.baseline} />
          <p className="mt-2 flex items-center gap-2 text-[0.75rem]  text-[#0f766e]">
            <span className="size-2 rounded-full bg-[#0d9488]" />
            {patient.verdict}
          </p>
        </div>
      );
    case 3:
      return (
        <ol className="space-y-2">
          {preview.agenda.items.map(([time, name, line], row) => (
            <motion.li key={time} {...rise(0.1 + row * 0.08)} className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-sm">
              <span dir="ltr" className="w-11 shrink-0 text-[0.75rem]  tabular-nums text-slate-900">
                {time}
              </span>
              <span aria-hidden className={cn("h-7 w-0.5 shrink-0 rounded-full", row === 0 ? "bg-[#0d9488]" : "bg-[#99f6e4]")} />
              <span className="min-w-0">
                <span className="block truncate text-[0.8125rem] font-medium text-slate-900">{name}</span>
                <span className="block truncate text-[0.6875rem] text-slate-500">{line}</span>
              </span>
            </motion.li>
          ))}
        </ol>
      );
    case 4:
      return (
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative h-24 w-32 shrink-0" aria-hidden>
            {[2, 1, 0].map((layer) => (
              <motion.span
                key={layer}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, ease: EASE_OUT, delay: 0.1 + (2 - layer) * 0.12 }}
                className="absolute inset-y-0 w-20 rounded-xl border border-slate-200 bg-white shadow-soft"
                style={{ insetInlineStart: `${layer * 1.75}rem`, transform: `rotate(${(layer - 1) * 4}deg)` }}
              >
                {layer === 0 && <FileText className="m-3 size-5 text-[#0f766e]" strokeWidth={1.5} />}
              </motion.span>
            ))}
          </div>
          <div className="min-w-0 space-y-2">
            <p className="text-[0.9375rem]  text-ink">{report.headline}</p>
            <TrafficChip light={0} label={preview.risk.labels[0]} />
            <SharedTag label={preview.shared} />
          </div>
        </div>
      );
    default:
      return (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-[0.8125rem]  text-[#115e59]">
            <NotebookPen className="size-4" aria-hidden />
            {report.annotate}
          </p>
          <p className={cn(SERIF, "text-[1.0625rem] font-light leading-[1.55] text-ink rtl:font-normal")}>{report.annotation}</p>
          <ul className="flex flex-wrap gap-2">
            {patient.signals.map((signal, i) => (
              <motion.li
                key={signal}
                initial={{ opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.3 + i * 0.12 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#99f6e4] bg-[#f0fdfa] px-3 py-1 text-[0.8125rem] font-medium text-[#115e59]"
              >
                <span className="size-1.5 rounded-full bg-[#0d9488]" />
                {signal}
              </motion.li>
            ))}
          </ul>
        </div>
      );
  }
}

/** "Shared by the patient": the one rule behind every screen, as a small lock-and-check tag. */
function SharedTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sage-50 px-2 py-0.5 text-[0.6875rem]  text-sage-700 ring-1 ring-sage-100">
      <ShieldCheck className="size-3" strokeWidth={2.25} aria-hidden />
      {label}
    </span>
  );
}

/** How wide each card is on the six-column grid from lg: two and three across, then one long closing card. */
const SPANS = ["lg:col-span-3", "lg:col-span-3", "lg:col-span-2", "lg:col-span-2", "lg:col-span-2", "lg:col-span-6"] as const;

/** A bento tile. A pool of sage light follows the pointer along its edge, and its picture draws itself as it comes into view. */
function Tile({ index, title, line, tag, preview }: { index: number; title: string; line: string; tag: string; preview: PsyPreviewCopy }) {
  const theme = AGENT_THEME.psy;
  const Icon = theme.icons[index % theme.icons.length];
  const x = useMotionValue(50);
  const y = useMotionValue(0);
  const glow = useMotionTemplate`radial-gradient(22rem circle at ${x}% ${y}%, rgb(127 176 174 / 0.28), transparent 60%)`;
  const wide = index === 5;

  const follow = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(((event.clientX - rect.left) / rect.width) * 100);
    y.set(((event.clientY - rect.top) / rect.height) * 100);
  };

  return (
    <motion.li
      variants={fadeUp(0, 28)}
      onPointerMove={follow}
      className={cn(
        "group relative isolate flex flex-col overflow-hidden rounded-[2rem] border border-sage-100 bg-[linear-gradient(160deg,var(--color-sage-50),#ffffff_70%)] p-6 shadow-card transition-[border-color,box-shadow,transform] duration-500 ease-out-soft hover:border-sage motion-safe:hover:-translate-y-1 hover:shadow-float sm:p-8",
        wide && "lg:flex-row lg:items-center lg:gap-12",
        SPANS[index],
      )}
    >
      <motion.span aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ backgroundImage: glow }} />
      <div className={cn("flex flex-col", wide && "lg:w-5/12 lg:shrink-0")}>
        <p className={cn(LABEL, "inline-flex items-center gap-2", theme.label)}>
          <Icon className="size-4" strokeWidth={1.75} aria-hidden />
          {tag}
        </p>
        <h3 className={cn(DISPLAY_S, "mt-5 text-ink")}>{title}</h3>
        <p className={cn(BODY_SM, "mt-3")}>{line}</p>
      </div>
      <div aria-hidden className={cn("mt-7 flex-1 rounded-2xl border border-sage-100 bg-white p-4 shadow-card", wide ? "lg:mt-0" : "")}>
        <RoleVisual index={index} preview={preview} />
      </div>
    </motion.li>
  );
}

/**
 * What the clinician workspace holds, as a bento of six tiles instead of /mira and /lumina's quiet index: each one a card of
 * the app with its own small picture, lit by the pointer.
 */
export function PsyRoles() {
  const { page, copy } = useAgentPage("psy");
  const preview = copy.psy.preview;

  return (
    <HomeSection id="role" labelledBy="role-title">
      <SectionHeader variant="editorial" id="role-title" counter="01 / 03" eyebrow={page.role.eyebrow} titleA={page.role.titleA} titleB={page.role.titleB} />

      <motion.ul variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={REVEAL_VIEWPORT} className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-6 lg:gap-5">
        {page.role.items.map(([title, line, tag], index) => (
          <Tile key={title} index={index} title={title} line={line} tag={tag} preview={preview} />
        ))}
      </motion.ul>
    </HomeSection>
  );
}
