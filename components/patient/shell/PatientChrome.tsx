"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LogoSpinner } from "@/components/shared/LogoLoader";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { TourReplayButton } from "@/components/patient/tour/TourProvider";
import { NotificationBell } from "@/components/patient/shell/NotificationBell";
import { isActive, navFor, PATIENT_NAV } from "@/components/patient/shell/nav";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePatient } from "@/hooks/patient/usePatient";
import { useCalmTrack } from "@/hooks/useCalmTrack";
import { profileApi } from "@/lib/api/patient";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { EASE_OUT, SPRING_SOFT } from "@/lib/motion";
import { cn } from "@/lib/utils";

const MotionLink = motion.create(Link);

/**
 * One rail item. The current page carries the pill, which glides between items as the patient moves
 * (on the calm tracks it fades in place instead of sliding).
 */
function RailLink({ href, active, calm, tour, variants, children }: {
  href: string;
  active: boolean;
  calm: boolean;
  tour?: string;
  variants: Variants;
  children: ReactNode;
}) {
  return (
    <MotionLink variants={variants} href={href} data-tour={tour} aria-current={active ? "page" : undefined} className="lm-nav-link isolate">
      {active && (
        <motion.span
          aria-hidden
          layoutId={calm ? undefined : "rail-pill"}
          initial={calm ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={calm ? { duration: 0.3 } : SPRING_SOFT}
          className="lm-rail-pill"
        />
      )}
      {children}
    </MotionLink>
  );
}

/** Desktop rail: brand, profile, the screens, then help, settings and a clearly separate sign-out. */
export function PatientRail() {
  const pathname = usePathname();
  const copy = usePatientCopy();
  const { direction } = useLanguage();
  const { signOut, profile } = usePatient();
  const calm = useCalmTrack();
  const [signingOut, setSigningOut] = useState(false);
  const main = navFor(profile.track).filter((item) => item.key !== "settings");
  const settings = PATIENT_NAV.find((item) => item.key === "settings")!;

  // Items arrive one after another from the rail's edge (a plain fade on the calm tracks; still under reduced motion).
  const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.045, delayChildren: 0.12 } } };
  const item: Variants = calm
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.5 } } }
    : { hidden: { opacity: 0, x: direction === "rtl" ? 12 : -12 }, show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE_OUT } } };

  return (
    <motion.aside
      initial="hidden"
      animate="show"
      variants={list}
      className="lm-rail sticky top-4 m-4 me-0 hidden h-[calc(100dvh-2rem)] w-64 shrink-0 self-start lg:flex lg:flex-col"
    >
      <motion.div variants={item} className="px-5 pb-3 pt-6">
        <span className="inline-flex rounded-2xl bg-white/90 px-3 py-1.5 shadow-sm">
          <BrandLogo size="sm" href={null} />
        </span>
      </motion.div>

      <motion.div variants={item}>
        <RailProfile />
      </motion.div>

      <motion.nav variants={list} aria-label={copy.shell.navLabel} className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {main.map(({ key, href, icon: Icon }) => (
          <RailLink key={key} href={href} active={isActive(pathname, href)} calm={calm} tour={`nav-${key}`} variants={item}>
            <Icon className="size-[1.125rem] shrink-0" aria-hidden />
            {copy.shell.nav[key]}
          </RailLink>
        ))}
      </motion.nav>

      <motion.div variants={list} className="space-y-1 border-t border-white/10 px-3 pb-4 pt-3">
        <motion.div variants={item}>
          <TourReplayButton className="lm-nav-link w-full" />
        </motion.div>
        <RailLink href={settings.href} active={isActive(pathname, settings.href)} calm={calm} variants={item}>
          <settings.icon className="size-[1.125rem] shrink-0" aria-hidden />
          {copy.shell.nav.settings}
        </RailLink>
        <motion.div variants={item} className="pt-2">
          <button
            type="button"
            disabled={signingOut}
            aria-busy={signingOut}
            onClick={() => {
              setSigningOut(true);
              void signOut();
            }}
            className="lm-signout group"
          >
            <span aria-hidden className="lm-signout-icon">
              {signingOut ? <LogoSpinner size={16} /> : <LogOut className="size-4 rtl:-scale-x-100" />}
            </span>
            <span className="min-w-0 flex-1 truncate text-start">{signingOut ? copy.shell.signingOut : copy.shell.signOut}</span>
          </button>
        </motion.div>
      </motion.div>
    </motion.aside>
  );
}

