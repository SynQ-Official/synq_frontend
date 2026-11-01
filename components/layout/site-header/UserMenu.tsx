"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, LayoutDashboard, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { notifySessionChange } from "@/hooks/useAuthSession";
import { authApi } from "@/lib/api/auth";
import { ROUTES } from "@/lib/config/routes";
import { prefetchPatientHome } from "@/lib/patient/prefetch";
import { useRouter } from "next/navigation";
import { EASE_OUT, SPRING_SOFT } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** First letter of the nickname, for the avatar. */
export function initialOf(name: string) {
  return (name.trim().charAt(0) || "·").toUpperCase();
}

/**
 * The signed-in end of the header: an avatar chip that opens a small panel — overview, settings, sign out.
 * Closes on Escape, outside click or focus leaving; the destinations are plain links.
 */
export function UserMenu({ name, onOpenChange }: { name: string; onOpenChange?: (open: boolean) => void }) {
  const { dictionary, direction } = useLanguage();
  const nav = dictionary.dashboard.navigation;
  const reduce = useReducedMotion();
  const router = useRouter();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpenState] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const setOpen = useCallback(
    (next: boolean) => {
      setOpenState(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, setOpen]);

  /** On intent only (hover / focus): load the dashboard code and the profile before the click that needs them. */
  const warmDashboard = useCallback(() => {
    router.prefetch(ROUTES.dashboard);
    prefetchPatientHome();
  }, [router]);

  async function signOut() {
    setLeaving(true);
    try {
      await authApi.logout();
    } catch {
      setLeaving(false); // the server could not end the session: stay signed in so the visitor can retry
      return;
    }
    setLeaving(false);
    setOpen(false);
    notifySessionChange();
  }

  const item =
    "group flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-start text-[0.9375rem] font-medium text-ink-soft outline-none transition-colors duration-200 hover:bg-teal-50 hover:text-ink focus-visible:bg-teal-50 focus-visible:ring-2 focus-visible:ring-teal-500";

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onPointerEnter={warmDashboard}
        onFocus={warmDashboard}
        onClick={() => setOpen(!open)}
        className="group inline-flex min-h-11 cursor-pointer items-center gap-2.5 rounded-full border border-line bg-white/80 py-1 ps-1 pe-3 text-sm font-semibold text-ink shadow-xs backdrop-blur transition-[border-color,box-shadow] duration-300 ease-out-soft hover:border-teal-200 hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,var(--color-teal-600),var(--color-teal-900))] text-[0.9375rem] font-medium text-white ring-2 ring-gold/40">
          {initialOf(name)}
        </span>
        <span className="hidden max-w-[8rem] truncate xl:inline">{name}</span>
        <ChevronDown aria-hidden className={cn("size-4 text-ink-muted transition-transform duration-300 ease-out-soft", open && "rotate-180 text-teal-700")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            dir={direction}
            role="region"
            aria-label={name}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, transition: SPRING_SOFT }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.16, ease: EASE_OUT } }}
            style={{ transformOrigin: "top center" }}
            className="absolute end-0 top-full z-50 w-64 pt-3"
          >
            <div className="rounded-[1.5rem] border border-white/80 bg-white/95 p-2 shadow-float ring-1 ring-line/60 backdrop-blur-xl">
              <p className="flex items-center gap-3 px-3 pb-3 pt-2.5">
                <span className="flex size-10 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,var(--color-teal-600),var(--color-teal-900))] font-medium text-white ring-2 ring-gold/40">
                  {initialOf(name)}
                </span>
                <span className="min-w-0 truncate text-[1rem] font-semibold text-ink">{name}</span>
              </p>
              <ul className="border-t border-line pt-2">
                <li>
                  <Link href={ROUTES.dashboard} onClick={() => setOpen(false)} className={item}>
                    <LayoutDashboard className="size-4 text-teal-700" aria-hidden />
                    {nav.overview}
                  </Link>
                </li>
                <li>
                  <Link href={`${ROUTES.dashboard}/settings`} onClick={() => setOpen(false)} className={item}>
                    <Settings className="size-4 text-teal-700" aria-hidden />
                    {nav.settings}
                  </Link>
                </li>
                <li>
                  <button type="button" onClick={() => void signOut()} disabled={leaving} className={cn(item, "cursor-pointer disabled:opacity-60")}>
                    <LogOut className="size-4 text-rose-700 rtl:-scale-x-100" aria-hidden />
                    {nav.signOut}
                  </button>
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
