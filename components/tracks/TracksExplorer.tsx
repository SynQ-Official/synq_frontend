"use client";

import { HomeSection } from "@/components/home/HomeSection";
import { SectionHeader } from "@/components/home/SectionHeader";
import { BODY, DISPLAY_M, DISPLAY_S, LABEL } from "@/components/home/typography";
import { useLanguage } from "@/contexts/LanguageContext";
import { tracksCopy, type TrackId } from "@/lib/i18n/tracks";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { TRACK_TONE, TrackVisual } from "./TrackVisuals";

export const TRACK_ORDER: readonly TrackId[] = ["adhd", "bipolar", "psychosis"];
/** Fired by the hero's three circles so the explorer opens the chosen track. */
export const SELECT_TRACK_EVENT = "vm-select-track";

const isTrack = (value: string): value is TrackId => (TRACK_ORDER as readonly string[]).includes(value);

/**
 * The heart of /tracks: three tabs, one open track at a time — what it is, how it can show up, and what the daily
 * space does differently for it. `#adhd`, `#bipolar` and `#psychosis` open a track directly.
 */
export function TracksExplorer() {
  const { language } = useLanguage();
  const copy = tracksCopy[language].explorer;
  const reduce = useReducedMotion();
  const [active, setActive] = useState<TrackId>("adhd");
  const tabRefs = useRef<Partial<Record<TrackId, HTMLButtonElement | null>>>({});
  const sectionRef = useRef<HTMLDivElement>(null);

  const select = useCallback((track: TrackId, scroll = false) => {
    setActive(track);
    try {
      window.history.replaceState(null, "", `#${track}`);
    } catch {
      /* the hash is a convenience only */
    }
    if (scroll) sectionRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [reduce]);

  useEffect(() => {
    const fromHash = window.location.hash.slice(1);
    if (isTrack(fromHash)) {
      // Opening on a hash is reading browser state once, after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActive(fromHash);
    }
    const onSelect = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      if (isTrack(id)) select(id, true);
    };
    window.addEventListener(SELECT_TRACK_EVENT, onSelect);
    return () => window.removeEventListener(SELECT_TRACK_EVENT, onSelect);
  }, [select]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const rtl = document.documentElement.dir === "rtl" || !!event.currentTarget.closest("[dir=rtl]");
    const forward = event.key === (rtl ? "ArrowLeft" : "ArrowRight") || event.key === "ArrowDown";
    const back = event.key === (rtl ? "ArrowRight" : "ArrowLeft") || event.key === "ArrowUp";
    if (!forward && !back && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? TRACK_ORDER.length - 1 : (index + (forward ? 1 : -1) + TRACK_ORDER.length) % TRACK_ORDER.length;
    select(TRACK_ORDER[next]);
    tabRefs.current[TRACK_ORDER[next]]?.focus();
  };

  const track = copy.tracks[active];
  const tone = TRACK_TONE[active];

  return (
    <HomeSection id="explorer" labelledBy="explorer-title" tone="base">
      <SectionHeader variant="editorial" id="explorer-title" counter="01 / 02" eyebrow={copy.eyebrow} titleA={copy.titleA} titleB={copy.titleB} />

      <div ref={sectionRef} className="mt-10 scroll-mt-28 lg:mt-14">
        <LayoutGroup id="track-tabs">
          <div role="tablist" aria-label={copy.pick} className="grid gap-2 rounded-[1.75rem] border border-line bg-canvas p-2 sm:grid-cols-3">
            {TRACK_ORDER.map((id, index) => {
              const selected = id === active;
              return (
                <button
                  key={id}
                  ref={(node) => {
                    tabRefs.current[id] = node;
                  }}
                  role="tab"
                  type="button"
                  id={`track-tab-${id}`}
                  aria-selected={selected}
                  aria-controls={`track-panel-${id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => select(id)}
                  onKeyDown={(event) => onKeyDown(event, index)}
                  className={cn(
                    "relative flex min-h-16 items-center gap-3 rounded-[1.25rem] px-4 py-3 text-start outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-teal-500 sm:px-5",
                    selected ? "text-ink" : "text-ink-soft hover:text-ink",
                  )}
                >
                  {selected && (
                    <motion.span layoutId="track-pill" transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 34 }} className="absolute inset-0 rounded-[1.25rem] bg-white shadow-soft ring-1 ring-line" />
                  )}
                  <span className={cn("relative size-3 shrink-0 rounded-full transition-transform duration-300", TRACK_TONE[id].dot, selected && "scale-125")} aria-hidden />
                  <span className="relative min-w-0 text-[0.9375rem]  leading-snug">{copy.tracks[id].tab}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            role="tabpanel"
            id={`track-panel-${active}`}
            aria-labelledby={`track-tab-${active}`}
            tabIndex={0}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
            className="mt-8 outline-none lg:mt-12"
          >
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
              <div className="lg:col-span-6">
                <p className={cn(LABEL, "flex items-center gap-3", tone.text)}>
                  <span aria-hidden className={cn("h-px w-8", tone.dot)} />
                  {track.kicker}
                </p>
                <h3 className={cn(DISPLAY_M, "mt-4 text-ink")}>{track.title}</h3>
                <p className={cn(BODY, "mt-5 max-w-xl")}>{track.what}</p>

                <h4 className={cn(LABEL, "mt-9 text-ink")}>{track.signsTitle}</h4>
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {track.signs.map((sign, index) => (
                    <motion.li
                      key={sign}
                      initial={reduce ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.15 + index * 0.07 }}
                      className="flex items-start gap-3 rounded-2xl border border-line bg-canvas p-4 text-[0.9375rem] leading-6 text-ink-soft"
                    >
                      <span aria-hidden className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full", tone.solid)}>
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      {sign}
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div className="min-w-0 lg:col-span-6 lg:sticky lg:top-28 lg:self-start">
                <TrackVisual track={active} labels={track.visual.labels} caption={track.visual.caption} />
              </div>
            </div>

            <div className="mt-12 lg:mt-16">
              <h4 className={cn(DISPLAY_S, "text-ink")}>{track.leansTitle}</h4>
              <ul className="mt-6 grid gap-4 md:grid-cols-3">
                {track.leans.map((item, index) => (
                  <motion.li
                    key={item.name}
                    initial={reduce ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: EASE_OUT, delay: 0.25 + index * 0.1 }}
                    className={cn("rounded-panel border p-6 transition-transform duration-500 ease-out-soft hover:-translate-y-1 sm:p-7", tone.soft, "border-line")}
                  >
                    <span className={cn("flex size-9 items-center justify-center rounded-xl text-[0.875rem] ", tone.solid)} aria-hidden>
                      {index + 1}
                    </span>
                    <p className="mt-5 text-[1.0625rem]  text-ink">{item.name}</p>
                    <p className="mt-2 text-[0.9375rem] leading-[1.7] text-ink-soft">{item.body}</p>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </HomeSection>
  );
}
