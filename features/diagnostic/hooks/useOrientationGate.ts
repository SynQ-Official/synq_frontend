"use client";

import { useEffect, useState } from "react";
import { useSessionState, useSessionUserId } from "@/hooks/useSessionState";
import { resolveOrientation } from "../lib/orientation-gate";

/**
 * Where a visitor stands with Mira, which needs an account and runs once per account:
 * - `signed-out` — no session: sign up (or sign in) first;
 * - `done`       — nothing left for Mira to do: the care team set the track (Mira is skipped) or the account already
 *                  completed its orientation: on to the dashboard;
 * - `open`       — signed in, orientation still to do.
 * The API decides (`GET /me/orientation`); the app never works the state out itself.
 */
export type OrientationGate = "checking" | "signed-out" | "done" | "open";

type Answer = { userId: string; value: "done" | "open" | "signed-out" };

export function useOrientationGate(): OrientationGate {
  // `null` on the server and until the session is restored from the refresh cookie.
  const signedIn = useSessionState();
  const userId = useSessionUserId();
  // The answer belongs to the account that asked: another account signing in never inherits it.
  const [answer, setAnswer] = useState<Answer | null>(null);

  useEffect(() => {
    if (signedIn !== true || !userId) return;
    let cancelled = false;
    const settle = (value: Answer["value"]) => !cancelled && setAnswer({ userId, value });
    // 401 after a failed refresh: the session is gone. Anything else: let the chat's own error handling speak.
    resolveOrientation()
      .then(settle)
      .catch((error: { status?: number }) => settle(error?.status === 401 ? "signed-out" : "open"));
    return () => {
      cancelled = true;
    };
  }, [signedIn, userId]);

  if (signedIn === null) return "checking";
  if (signedIn === false) return "signed-out";
  return answer && answer.userId === userId ? answer.value : "checking";
}
