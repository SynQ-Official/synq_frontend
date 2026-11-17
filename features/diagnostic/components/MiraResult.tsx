"use client";

import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Check,
  Compass,
  Copy,
  Download,
  Gauge,
  Info,
  ShieldCheck,
  Stethoscope,
  Volume2,
  VolumeX,
  XCircle,
} from "lucide-react";
import { MotionConfig, motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { Grain, WaveLines } from "@/components/home/Atmosphere";
import { BODY_SM, DISPLAY_L, DISPLAY_M, DISPLAY_S, LABEL } from "@/components/home/typography";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { copy, LANGS } from "@/lib/i18n/config";
import { fill } from "@/lib/i18n/format";
import { EASE_OUT, REVEAL_VIEWPORT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useSpeech } from "@/hooks/useSpeech";
import type { MiraAssessmentResult } from "../types";
import { MatchStrengthMeter, SignalList, SignalRadar, type SignalDatum } from "./SignalCharts";
import { LogoSpinner } from "@/components/shared/LogoLoader";

interface MiraResultProps {
  result: MiraAssessmentResult;
  transcript: Array<{ role: "user" | "assistant"; content: string }>;
  sessionId: string;
  /** Finalizes the session (consumes one attempt) then produces the downloadable report. */
  onDownload?: () => void | Promise<void>;
  isFinalizing?: boolean;
  /** Visitor's first name, reused only to address them warmly (never a report data field). */
  viewerName?: string;
  /** When the conversation finished (last transcript message), shown in the report header. */
  completedAt?: string | null;
  /** Screen-only block that closes the report (the way on to Lumina). Never part of the printed report. */
  aside?: ReactNode;
}

function humanize(key: string) {
  const text = key.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Machine keys (e.g. `decreased_need_for_sleep`) read as sentences; free text is left untouched. */
function readable(item: string) {
  return /^[a-z0-9]+(?:[_.][a-z0-9]+)*$/i.test(item) ? humanize(item.replace(/\./g, " · ")) : item;
}

/** Display form of Mira's orientation: drop the machine "orientation:" prefix, capitalise. Same field. */
function displayOrientation(orientation: string) {
  const text = orientation.replace(/^\s*orientation\s*:\s*/i, "").trim() || orientation;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The engine names its scores adhd / bipolar / psychosis; the copy is keyed by the spectrum names. */
const SCORE_KEYS: Record<string, string> = { adhd: "ADHD", bipolar: "BIPOLAR_SPECTRUM", psychosis: "PSYCHOSIS_SPECTRUM" };

/** Each block of the report reveals as it reaches the reader. */
const reveal = {
  variants: fadeUp(0, 22),
  initial: "hidden",
  whileInView: "show",
  viewport: REVEAL_VIEWPORT,
} as const;

/** Section title with the brand icon tile and a serif heading. */
function SectionTitle({ id, icon, title, hint }: { id?: string; icon: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 print:hidden">{icon}</span>
      <div className="min-w-0">
        <h2 id={id} className={cn(DISPLAY_S, "text-[clamp(1.5rem,1vw+1.2rem,2rem)] text-ink")}>
          {title}
        </h2>
        {hint && <p className={cn(BODY_SM, "mt-1.5")}>{hint}</p>}
      </div>
    </div>
  );
}

/** One figure of the cover's strip. Hairlines between tiles follow the layout (stacked, then side by side) and mirror in RTL. */
function CoverMetric({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <motion.div
      variants={fadeUp(0, 10)}
      className="min-w-0 border-white/15 p-4 sm:p-5 [&:not(:first-child)]:border-t sm:[&:not(:first-child)]:border-s sm:[&:not(:first-child)]:border-t-0 print:border-line"
    >
      <p className={cn(LABEL, "flex items-center gap-2.5 text-teal-200")}>
        <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-gold-300 print:hidden">
          {icon}
        </span>
        <span className="min-w-0">{label}</span>
      </p>
      <div className="mt-3.5 min-w-0">{children}</div>
    </motion.div>
  );
}

/** A status pill for the cover strip: a dot and a short phrase. */
function StatusPill({ tone, children }: { tone: "ok" | "info" | "alert"; children: ReactNode }) {
  return (
    <p
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.9375rem] font-semibold",
        tone === "alert" ? "bg-rose-50 text-rose-700" : "bg-white/10 text-white",
      )}
    >
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", tone === "alert" ? "bg-rose" : tone === "info" ? "bg-gold-300" : "bg-sage")} />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

/** One list of observations inside the shared card; hairlines separate the lists. */
function ObservationGroup({ title, icon, items, labels, tone = "default" }: { title: string; icon: ReactNode; items: string[]; labels?: Record<string, string>; tone?: "default" | "muted" }) {
  if (items.length === 0) return null;
  return (
    <section aria-label={title} className="min-w-0 py-5 first:pt-0 last:pb-0">
      <h3 className={cn(DISPLAY_S, "flex items-center gap-3 text-[1.25rem] text-ink")}>
        <span aria-hidden className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", tone === "muted" ? "bg-rose-50 text-rose-700" : "bg-sage-50 text-sage-700")}>
          {icon}
        </span>
        {title}
      </h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-[1rem] leading-7 text-ink-soft">
            <span aria-hidden className={cn("mt-3 size-1.5 shrink-0 rounded-full", tone === "muted" ? "bg-rose" : "bg-gold")} />
            <span className="min-w-0">{labels?.[item] ?? readable(item)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MiraResult({ result, sessionId, onDownload, isFinalizing, viewerName, completedAt, aside }: MiraResultProps) {
  const { dictionary } = useLanguage();
  const reportCopy = copy[result.language];
  const reportDictionary = reportCopy.diagnostic;
  const mira = reportDictionary.mira;
  const resultPage = reportDictionary.resultPage;
  const reportLanguage = result.language;
  const pathways = reportDictionary.pathways as Record<string, string>;
  const [copied, setCopied] = useState(false);

  const entries = Object.entries(result.condition_scores || {}).sort((a, b) => b[1] - a[1]);
  const pathwayLabel = displayOrientation(result.orientation);
  const overlapping = result.overlapping_with_mood_episodes ?? [];
  const hasObservations = result.supporting_features.length + result.contradictory_features.length + result.missing_information.length + overlapping.length > 0;
  const hasSide = hasObservations || !!result.recommended_test;

  const signals: SignalDatum[] = entries.map(([key, score]) => ({
    key,
    label: pathways[SCORE_KEYS[key] ?? key] ?? pathways[key.toUpperCase()] ?? humanize(key),
    percent: Math.max(0, Math.min(100, Math.round(score * 100))),
    raw: score,
  }));

  const labels = result.feature_labels;
  const name = (key: string) => labels?.[key] ?? readable(key);
  const spokenReport = [
    mira.recommendationTitle,
    pathwayLabel,
    `${mira.matchStrength}: ${result.match_strength}`,
    ...entries.map(([name, score]) => `${name}: ${Math.round(score * 100)}%`),
    ...(result.supporting_features.length > 0 ? [`${mira.supportingTitle}: ${result.supporting_features.map(name).join(". ")}`] : []),
    ...(result.contradictory_features.length > 0 ? [result.contradictory_features.map(name).join(". ")] : []),
    ...(result.recommended_test ? [`${mira.nextStep}: ${result.recommended_test}`] : []),
    result.disclaimer,
  ].join(". ");

  const { state: speech, toggle } = useSpeech(spokenReport, reportLanguage);
  const speaking = speech === "speaking" || speech === "loading";

  const heroTitle = viewerName ? fill(resultPage.heroTitleNamed, { name: viewerName }) : resultPage.heroTitle;
  const urgent = result.safety.level === "urgent";
  const metricsCopy = resultPage.metrics;
  const completedDate = completedAt ? new Date(completedAt) : null;
  const completedLabel =
    completedDate && !Number.isNaN(completedDate.getTime())
      ? fill(resultPage.generatedOn, {
          date: completedDate.toLocaleDateString(LANGS.find((l) => l.code === reportLanguage)?.bcp47 ?? "en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            numberingSystem: "latn",
          }),
        })
      : null;

  async function copySessionId() {
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="w-full space-y-4 lg:space-y-5" dir={result.language === "ar" ? "rtl" : "ltr"}>
        {/* ── 1. The cover: the orientation, who it is for, the three things a clinician looks for first ── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
          aria-labelledby="orientation-result-title"
          className="result-hero relative isolate overflow-hidden rounded-[1.75rem] bg-deep text-white shadow-float sm:rounded-[2rem]"
        >
          <span className="print:hidden"><Grain /></span>
          <span className="print:hidden"><WaveLines tone="deep" className="inset-y-0" /></span>

          <div className="relative grid gap-7 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-12 lg:p-10">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <p className={cn(LABEL, "inline-flex items-center gap-2.5 rounded-full border border-gold-300/40 bg-gold/10 px-3.5 py-1.5 text-gold-300")}>
                  <span aria-hidden className="relative flex size-2">
                    <span className="absolute inset-0 rounded-full bg-gold opacity-60 motion-safe:animate-ping" />
                    <span className="relative size-2 rounded-full bg-gold" />
                  </span>
                  {resultPage.heroEyebrow}
                </p>
                {completedLabel && (
                  <p className="inline-flex items-center gap-2 text-[0.875rem] text-teal-100">
                    <CalendarDays className="size-4" aria-hidden />
                    {completedLabel}
                  </p>
                )}
              </div>

              <p className="mt-7 text-[1.0625rem] text-teal-100 sm:text-[1.125rem]">{heroTitle}</p>
              <p className={cn(LABEL, "mt-5 text-teal-200")}>{mira.orientationResult}</p>
              <h1 id="orientation-result-title" className={cn(DISPLAY_L, "mt-3 max-w-4xl text-[clamp(2rem,2.4vw+1.1rem,3.5rem)] leading-[1.06] text-white")}>
                {pathwayLabel}
              </h1>
              <p className="mt-5 max-w-2xl text-[1rem] leading-7 text-teal-100 sm:text-[1.0625rem] sm:leading-8">{resultPage.heroBody}</p>
            </div>

            {/* Actions — screen only. */}
            <div className="grid grid-cols-2 gap-2 self-start rounded-3xl border border-white/15 bg-white/[0.07] p-2.5 backdrop-blur-sm sm:gap-2.5 sm:p-3.5 lg:grid-cols-1 print:hidden">
              <Button
                type="button"
                size="lg"
                onClick={toggle}
                aria-label={speaking ? reportDictionary.stopListening : mira.readAloud}
                className="h-auto min-h-13 w-full justify-start whitespace-normal bg-white py-2.5 text-start text-ink max-sm:min-h-16 max-sm:rounded-2xl max-sm:flex-col max-sm:justify-center max-sm:gap-1.5 max-sm:px-2 max-sm:text-center max-sm:text-[0.8125rem] max-sm:leading-snug shadow-[0_18px_36px_-18px_rgb(0_0_0/0.6)] hover:bg-gold-100 hover:text-ink focus-visible:ring-offset-ink"
              >
                {speech === "loading" ? <LogoSpinner size={18} /> : speaking ? <VolumeX aria-hidden /> : <Volume2 aria-hidden />}
                <span aria-live="polite">{speaking ? reportDictionary.listening : mira.readAloud}</span>
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => (onDownload ? void onDownload() : window.print())}
                disabled={isFinalizing}
                aria-busy={isFinalizing}
                className="h-auto min-h-13 w-full justify-start whitespace-normal border-white/25 bg-white/5 py-2.5 text-start text-white max-sm:min-h-16 max-sm:rounded-2xl max-sm:flex-col max-sm:justify-center max-sm:gap-1.5 max-sm:px-2 max-sm:text-center max-sm:text-[0.8125rem] max-sm:leading-snug hover:border-white/50 hover:bg-white/10 hover:text-white focus-visible:ring-offset-ink"
              >
                {isFinalizing ? <LogoSpinner size={18} /> : <Download aria-hidden />}
                <span>{mira.download}</span>
              </Button>
              <button
                type="button"
                onClick={copySessionId}
                title={`${dictionary.diagnostic.session}: ${sessionId}`}
                className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl text-[0.8125rem] text-teal-100 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 col-span-2 lg:hidden"
              >
                {copied ? <Check className="size-3.5 text-gold-300" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                {dictionary.diagnostic.session}
                <span className="whitespace-nowrap font-mono" dir="ltr">{sessionId.slice(0, 8)}</span>
              </button>
            </div>
          </div>

          {/* At a glance: rests inside the cover, so nothing floats over the edge of it. */}
          <div className="relative border-t border-white/15 print:border-line">
            <h2 className="sr-only">{metricsCopy.title}</h2>
            <motion.div variants={stagger(0.08, 0.2)} initial="hidden" animate="show" className="grid sm:grid-cols-3">
              <CoverMetric icon={<Gauge className="size-4" />} label={metricsCopy.match}>
                <MatchStrengthMeter
                  level={result.match_strength}
                  label={metricsCopy.match}
                  levelLabel={mira.matchLevels[result.match_strength] ?? result.match_strength}
                  hideLabel
                  tone="inverse"
                />
              </CoverMetric>
              <CoverMetric icon={<Stethoscope className="size-4" />} label={metricsCopy.review}>
                <StatusPill tone={result.requires_clinician_review ? "info" : "ok"}>
                  {result.requires_clinician_review ? metricsCopy.reviewRecommended : metricsCopy.reviewOptional}
                </StatusPill>
              </CoverMetric>
              <CoverMetric icon={<ShieldCheck className="size-4" />} label={metricsCopy.safety}>
                <StatusPill tone={urgent ? "alert" : "ok"}>{urgent ? metricsCopy.safetyUrgent : metricsCopy.safetyRoutine}</StatusPill>
              </CoverMetric>
            </motion.div>
          </div>
        </motion.section>

        {urgent && (
          <motion.div {...reveal} role="alert" className="flex items-start gap-4 rounded-panel border border-rose-100 bg-rose-50 p-5 sm:p-6">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-700" aria-hidden />
            <div className="min-w-0">
              <p className="text-[1rem] font-semibold text-rose-700">{reportDictionary.urgentTitle}</p>
              <p className="mt-1.5 text-[0.9375rem] leading-7 text-rose-700/90">{reportDictionary.urgentBody}</p>
              {result.safety.flags.length > 0 && (
                <p className="mt-2 text-[0.8125rem] text-rose-700/85">
                  {mira.flagsTitle}: {result.safety.flags.join(", ")}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* ── 2. The reading: the signals on the left; the next step and what Mira noticed on the right ── */}
        {/* items-start: each column keeps its own height, so the signals card is not stretched into an empty band. */}
        <div className="grid gap-4 lg:grid-cols-12 lg:items-start lg:gap-5 print:block print:space-y-4">
          {signals.length > 0 && (
            <motion.section {...reveal} aria-labelledby="signals-title" className={cn("surface-card !rounded-panel flex min-w-0 flex-col p-5 sm:p-8", hasSide ? "lg:col-span-7" : "lg:col-span-12")}>
              <SectionTitle id="signals-title" icon={<Activity className="size-5" strokeWidth={1.5} aria-hidden />} title={mira.scoresTitle} hint={mira.scoresHint} />

              <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] xl:items-center xl:gap-8">
                <div className="min-w-0 rounded-3xl border border-teal-100 bg-[radial-gradient(circle_at_50%_45%,var(--color-teal-50),#ffffff_78%)] p-1 sm:p-4">
                  <SignalRadar data={signals} label={mira.scoresTitle} />
                </div>
                <div className="min-w-0">
                  <SignalList data={signals} strongestLabel={mira.strongestSignal} />
                </div>
              </div>
            </motion.section>
          )}

          {hasSide && (
            <div className={cn("flex min-w-0 flex-col gap-4 lg:gap-5", signals.length > 0 ? "lg:col-span-5" : "lg:col-span-12")}>
              {result.recommended_test && (
                <motion.section
                  {...reveal}
                  className="group relative overflow-hidden rounded-panel border border-teal-100 bg-white p-5 shadow-[var(--shadow-soft)] transition-shadow duration-500 hover:shadow-[var(--shadow-soft-hover)] sm:p-7"
                >
                  <span aria-hidden className="pointer-events-none absolute inset-y-6 start-0 w-1 rounded-full bg-[linear-gradient(180deg,var(--color-teal-500),var(--color-gold))]" />
                  <div className="relative flex items-start gap-4 sm:gap-5">
                    <span
                      aria-hidden
                      className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_30%_25%,var(--color-teal-600),var(--color-teal-900))] text-white shadow-brand transition-transform duration-500 ease-out-soft group-hover:-rotate-6 sm:size-14"
                    >
                      <Compass className="size-6" strokeWidth={1.5} />
                    </span>
                    <div className="min-w-0">
                      <h2 className={cn(LABEL, "text-teal-700")}>{mira.nextStep}</h2>
                      <p className={cn(DISPLAY_M, "mt-2.5 text-[clamp(1.375rem,1vw+1.1rem,1.875rem)] leading-snug text-ink first-letter:uppercase")}>{result.recommended_test}</p>
                    </div>
                  </div>
                </motion.section>
              )}

              {hasObservations && (
                <motion.div {...reveal} className="min-w-0 divide-y divide-line rounded-panel border border-line bg-white p-5 shadow-[var(--shadow-soft)] sm:p-7 print:shadow-none">
                  <ObservationGroup title={mira.supportingTitle} icon={<Check className="size-4" aria-hidden />} items={result.supporting_features} labels={labels} />
                  <ObservationGroup title={mira.contradictoryTitle} icon={<XCircle className="size-4" aria-hidden />} items={result.contradictory_features} labels={labels} tone="muted" />
                  <ObservationGroup title={mira.overlapTitle} icon={<Info className="size-4" aria-hidden />} items={overlapping} labels={labels} />
                  <ObservationGroup title={mira.missingTitle} icon={<Info className="size-4" aria-hidden />} items={result.missing_information} labels={labels} />
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* ── 3. The way on (screen only) ── */}
        {aside}

        {/* ── 4. Clinical note and privacy: one strip, the note is part of the printed report ── */}
        <motion.section {...reveal} className="grid gap-5 rounded-panel border border-gold-100 bg-gold-50 p-5 sm:p-7 md:grid-cols-2 md:gap-0">
          <div className="flex items-start gap-4 md:pe-8">
            <Info className="mt-0.5 size-5 shrink-0 text-gold-700" aria-hidden />
            <div className="min-w-0 text-[0.9375rem] leading-7 text-ink-soft">
              <p className="text-[1rem] font-semibold text-ink">{mira.noteTitle}</p>
              <p className="mt-1.5">{result.disclaimer || mira.screeningNote}</p>
            </div>
          </div>
          <div className="flex items-start gap-4 border-gold-100 md:border-s md:ps-8 print:hidden">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-sage-700" aria-hidden />
            <div className="min-w-0 text-[0.9375rem] leading-7 text-ink-soft">
              <p className="text-[1rem] font-semibold text-ink">{mira.privacyTitle}</p>
              <p className="mt-1.5">{mira.privacyBody}</p>
            </div>
          </div>
        </motion.section>
      </div>
    </MotionConfig>
  );
}
