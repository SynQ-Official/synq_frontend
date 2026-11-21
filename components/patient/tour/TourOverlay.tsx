"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePatient } from "@/hooks/patient/usePatient";
import { useCalmTrack } from "@/hooks/useCalmTrack";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import { fill } from "@/lib/i18n/patient";
import { findTourTarget, type TourStep } from "@/lib/patient/tour";

type Box = { top: number; left: number; width: number; height: number };
type Placement = "top" | "bottom" | "start" | "end";
type Layout = { style: CSSProperties; arrow?: { placement: Placement; offset: number } };

const SPOT_PAD = 8; // breathing room around the highlighted element
const GAP = 14; // between the spotlight and the popover
const EDGE = 12; // minimum distance from the viewport edge
const POPOVER_WIDTH = 368;
const MOBILE_MAX = 640; // below this the popover is a sheet pinned to the top or bottom
const SHEET_RESERVE = 300; // room kept free for that sheet when a target is scrolled into view
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

/** Fixed or sticky elements (the tab bar, the rail) never move with the page, so they are never scrolled to. */
function staysPut(element: HTMLElement) {
  for (let node: HTMLElement | null = element; node && node !== document.body; node = node.parentElement) {
    const position = getComputedStyle(node).position;
    if (position === "fixed" || position === "sticky") return true;
  }
  return false;
}

function bringIntoView(element: HTMLElement, instant: boolean) {
  if (staysPut(element)) return;
  const rect = element.getBoundingClientRect();
  const vh = window.innerHeight;
  const mobile = window.innerWidth < MOBILE_MAX;
  const top = mobile ? 72 : EDGE + SPOT_PAD;
  const bottom = mobile ? vh - SHEET_RESERVE : vh - EDGE - SPOT_PAD;
  if (rect.top >= top && rect.bottom <= bottom) return;
  // Short targets are centred in the free area; tall ones start at its top edge.
  const free = bottom - top;
  const delta = rect.height < free ? rect.top - (top + (free - rect.height) / 2) : rect.top - top;
  window.scrollBy({ top: delta, behavior: instant ? "auto" : "smooth" });
}

function layoutPopover(box: Box | null, size: { w: number; h: number }, vp: { w: number; h: number }, rtl: boolean): Layout {
  const width = Math.min(POPOVER_WIDTH, vp.w - EDGE * 2);
  const centred: Layout = { style: { width, insetInlineStart: (vp.w - width) / 2, bottom: EDGE + 12 } };

  if (vp.w < MOBILE_MAX) {
    const lower = box && box.top + box.height / 2 > vp.h / 2;
    return { style: { insetInline: EDGE, width: "auto", ...(lower ? { top: EDGE } : { bottom: "max(0.75rem, env(safe-area-inset-bottom))" }) } };
  }
  if (!box || box.height > vp.h * 0.7) return centred;

  const h = size.h || 240;
  const spot = { top: box.top - SPOT_PAD, bottom: box.top + box.height + SPOT_PAD, left: box.left - SPOT_PAD, right: box.left + box.width + SPOT_PAD };
  const room = {
    bottom: vp.h - spot.bottom - GAP - EDGE,
    top: spot.top - GAP - EDGE,
    end: (rtl ? spot.left : vp.w - spot.right) - GAP - EDGE,
    start: (rtl ? vp.w - spot.right : spot.left) - GAP - EDGE,
  };
  // Narrow targets (the navigation rail) are explained from the side; wide cards from above or below.
  const order: Placement[] = box.width < POPOVER_WIDTH ? ["end", "start", "bottom", "top"] : ["bottom", "top", "end", "start"];
  const placement = order.find((p) => room[p] >= (p === "top" || p === "bottom" ? h : width));
  if (!placement) return centred;

  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  if (placement === "top" || placement === "bottom") {
    const left = clamp(cx - width / 2, EDGE, vp.w - width - EDGE);
    const top = placement === "bottom" ? spot.bottom + GAP : spot.top - GAP - h;
    return { style: { width, left, top }, arrow: { placement, offset: clamp(cx - left, 24, width - 24) } };
  }
  const goesRight = (placement === "end") !== rtl;
  const top = clamp(cy - h / 2, EDGE, vp.h - h - EDGE);
  const left = goesRight ? spot.right + GAP : spot.left - GAP - width;
  return { style: { width, left, top }, arrow: { placement, offset: clamp(cy - top, 24, h - 24) } };
}

/** The little pointer joining the popover to its target; the popover body is painted above its inner half. */
function Arrow({ placement, offset, rtl }: { placement: Placement; offset: number; rtl: boolean }) {
  const onTop = placement === "bottom"; // popover sits below the target: pointer on its top edge
  const towardRight = (placement === "end") !== rtl; // popover is right of the target: pointer on its left edge
  const style: CSSProperties =
    placement === "top" || placement === "bottom"
      ? { left: offset - 7, ...(onTop ? { top: -7 } : { bottom: -7 }) }
      : { top: offset - 7, ...(towardRight ? { left: -7 } : { right: -7 }) };
  return <span aria-hidden className="absolute size-3.5 rotate-45 border border-teal-100 bg-white" style={style} />;
}

/**
 * The tour itself: a dimmed page with a spotlight on the current target and a popover beside it.
 * Keys: Esc closes, → / ← move (swapped in Arabic), Tab stays inside the popover. Under reduced motion and on the
 * calm tracks nothing glides or slides: the spotlight jumps and the popover only fades.
 */
