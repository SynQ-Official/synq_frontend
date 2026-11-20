import { LANGS, type Lang } from "@/lib/i18n/config";
import { fill } from "@/lib/i18n/format";
import type { MiraAssessmentResult } from "../types";

/** `decreased_need_for_sleep` → "Decreased need for sleep". */
export function humanize(key: string): string {
  const text = key.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Machine keys (e.g. `decreased_need_for_sleep`, `history.onset`) read as sentences; free text is left untouched. */
export function readable(item: string): string {
  return /^[a-z0-9]+(?:[_.][a-z0-9]+)*$/i.test(item) ? humanize(item.replace(/\./g, " · ")) : item;
}

/** Display form of Mira's orientation: drop the machine "orientation:" prefix, capitalise. Same field. */
export function displayOrientation(orientation: string): string {
  const text = orientation.replace(/^\s*orientation\s*:\s*/i, "").trim() || orientation;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The name of a feature key: Mira's own label in the session language, else the key made readable. */
export const featureName =
  (labels?: Record<string, string>) =>
  (key: string): string =>
    labels?.[key] ?? readable(key);

type SpokenCopy = { recommendationTitle: string; matchStrength: string; supportingTitle: string; nextStep: string };

/** The report read aloud: the orientation, how well it matches, what supports it, the next step, then the note. */
export function spokenReport(result: MiraAssessmentResult, copy: SpokenCopy): string {
  const name = featureName(result.feature_labels);
  return [
    copy.recommendationTitle,
    displayOrientation(result.orientation),
    `${copy.matchStrength}: ${result.match_strength}`,
    ...(result.supporting_features.length > 0 ? [`${copy.supportingTitle}: ${result.supporting_features.map(name).join(". ")}`] : []),
    ...(result.contradictory_features.length > 0 ? [result.contradictory_features.map(name).join(". ")] : []),
    ...(result.recommended_test ? [`${copy.nextStep}: ${result.recommended_test}`] : []),
    result.disclaimer,
  ].join(". ");
}

/** "Generated on 12 October 2026" in the report's language (Latin digits), or null without a valid date. */
export function completedOn(completedAt: string | null | undefined, language: Lang, template: string): string | null {
  const date = completedAt ? new Date(completedAt) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  const locale = LANGS.find((l) => l.code === language)?.bcp47 ?? "en-US";
  return fill(template, { date: date.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric", numberingSystem: "latn" }) });
}
