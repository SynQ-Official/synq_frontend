import type { AmbienceSound, PatientTrack } from "@/lib/api/patient-types";

/** Comfort sounds: the rules that must hold whatever the screen does. Pure, so they are tested on their own. */

export const AMBIENCE_MAX_VOLUME = 70;
export const AMBIENCE_DEFAULT_VOLUME = 40;
/** Fade in when playback starts and fade out when it stops, in milliseconds. */
export const AMBIENCE_FADE_MS = 3000;
export const TIMER_MINUTES = [15, 25, 45] as const;
export type TimerChoice = (typeof TIMER_MINUTES)[number] | "bedtime";

/** A whole percent from 0 to the ceiling. Anything that is not a number falls back to the default. */
export function clampVolume(percent: number): number {
  if (!Number.isFinite(percent)) return AMBIENCE_DEFAULT_VOLUME;
  return Math.min(AMBIENCE_MAX_VOLUME, Math.max(0, Math.round(percent)));
}

/** The only volume Howler is ever given: 0 to 0.7. */
export const howlVolume = (percent: number) => clampVolume(percent) / 100;

/**
 * The server already sends only what this patient may see. This is the second lock: no track, no sounds; the psychosis
 * track gets nature sounds only, never coloured noise.
 */
export function playableSounds(track: PatientTrack, sounds: readonly AmbienceSound[]): AmbienceSound[] {
  if (track === "UNSPECIFIED") return [];
  if (track === "SCHIZOPHRENIA") return sounds.filter((sound) => sound.category === "NATURE");
  return [...sounds];
}

/** The timers on offer. "Until bedtime" is the bipolar one, and only once a bedtime is set. */
export function timerChoices(track: PatientTrack, hasBedtime: boolean): TimerChoice[] {
  return track === "BIPOLAR" && hasBedtime ? [...TIMER_MINUTES, "bedtime"] : [...TIMER_MINUTES];
}

/** 25 minutes, or the bedtime when the patient has set one on the evening track. Playback never runs without an end. */
export const defaultTimer = (track: PatientTrack, hasBedtime: boolean): TimerChoice => (track === "BIPOLAR" && hasBedtime ? "bedtime" : 25);

/**
 * Milliseconds from `now` to the next "HH:MM" on the clock of `timeZone` (never zero: at exactly that minute it is the
 * next day's). shortcut: counts on the wall clock, so the night a clock change falls in can be an hour off; a bedtime
 * timer is a soft stop, not a deadline.
 */
export function msUntilBedtime(time: string, timeZone: string, now: Date = new Date()): number {
  const [hour, minute] = time.split(":").map(Number);
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const at = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const nowSeconds = at("hour") * 3600 + at("minute") * 60 + at("second");
  let diff = hour * 3600 + minute * 60 - nowSeconds;
  if (diff <= 0) diff += 24 * 3600;
  return diff * 1000;
}

/** How long a timer runs from now, in milliseconds. */
export function timerDurationMs(choice: TimerChoice, bedtime: { time: string; timeZone: string } | null, now: Date = new Date()): number {
  if (choice === "bedtime") return bedtime ? msUntilBedtime(bedtime.time, bedtime.timeZone, now) : 25 * 60_000;
  return choice * 60_000;
}

/** "m:ss" under an hour, "h:mm:ss" above. */
export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const two = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${two(m)}:${two(s)}` : `${m}:${two(s)}`;
}

/** The files for a sound, best format first: Opus, then AAC for the browsers that cannot play it. Empty without a media origin. */
export function soundSources(url: string, mediaBase: string): string[] {
  const base = mediaBase.replace(/\/+$/, "");
  return base ? [`${base}/${url}.opus`, `${base}/${url}.m4a`] : [];
}
