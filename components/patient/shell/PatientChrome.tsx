"use client";

import { useState, type ReactNode } from "react";
import { LocaleLink as Link } from "@/components/shared/LocaleLink";
import { usePathname } from "next/navigation";
import { LogOut, type LucideIcon } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LogoSpinner } from "@/components/shared/LogoLoader";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { TourReplayButton } from "@/components/patient/tour/TourProvider";
import { NotificationBell } from "@/components/patient/shell/NotificationBell";
import { SosButton } from "@/components/patient/sos/SosButton";
import { HelpNow } from "@/components/help/HelpNow";
import { isActive, navFor, PATIENT_NAV } from "@/components/patient/shell/nav";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAmbiences } from "@/hooks/patient/useAmbiences";
import { usePatient } from "@/hooks/patient/usePatient";
import { useCalmTrack } from "@/hooks/useCalmTrack";
import { profileApi } from "@/lib/api/patient";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { EASE_OUT, SPRING_SOFT } from "@/lib/motion";
import { cn } from "@/lib/utils";

const MotionLink = motion.create(Link);

/** One rail item: an icon tile and its label. The current page carries the pill, which glides between items. */
function RailLink({ href, active, calm, tour, variants, icon: Icon, tile = true, children }: {
  href: string;
  active: boolean;
  calm: boolean;
  tour?: string;
  variants: Variants;
  icon: LucideIcon;
  /** The tile sits behind the main screens' icons; utility links keep the bare icon. */
  tile?: boolean;
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
      <span aria-hidden className={tile ? "lm-nav-icon" : "flex size-5 shrink-0 items-center justify-center"}>
        <Icon className="size-[1.0625rem] shrink-0" />
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </MotionLink>
  );
}

/** The sidebar's sections, in order: the day's screens, then care and practice. Settings sits with the account block. */
const RAIL_GROUPS = ["daily", "care"] as const;

/**
 * Desktop rail, top to bottom: brand and language, the patient's own card (name and care path), the screens in two
 * labelled groups, then, pinned to the bottom, the safety block (SOS and the numbers to call), settings, the tour and
 * sign-out. If the window is short the whole rail scrolls as one: no tiny scroll area inside it.
 */
export function PatientRail() {
  const pathname = usePathname();
  const copy = usePatientCopy();
  const { direction } = useLanguage();
  const { signOut, profile } = usePatient();
  const calm = useCalmTrack();
  const [signingOut, setSigningOut] = useState(false);
  const { available: hasAmbiences } = useAmbiences();
  const screens = navFor(profile.track, hasAmbiences, profile.careTeam.hasClinician).filter((item) => item.group !== "account");
  const settings = PATIENT_NAV.find((item) => item.key === "settings")!;

  // Items arrive one after another from the rail's edge (a plain fade on the calm tracks; still under reduced motion).
  const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } } };
  const item: Variants = calm
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.5 } } }
    : { hidden: { opacity: 0, x: direction === "rtl" ? 12 : -12 }, show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE_OUT } } };

  return (
    <motion.aside
      initial="hidden"
      animate="show"
      variants={list}
      className="lm-rail sticky top-4 m-4 me-0 hidden h-[calc(100dvh-2rem)] w-64 shrink-0 self-start overflow-y-auto overscroll-contain lg:flex lg:flex-col"
    >
      <motion.div variants={item} className="flex items-center justify-between gap-2 px-4 pb-3 pt-5">
        <span className="inline-flex rounded-2xl bg-white/90 px-3 py-1.5 shadow-sm">
          <BrandLogo size="sm" href={null} />
        </span>
        <PatientLanguage />
      </motion.div>

      <motion.div variants={item} className="px-3">
        <RailProfile />
      </motion.div>

      <motion.nav variants={list} aria-label={copy.shell.navLabel} className="flex-1 px-3 pb-3 pt-1">
        {RAIL_GROUPS.map((group) => {
          const rows = screens.filter((screen) => screen.group === group);
          if (rows.length === 0) return null;
          return (
            <div key={group} role="group" aria-labelledby={`rail-group-${group}`}>
              <motion.p variants={item} id={`rail-group-${group}`} className="lm-rail-group">
                {copy.shell.groups[group]}
              </motion.p>
              <div className="space-y-0.5">
                {rows.map(({ key, href, icon }) => (
                  <RailLink key={key} href={href} icon={icon} active={isActive(pathname, href)} calm={calm} tour={`nav-${key}`} variants={item}>
                    {copy.shell.nav[key]}
                  </RailLink>
                ))}
              </div>
            </div>
          );
        })}
      </motion.nav>

      {/* Account links follow the screens and scroll with them... */}
      <motion.div variants={list} className="space-y-0.5 px-3 pb-3 pt-1">
        <RailLink href={settings.href} icon={settings.icon} tile={false} active={isActive(pathname, settings.href)} calm={calm} variants={item}>
          {copy.shell.nav.settings}
        </RailLink>
        <motion.div variants={item}>
          <TourReplayButton className="lm-nav-link w-full" />
        </motion.div>
        <motion.div variants={item}>
          <button
            type="button"
            disabled={signingOut}
            aria-busy={signingOut}
            onClick={() => {
              setSigningOut(true);
              void signOut().then((done) => {
                if (!done) setSigningOut(false);
              });
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

      {/* ...but the safety block is pinned: SOS and the numbers to call stay in view whatever the window height. */}
      <motion.div variants={item} className="lm-rail-footer sticky bottom-0 px-3 pb-4 pt-2">
        <div className="lm-rail-safety space-y-2 p-2.5">
          <p className="lm-rail-group !mt-0 !px-1">{copy.shell.safetyTitle}</p>
          <SosButton variant="wide" />
          <HelpNow className="w-full justify-center" />
        </div>
      </motion.div>
    </motion.aside>
  );
}

/** The discreet globe; the profile keeps the language too, so a change updates it. */
function PatientLanguage() {
  const { refreshProfile } = usePatient();
  return <LanguageSwitcher variant="menu" onChange={(language) => void profileApi.update({ language: language === "ar" ? "AR" : "EN" }).then(refreshProfile, () => undefined)} />;
}

/** The patient's own card at the top of the rail: avatar, name and care path. It opens Settings. */
function RailProfile() {
  const { name, profile } = usePatient();
  const copy = usePatientCopy();
  const initial = (name.trim()[0] ?? "V").toUpperCase();

  return (
    <Link
      href="/dashboard/settings"
      aria-label={copy.shell.nav.settings}
      className="lm-rail-profile flex items-center gap-3 p-2.5 transition-colors duration-200 hover:bg-teal-50/60 focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <span className="lm-avatar inline-flex size-11 shrink-0 items-center justify-center rounded-full text-base">{initial}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm leading-tight text-ink" dir="auto">{name}</span>
        <span className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
          <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: "var(--cond)" }} />
          <span className="truncate">{copy.home.welcome.motif[profile.track]}</span>
        </span>
      </span>
    </Link>
  );
}

/** Desktop only: notifications sit at the top end of the content, not in the rail. */
export function PatientTopActions() {
  return (
    <div className="hidden justify-end pb-2 lg:flex">
      <NotificationBell placement="strip" />
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
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* No rail on small screens, so SOS sits here. */}
        <HelpNow label="short" />
        <SosButton variant="compact" />
        <PatientLanguage />
        <NotificationBell placement="strip" />
        <Link
          href="/dashboard/settings"
          aria-label={copy.shell.nav.settings}
          className="inline-flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-800 text-sm  text-white shadow-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
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
  const tabs = navFor(profile.track, false, profile.careTeam.hasClinician).filter((item) => item.key !== "settings");

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