/** Language switch and notifications, shared by the desktop rail and the small-screen strip. */
function PatientUtilities({ side }: { side: "rail" | "strip" }) {
  const { refreshProfile } = usePatient();
  // The profile keeps the language too, so the switch updates it.
  return (
    <>
      <LanguageSwitcher onChange={(language) => void profileApi.update({ language: language === "ar" ? "AR" : "EN" }).then(refreshProfile, () => undefined)} />
      <NotificationBell placement={side} />
    </>
  );
}

/** Rail header: the patient's avatar and name (a shortcut to settings), with language and notifications beneath. */
function RailProfile() {
  const { name } = usePatient();
  const copy = usePatientCopy();
  const initial = (name.trim()[0] ?? "V").toUpperCase();

  return (
    <div className="mx-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-sm">
      <Link
        href="/dashboard/settings"
        aria-label={copy.shell.nav.settings}
        className="flex items-center gap-3 rounded-xl p-1 transition-colors hover:bg-white/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
      >
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-300 to-teal-700 text-base font-semibold text-white shadow-brand ring-2 ring-white/25">
          {initial}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold leading-tight text-white" dir="auto">{name}</span>
          <span className="mt-0.5 block text-xs text-white/60">{copy.shell.nav.settings}</span>
        </span>
      </Link>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
        <PatientUtilities side="rail" />
      </div>
    </div>
  );
}

/**
 * Small screens have no rail, so the same brand, language switch and notifications sit in a slim
 * strip at the top of the page. It scrolls away with the content: there is no fixed header.
 */
export function PatientMobileStrip() {
  const { name } = usePatient();
  const copy = usePatientCopy();
  const initial = (name.trim()[0] ?? "V").toUpperCase();

  return (
    <div className="lm-topbar flex items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-6 lg:hidden">
      <BrandLogo size="md" href={null} />
      <div className="flex items-center gap-2.5">
        <PatientUtilities side="strip" />
        <Link
          href="/dashboard/settings"
          aria-label={copy.shell.nav.settings}
          className="inline-flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-800 text-sm font-semibold text-white shadow-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
        >
          {initial}
        </Link>
      </div>
    </div>
  );
}

/** Small-screen tab bar: the four daily screens, with the check-in raised in the middle. */
export function PatientTabBar() {
  const pathname = usePathname();
  const copy = usePatientCopy();
  // Schizophrenia / psychosis tracks: the active pill fades in place instead of sliding between tabs.
  const calm = useCalmTrack();
  const { profile } = usePatient();
  const tabs = navFor(profile.track).filter((item) => item.key !== "settings");

  return (
    <nav
      aria-label={copy.shell.navLabel}
      className="lm-glass lm-tabbar fixed inset-x-3 bottom-3 z-40 grid grid-flow-col auto-cols-fr items-end rounded-[1.75rem] px-1.5 pb-1.5 pt-1.5 lg:hidden"
      style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
    >
      {tabs.map((item) => {
        const { key, href, icon: Icon } = item;
        const active = isActive(pathname, href);
        const center = key === "checkin";
        return (
          <Link
            key={key}
            href={href}
            data-tour={`nav-${key}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[0.625rem] font-medium leading-tight",
              active ? "text-teal-800" : "text-ink-muted",
              center && "-mt-5",
            )}
          >
            {active && !center && (
              calm ? (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="absolute inset-0 rounded-2xl bg-teal-100/80" aria-hidden />
              ) : (
                <motion.span layoutId="tab-pill" transition={SPRING_SOFT} className="absolute inset-0 rounded-2xl bg-teal-100/80" aria-hidden />
              )
            )}
            <span
              className={cn(
                "relative flex items-center justify-center",
                center && "size-12 rounded-full bg-gradient-to-br from-teal-300 to-teal-700 text-white shadow-brand ring-4 ring-white/70",
              )}
            >
              <Icon className={center ? "size-5" : "size-[1.15rem]"} aria-hidden />
            </span>
            <span className="relative max-w-full truncate px-0.5">{copy.shell.nav[key]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
