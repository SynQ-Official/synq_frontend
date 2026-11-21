/**
 * Home type scale — a light serif for display, IBM Plex for everything else.
 * Arabic falls back to Plex Arabic (`rtl:font-sans`), never italic, never tracked.
 */
export const SERIF = "font-[family-name:var(--font-home-serif)] rtl:font-sans";

/** Hero headline. */
export const DISPLAY_XL = `${SERIF} text-[clamp(3rem,7vw+0.5rem,7rem)] font-light leading-[0.98] tracking-[-0.04em] rtl:tracking-normal`;
/** Section headline. */
export const DISPLAY_L = `${SERIF} text-[clamp(2.5rem,4.6vw+0.75rem,5rem)] font-light leading-[1.03] tracking-[-0.035em] rtl:tracking-normal`;
/** Panel / statement headline. */
export const DISPLAY_M = `${SERIF} text-[clamp(1.875rem,2.2vw+1.1rem,3rem)] font-light leading-[1.1] tracking-[-0.025em] rtl:tracking-normal`;
/** Card title. */
export const DISPLAY_S = `${SERIF} text-[clamp(1.375rem,0.7vw+1.15rem,1.75rem)] font-normal leading-[1.2] tracking-[-0.015em] rtl:tracking-normal`;

/** Quiet uppercase label. Arabic keeps joined letters (no tracking, no caps). */
export const LABEL = "text-[0.75rem]  uppercase leading-[1.4] tracking-[0.18em] rtl:normal-case rtl:tracking-normal";

/** Reading copy: Soft ink with real contrast — never the pale grey. */
export const BODY = "text-[clamp(1.0625rem,0.3vw+1rem,1.25rem)] leading-[1.75] text-ink-soft";
export const BODY_SM = "text-[0.9375rem] leading-[1.7] text-ink-soft";

/** The accent phrase: carried by colour (there is no bold anywhere in the app), brand teal on light grounds, champagne on deep ones. */
export const ACCENT_LIGHT = "text-teal-600";
export const ACCENT_DARK = "text-gold-300";
