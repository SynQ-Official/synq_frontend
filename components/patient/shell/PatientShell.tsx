"use client";

import { useEffect, type ReactNode } from "react";
import { LuminaOrb, Skeleton } from "@/components/patient/ui/primitives";
import { PatientMobileStrip, PatientRail, PatientTabBar } from "@/components/patient/shell/PatientChrome";
import { navFor } from "@/components/patient/shell/nav";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LogoLoader } from "@/components/shared/LogoLoader";
import { SharingReconfirmGate } from "@/components/patient/consent/SharingReconfirm";
import { TourProvider } from "@/components/patient/tour/TourProvider";
import { Button } from "@/components/ui/button";
import { PatientProvider } from "@/hooks/patient/usePatient";
import { usePatientCopy } from "@/hooks/usePatientCopy";
import { homeSerif } from "@/components/home/fonts";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

/** Full-screen calm loader for the immersive screens (the welcome), which have no dashboard frame. */
export function PatientLoading() {
  const copy = usePatientCopy();
  return (
    <div className="lm-canvas flex min-h-dvh items-center justify-center">
      <LogoLoader label={copy.common.loading} />
    </div>
  );
}

/**
 * The dashboard's frame before the patient's profile is known: the same rail, strip and tab bar the
 * real shell uses, with soft placeholders where the patient's own details and screens will appear.
 * Navigation is never blocked by a full-screen loader; the real shell replaces this in place.
 */
export function PatientShellSkeleton() {
  const copy = usePatientCopy();
  const items = navFor(undefined).filter((item) => item.key !== "settings");

  return (
    <div data-surface="clean" className="lm-canvas min-h-dvh text-foreground lg:flex" aria-busy="true">
      <aside aria-hidden className="lm-rail sticky top-4 m-4 me-0 hidden h-[calc(100dvh-2rem)] w-64 shrink-0 self-start lg:flex lg:flex-col">
        <div className="px-5 pb-3 pt-6">
          <span className="inline-flex rounded-2xl bg-white/90 px-3 py-1.5 shadow-sm">
            <BrandLogo size="sm" href={null} />
          </span>
        </div>
        <div className="mx-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
          <span className="size-11 shrink-0 rounded-full bg-white/15 motion-safe:animate-pulse" />
          <span className="flex-1 space-y-2">
            <span className="block h-3 w-24 rounded-full bg-white/15 motion-safe:animate-pulse" />
            <span className="block h-2.5 w-16 rounded-full bg-white/10 motion-safe:animate-pulse" />
          </span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map(({ key, icon: Icon }) => (
            <span key={key} className="lm-nav-link opacity-60">
              <Icon className="size-[1.125rem] shrink-0" aria-hidden />
              {copy.shell.nav[key]}
            </span>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <div aria-hidden className="lm-topbar flex items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-6 lg:hidden">
          <BrandLogo size="md" href={null} />
          <Skeleton className="size-11 rounded-full" />
        </div>
        <main className="mx-auto w-full max-w-[88rem] px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          <p role="status" className="sr-only">{copy.common.loading}</p>
          <div aria-hidden className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-2/3 max-w-md" />
              <Skeleton className="h-4 w-1/2 max-w-sm" />
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <Skeleton className="h-48 md:col-span-2 xl:col-span-1" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48 md:col-span-2 xl:col-span-1" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function PatientLoadError({ retry, error }: { retry: () => void; error: Error | null }) {
  const copy = usePatientCopy();
  // A slow answer is not the same as a broken one: say so, calmly.
  const message = error instanceof ApiError && error.isTimeout ? copy.live.stream.slow : copy.common.loadError;
  return (
    <div className="lm-canvas flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center" role="alert">
      <LuminaOrb size={56} breathe={false} />
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      <Button onClick={retry}>{copy.common.retry}</Button>
    </div>
  );
}

/**
 * Auth + onboarding gate for any screen that needs the signed-in patient (dashboard and welcome).
 * `pending` is what shows until the profile is known: the dashboard passes its own frame; immersive
 * screens fall back to the calm loader.
 */
export function PatientGate({ children, pending }: { children: ReactNode; pending?: ReactNode }) {
  return (
    <PatientProvider pending={pending ?? <PatientLoading />} redirecting={<PatientLoading />} errorFallback={(retry, error) => <PatientLoadError retry={retry} error={error} />}>
      {children}
    </PatientProvider>
  );
}

/** The signed-in patient's frame: navigation rail (profile, language, notifications), mobile tab bar and a skip link. */
export function PatientChrome({ children }: { children: ReactNode }) {
  const copy = usePatientCopy();

  // Popovers and dialogs render outside this frame, so the surface is also set on <html> for them.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.surface = "clean";
    return () => {
      delete root.dataset.surface;
    };
  }, []);

  return (
    <PatientGate pending={<PatientShellSkeleton />}>
      <TourProvider>
        <div data-surface="clean" className={cn(homeSerif.variable, "lm-canvas min-h-dvh text-foreground lg:flex")}>
          <a
            href="#patient-main"
            className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg"
          >
            {copy.shell.skipToContent}
          </a>
          <PatientRail />
          <div className="min-w-0 flex-1">
            <PatientMobileStrip />
            <main id="patient-main" className="mx-auto w-full max-w-[88rem] px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
              <SharingReconfirmGate />
              {children}
            </main>
          </div>
          <PatientTabBar />
        </div>
      </TourProvider>
    </PatientGate>
  );
}
