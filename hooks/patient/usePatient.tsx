"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { authApi } from "@/lib/api/auth";
import { profileApi } from "@/lib/api/patient";
import type { Profile } from "@/lib/api/patient-types";
import { useSessionState } from "@/hooks/useSessionState";
import { clearTokens } from "@/lib/api/tokens";
import { ROUTES } from "@/lib/config/routes";
import { hasSeenWelcome } from "@/lib/patient/onboarding";
import { readCachedProfile, writeCachedProfile } from "@/lib/patient/profile-cache";
import { LiveUpdates } from "@/components/patient/shell/LiveUpdates";
import { useLanguage } from "@/contexts/LanguageContext";
import { clearPatientCache, seedPatientData, usePatientResource } from "@/hooks/usePatientResource";

type PatientContextValue = {
  profile: Profile;
  /** The name to greet with: the patient's nickname. */
  name: string;
  refreshProfile: () => Promise<void>;
  /** Resolves `true` once the server has ended the session; `false` leaves the patient signed in, to retry. */
  signOut: () => Promise<boolean>;
};

const PatientContext = createContext<PatientContextValue | null>(null);

export const WELCOME_ROUTE = "/welcome";

type Gate = "checking" | "ready" | "error";

// The last profile this device loaded is put in the cache before the first screen renders, so a reload
// paints the real app at once and refreshes in the background. (Server renders have no storage: they
// show the skeleton, and the cache is read on the client only.)
if (typeof window !== "undefined") {
  const cached = readCachedProfile();
  if (cached) seedPatientData("profile", cached);
}


/**
 * Gate for everything behind sign-in: no token → sign-in; a patient who has not yet seen
 * the welcome → the welcome. The real shell shows at once (skeletons where
 * the patient's own data goes) and children render as soon as the profile is known - instantly
 * from the cached copy, then refreshed in the background - so no screen ever flashes another
 * patient's data or an anonymous state.
 */
export function PatientProvider({
  children,
  pending,
  errorFallback,
}: {
  children: ReactNode;
  /** Shown while the profile is still on its way (and while a redirect to the welcome is under way). */
  pending: ReactNode;
  errorFallback: (retry: () => void, error: Error | null) => ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // null on the server and until the session is restored from the refresh cookie.
  const hasToken = useSessionState();
  const [signingOut, setSigningOut] = useState(false);
  const profileResource = usePatientResource<Profile>(hasToken ? "profile" : null, () => profileApi.get(), { staleMs: 60_000 });
  const { data: profile, error, refresh } = profileResource;
  const { language, setLanguage } = useLanguage();

  // The account's language wins once per sign-in: a shared device may still hold another patient's
  // (or an earlier visit's) choice. After that the patient's own switch in the rail is respected.
  const accountLanguage = profile?.language === "AR" ? "ar" : profile?.language === "EN" ? "en" : null;
  const accountId = profile?.id;
  useEffect(() => {
    if (!accountLanguage || !accountId) return;
    const key = `vitamind_lang_synced:${accountId}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      /* storage blocked: align once per mount instead */
    }
    if (accountLanguage !== language) setLanguage(accountLanguage);
  }, [accountLanguage, accountId, language, setLanguage]);

  // Remember the last known profile for the next reload.
  useEffect(() => {
    if (profile) writeCachedProfile(profile);
  }, [profile]);

  // The app tints itself to the patient's track (see "PATIENT TRACK THEMES" in globals.css). The track comes from
  // the profile only — the server's answer, or this patient's own cached copy on a reload — never from a separate
  // device-wide key, which would paint the previous patient's diagnosis on a shared device.
  const track = profile?.track;
  useEffect(() => {
    const root = document.documentElement;
    if (track) root.dataset.track = track;
    else delete root.dataset.track;
    return () => {
      delete root.dataset.track;
    };
  }, [track]);

  const unauthorized = hasToken === false || (error instanceof ApiError && error.isUnauthorized);

  useEffect(() => {
    if (!unauthorized || signingOut) return;
    clearTokens();
    clearPatientCache();
    router.replace(`${ROUTES.signIn}?from=lumina&redirect=${encodeURIComponent(pathname || ROUTES.dashboard)}`);
  }, [unauthorized, signingOut, router, pathname]);

  // Only the first arrival is forced through the welcome; it marks onboarding complete when it ends.
  const needsWelcome = Boolean(profile && !profile.hasCompletedOnboarding && !hasSeenWelcome(profile.id));
  const onWelcomeFlow = pathname === WELCOME_ROUTE;

  useEffect(() => {
    if (needsWelcome && !onWelcomeFlow) router.replace(WELCOME_ROUTE);
  }, [needsWelcome, onWelcomeFlow, router]);

  // No orientation, no dashboard: a patient with neither a finished Mira orientation nor a clinician's
  // diagnosis is sent to /orientation. The (possibly cached) profile is re-read from the server first, so
  // someone who has just finished is never bounced back. A finished orientation with no clear pattern still
  // enters: the orientation page would only answer "already completed".
  const inDashboard = Boolean(pathname?.startsWith(ROUTES.dashboard));
  const lacksOrientation = Boolean(
    profile && !needsWelcome && profile.orientationCompleted === false && profile.track === "UNSPECIFIED",
  );
  const [orientationChecked, setOrientationChecked] = useState(false);
  const checking = useRef(false);
  useEffect(() => {
    if (!lacksOrientation || !inDashboard || orientationChecked || checking.current) return;
    checking.current = true;
    profileApi
      .get()
      .then((fresh) => {
        if (fresh.orientationCompleted === false && fresh.track === "UNSPECIFIED") {
          router.replace(ROUTES.orientation);
        } else {
          writeCachedProfile(fresh);
          setOrientationChecked(true);
          void refresh();
        }
      })
      .catch(() => setOrientationChecked(true)) // a failed check must not lock the patient out
      .finally(() => {
        checking.current = false;
      });
  }, [lacksOrientation, inDashboard, orientationChecked, refresh, router]);
  const holdForOrientation = lacksOrientation && inDashboard && !orientationChecked;

  const signOut = useCallback(async () => {
    // The live stream closes first: nothing keeps listening for a patient who is leaving.
    setSigningOut(true);
    try {
      await authApi.logout();
    } catch {
      setSigningOut(false); // the server could not end the session: stay signed in so the patient can retry
      return false;
    }
    clearPatientCache();
    router.replace(ROUTES.signIn);
    return true;
  }, [router]);

  const refreshProfile = useCallback(() => refresh(), [refresh]);

  const value = useMemo<PatientContextValue | null>(
    () => (profile ? { profile, name: profile.nickname, refreshProfile, signOut } : null),
    [profile, refreshProfile, signOut],
  );

  const gate: Gate = unauthorized || hasToken === null || (!profile && !error) ? "checking" : profile ? "ready" : "error";

  if (gate === "checking") return <>{pending}</>;
  if (gate === "error" || !value) return <>{errorFallback(() => void refresh(), error)}</>;
  if (needsWelcome && !onWelcomeFlow) return <>{pending}</>;
  if (holdForOrientation) return <>{pending}</>;
  return (
    <PatientContext.Provider value={value}>
      {!signingOut && <LiveUpdates />}
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const context = useContext(PatientContext);
  if (!context) throw new Error("usePatient must be used within a PatientProvider");
  return context;
}