export function TourOverlay({ steps, onClose }: { steps: TourStep[]; onClose: (completed: boolean) => void }) {
  const copy = usePatientCopy();
  const t = copy.tour;
  const { language } = useLanguage();
  const rtl = language === "ar";
  const { profile } = usePatient();
  const reduce = useReducedMotion();
  const calm = useCalmTrack();
  const still = Boolean(reduce) || calm;

  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  /** The step the spotlight has finished gliding to: until then (450 ms after a step change) it animates. */
  const [settledIndex, setSettledIndex] = useState(0);
  const glide = index !== 0 && !still && settledIndex !== index;
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const popoverRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const step = steps[index];
  const last = index === steps.length - 1;
  const text = t.steps[step.id];
  const body = step.id === "welcome" ? `${text.body} ${t.byTrack[profile.track]}` : text.body;

  const go = useCallback((delta: 1 | -1) => {
    setIndex((current) => {
      const target = current + delta;
      return target < 0 || target >= steps.length ? current : target;
    });
  }, [steps.length]);

  // Follow the target every frame: it may still be settling in, scrolling, or reflowing with the window.
  useEffect(() => {
    let frame = 0;
    let element = findTourTarget(step.id);
    if (element) bringIntoView(element, still);
    const tick = () => {
      if (!element?.isConnected) element = findTourTarget(step.id);
      const rect = element?.getBoundingClientRect();
      setBox((previous) => {
        if (!rect) return null;
        const same = previous && Math.abs(previous.top - rect.top) < 0.5 && Math.abs(previous.left - rect.left) < 0.5
          && Math.abs(previous.width - rect.width) < 0.5 && Math.abs(previous.height - rect.height) < 0.5;
        return same ? previous : { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
      });
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [step.id, still]);

  // The spotlight glides between steps only; while the page scrolls it must stick to its target.
  useEffect(() => {
    if (settledIndex === index) return;
    const timer = window.setTimeout(() => setSettledIndex(index), 450);
    return () => window.clearTimeout(timer);
  }, [index, settledIndex]);

  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useLayoutEffect(() => {
    const node = popoverRef.current;
    if (!node) return;
    const measure = () => setSize({ w: node.offsetWidth, h: node.offsetHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Focus: into the popover on every step, back to where the patient was when the tour ends.
  useEffect(() => {
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => before?.focus?.({ preventScroll: true });
  }, []);
  useEffect(() => nextRef.current?.focus({ preventScroll: true }), [index]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose(false);
      } else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        const forward = (event.key === "ArrowRight") !== rtl;
        if (forward && last) return;
        go(forward ? 1 : -1);
      } else if (event.key === "Tab") {
        const focusable = popoverRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])");
        if (!focusable?.length) return;
        const first = focusable[0];
        const lastItem = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (!popoverRef.current?.contains(active)) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && active === first) {
          event.preventDefault();
          lastItem.focus();
        } else if (!event.shiftKey && active === lastItem) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [go, last, onClose, rtl]);

  const layout = layoutPopover(box, size, vp, rtl);
  const NextIcon = rtl ? ArrowLeft : ArrowRight;
  const BackIcon = rtl ? ArrowRight : ArrowLeft;
  const progress = ((index + 1) / steps.length) * 100;
  const dim = "rgb(8 36 46 / 0.64)";

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[100]"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {/* Swallows clicks so nothing behind the tour is touched by accident. */}
      <div className="absolute inset-0" style={box ? undefined : { background: dim }} />
      {box && (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-3xl"
          style={{
            top: box.top - SPOT_PAD,
            left: box.left - SPOT_PAD,
            width: box.width + SPOT_PAD * 2,
            height: box.height + SPOT_PAD * 2,
            boxShadow: `0 0 0 2px rgb(255 255 255 / 0.9), 0 0 0 9999px ${dim}`,
            transition: glide ? "top 380ms var(--ease-out, ease), left 380ms var(--ease-out, ease), width 380ms var(--ease-out, ease), height 380ms var(--ease-out, ease)" : undefined,
          }}
        />
      )}

      <div
        ref={popoverRef}
        role="dialog"
        aria-modal="true"
        aria-label={t.label}
        aria-describedby="tour-body"
        className="absolute"
        style={{ ...layout.style, transition: glide ? "top 380ms var(--ease-out, ease), left 380ms var(--ease-out, ease)" : undefined }}
      >
        {layout.arrow && <Arrow {...layout.arrow} rtl={rtl} />}
        <motion.div
          key={step.id}
          initial={reduce ? false : still ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative rounded-3xl border border-teal-100 bg-white p-5 shadow-[0_24px_60px_-20px_rgb(8_36_46/0.55)]"
        >
          <div className="flex items-center gap-3">
            <p className="text-xs font-medium text-ink-muted" aria-live="polite">
              {fill(t.progress, { n: index + 1, total: steps.length })}
            </p>
            <div
              role="progressbar"
              aria-label={t.label}
              aria-valuemin={1}
              aria-valuemax={steps.length}
              aria-valuenow={index + 1}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-teal-100"
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress}%`, transition: still ? undefined : "width 380ms var(--ease-out, ease)" }}
              />
            </div>
            <button
              type="button"
              onClick={() => onClose(false)}
              aria-label={t.close}
              className="-me-2 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-teal-50 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <h2 className="mt-3 text-lg  leading-snug text-ink">{text.title}</h2>
          <p id="tour-body" className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {!last && (
              <Button variant="ghost" size="sm" onClick={() => onClose(false)} className="-ms-2 me-auto">
                {t.skip}
              </Button>
            )}
            <div className="ms-auto flex items-center gap-2">
              {index > 0 && (
                <Button variant="outline" onClick={() => go(-1)}>
                  <BackIcon aria-hidden />
                  {t.back}
                </Button>
              )}
              <Button ref={nextRef} onClick={() => (last ? onClose(true) : go(1))}>
                {last ? t.finish : t.next}
                {!last && <NextIcon aria-hidden />}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>,
    document.body,
  );
}
