"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePatientResource } from "@/hooks/usePatientResource";
import { useSessionState } from "@/hooks/useSessionState";
import { profileApi } from "@/lib/api/patient";
import type { Profile } from "@/lib/api/patient-types";
import { ROUTES } from "@/lib/config/routes";
import { hasSeenWelcome } from "@/lib/patient/onboarding";
import { prefetchPatientHome } from "@/lib/patient/prefetch";

/**
 * Where "Open my Lumina space" leads: straight to the welcome for an account that has not seen it, to the
 * dashboard otherwise. Pointing at /dashboard first would paint the dashboard's frame and only then bounce
 * to /welcome. The profile is read under the same cache key the dashboard uses, and the first screens' data is
 * warmed, so whichever page opens is already filled.
 */
export function useLuminaEntry(): string {
  const router = useRouter();
  const signedIn = useSessionState();
  const { data: profile } = usePatientResource<Profile>(signedIn ? "profile" : null, (signal) => profileApi.get(signal), { staleMs: 60_000 });
  const href = profile && !profile.hasCompletedOnboarding && !hasSeenWelcome(profile.id) ? ROUTES.welcome : ROUTES.dashboard;

  useEffect(() => {
    if (signedIn !== true) return;
    prefetchPatientHome();
    router.prefetch(href);
  }, [signedIn, href, router]);

  return href;
}
