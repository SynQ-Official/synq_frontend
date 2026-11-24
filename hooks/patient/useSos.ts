"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePatientResource } from "@/hooks/usePatientResource";
import { sosApi } from "@/lib/api/patient";
import type { SosResult, SosStatus } from "@/lib/api/patient-types";
import { invalidateAfterSos } from "@/lib/patient/lumina-cache";
import { sosIsOpen } from "@/lib/patient/messages";
import { sosFailureOf, type SosFailure } from "@/lib/patient/sos";

const STATUS_KEY = "sos:latest";
/** While an SOS is open and the tab is visible, where it stands is read again this often. */
const STATUS_POLL_MS = 20_000;

/**
 * Where my latest SOS stands. Only reads while `enabled` (the SOS dialog is open). It keeps reading every 20 s and when
 * the tab comes back into view until the SOS is closed, because the API pushes nothing to the patient about it.
 */
export function useSosStatus(enabled: boolean) {
  const resource = usePatientResource<SosStatus | null>(enabled ? STATUS_KEY : null, async (signal) => (await sosApi.latest(signal)).data, { staleMs: 5_000 });
  const refreshRef = useRef(resource.refresh);
  useEffect(() => {
    refreshRef.current = resource.refresh;
  });
  const following = enabled && sosIsOpen(resource.data);
  useEffect(() => {
    if (!following) return;
    const tick = () => {
      if (document.visibilityState === "visible") void refreshRef.current();
    };
    const timer = window.setInterval(tick, STATUS_POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [following]);
  return resource;
}

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
      invalidateAfterSos(STATUS_KEY); // the status read before this SOS, and Lumina's recommendations, no longer apply
    } catch (error) {
      setState({ phase: "failed", failure: sosFailureOf(error) });
    } finally {
      inFlight.current = false;
    }
  }, []);

  const reset = useCallback(() => setState({ phase: "idle" }), []);

  return { state, send, reset };
}
