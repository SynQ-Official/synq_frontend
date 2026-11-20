"use client";

import { useCallback, useRef, useState } from "react";
import { sosApi } from "@/lib/api/patient";
import type { SosResult } from "@/lib/api/patient-types";
import { sosFailureOf, type SosFailure } from "@/lib/patient/sos";

export type SosState =
  | { phase: "idle" }
  | { phase: "sending" }
  | { phase: "sent"; result: SosResult }
  | { phase: "failed"; failure: SosFailure };

/**
 * One SOS at a time. `send` ignores a second press while one is on its way (a ref, not state, so two taps in the same
 * frame cannot both get through), and the API itself answers a repeat with the alert that is already open, so a retry
 * after a timeout never raises a second alert. Nothing is faked: the "sent" state exists only after the API said so.
 */
export function useSos() {
  const [state, setState] = useState<SosState>({ phase: "idle" });
  const inFlight = useRef(false);

  const send = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setState({ phase: "sending" });
    try {
      const { data } = await sosApi.raise();
      setState({ phase: "sent", result: { ...data, emergencyResources: Array.isArray(data.emergencyResources) ? data.emergencyResources : [] } });
    } catch (error) {
      setState({ phase: "failed", failure: sosFailureOf(error) });
    } finally {
      inFlight.current = false;
    }
  }, []);

  const reset = useCallback(() => setState({ phase: "idle" }), []);

  return { state, send, reset };
}
