"use client";

import { useSyncExternalStore } from "react";
import { useSessionState } from "@/hooks/useSessionState";
import { getSessionUser, subscribeSession } from "@/lib/api/tokens";

const SESSION_EVENT = "synq:session";

/** Tell every `useAuthSession` that the session changed in this tab (storage events cover other tabs). */
export function notifySessionChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SESSION_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(SESSION_EVENT, onChange);
  const unsubscribe = subscribeSession(onChange);
  return () => {
    unsubscribe();
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SESSION_EVENT, onChange);
  };
}

/**
 * Whether this browser holds a usable patient session, and who it belongs to. Renders signed-out on the
 * server and first paint, then settles on the real answer (restored from the HttpOnly refresh cookie).
 */
export function useAuthSession() {
  const signedIn = useSessionState() === true;
  const name = useSyncExternalStore(subscribe, () => getSessionUser()?.nickname ?? "", () => "");
  return { signedIn, name };
}
