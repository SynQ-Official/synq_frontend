"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { careApi, clinicalApi, profileApi, type ConsentInput } from "@/lib/api/patient";
import { CONSENT_VERSION } from "@/lib/patient/consent";
import { addDaysLocal, localDay } from "@/lib/patient/format";
import type { AssignedExercise, Consent, Conversation, Exercise, IntakeStatus, Medication, MedicationIntake, OrientationConsent } from "@/lib/api/patient-types";
import { invalidatePatientData, usePatientResource } from "@/hooks/usePatientResource";

/** Exercises assigned by the care team (empty for patients without one). */
export function useAssignedExercises() {
  return usePatientResource<AssignedExercise[]>("care:assigned", async (signal) => (await careApi.exercises(signal)).data, { staleMs: 30_000 });
}

/** Self-guided exercises anyone can do. */
export function useExerciseCatalog() {
  return usePatientResource<Exercise[]>("care:catalog", async (signal) => (await careApi.exerciseCatalog(signal)).data, { staleMs: 300_000 });
}

/** Exercise ids the patient already completed today. */
export function useCompletedToday() {
  return usePatientResource<string[]>("care:today", async (signal) => (await careApi.completionsToday(signal)).data.map((row) => row.exerciseId), { staleMs: 15_000 });
}

export function useCompleteExercise() {
  const [busyId, setBusyId] = useState<string | null>(null);
  const complete = useCallback(async (input: { exerciseId: string; assignmentId?: string; durationSeconds?: number }) => {
    setBusyId(input.exerciseId);
    try {
      await careApi.completeExercise(input);
      invalidatePatientData("care");
      invalidatePatientData("reports");
    } finally {
      setBusyId(null);
    }
  }, []);
  return { complete, busyId };
}

/** The prescriptions the care team made. The patient reads them and logs doses; nothing here writes a prescription. */
export function useMedications() {
  return usePatientResource<Medication[]>("care:medications", async (signal) => (await careApi.medications(signal)).data, { staleMs: 60_000 });
}

/** The dose log of the last `days` days (the API keeps at most 90). */
export function useMedicationIntakes(days = 7) {
  const to = localDay();
  const from = localDay(addDaysLocal(new Date(), -(days - 1)));
  return usePatientResource<MedicationIntake[]>(`care:intakes:${from}:${to}`, async (signal) => (await careApi.intakes({ from, to }, signal)).data, { staleMs: 15_000 });
}

/** Logging a dose: one at a time, and the log refreshes from the API afterwards (never an invented success). */
export function useLogIntake() {
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const log = useCallback(async (medicationId: string, input: { scheduledAt: string; status: IntakeStatus }) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      await careApi.logIntake(medicationId, input);
      invalidatePatientData("care:intakes");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }, []);
  return { log, busy };
}

/**
 * The thread with one clinician. The API pushes nothing to the patient when a clinician replies, so while the thread is
 * open (and the tab is visible) it is read again every 30 seconds and whenever the tab comes back into view.
 */
export function useConversation(assignmentId: string | null) {
  const resource = usePatientResource<Conversation>(
    assignmentId ? `care:messages:${assignmentId}` : null,
    async (signal) => {
      const answer = await careApi.messages(assignmentId as string, signal);
      // Reading the thread marked the clinician's messages read on the server: the Care tab's count is stale now.
      invalidatePatientData(UNREAD_KEY);
      return { notice: answer.monitoringNotice, messages: answer.data };
    },
    { staleMs: 5_000 },
  );
  const refreshRef = useRef(resource.refresh);
  useEffect(() => {
    refreshRef.current = resource.refresh;
  });
  useEffect(() => {
    if (!assignmentId) return;
    const tick = () => {
      if (document.visibilityState === "visible") void refreshRef.current();
    };
    const timer = window.setInterval(tick, 30_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [assignmentId]);
  return resource;
}

const UNREAD_KEY = "care:unread";

/**
 * How many care-team messages wait unread, for the badge on the Care tab. `enabled` is false for a patient without a
 * clinician (nothing is read). The live stream refreshes it (`LiveUpdates`); it is also read again when the tab regains focus.
 */
export function useUnreadCare(enabled: boolean): number {
  const resource = usePatientResource<number>(enabled ? UNREAD_KEY : null, async (signal) => (await careApi.unreadMessages(signal)).data.unread, { staleMs: 30_000 });
  const refreshRef = useRef(resource.refresh);
  useEffect(() => {
    refreshRef.current = resource.refresh;
  });
  useEffect(() => {
    if (!enabled) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshRef.current();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [enabled]);
  return enabled ? resource.data ?? 0 : 0;
}

/** Sends one message at a time; the thread is read again afterwards so it shows exactly what the API stored. */
export function useSendMessage() {
  const [sending, setSending] = useState(false);
  const inFlight = useRef(false);
  const send = useCallback(async (assignmentId: string, content: string): Promise<boolean> => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setSending(true);
    try {
      await careApi.sendMessage({ assignmentId, content });
      invalidatePatientData(`care:messages:${assignmentId}`);
      return true;
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }, []);
  return { send, sending };
}

export function useConsents() {
  const resource = usePatientResource<Consent[]>("clinical:consents", async (signal) => (await clinicalApi.consents(signal)).data, { staleMs: 20_000 });

  const update = useCallback(async (assignmentId: string, input: ConsentInput) => {
    await clinicalApi.updateConsent(assignmentId, input);
    invalidatePatientData("clinical:consents");
  }, []);

  const reconfirm = useCallback(async (assignmentId: string, input?: ConsentInput) => {
    await clinicalApi.reconfirm(assignmentId, input);
    invalidatePatientData("clinical:consents");
  }, []);

  /** Ends the relationship (or cancels the patient's request). The thread and the list both change, so both refresh. */
  const endCare = useCallback(async (assignmentId: string, reason?: string) => {
    await clinicalApi.endCare(assignmentId, reason);
    invalidatePatientData("clinical:consents");
    invalidatePatientData("care");
  }, []);

  return { ...resource, update, reconfirm, endCare };
}

/** Asks a clinician (by e-mail) to follow the patient. The answer is always neutral, so there is nothing to refresh. */
export function useRequestCare() {
  const [sending, setSending] = useState(false);
  const request = useCallback(async (clinicianEmail: string) => {
    setSending(true);
    try {
      await clinicalApi.requestCare(clinicianEmail);
      invalidatePatientData("clinical:consents");
    } finally {
      setSending(false);
    }
  }, []);
  return { request, sending };
}

/** The consent to orientation and follow-up on file; accepting or withdrawing it updates the screen. */
export function useOrientationConsent() {
  const resource = usePatientResource<OrientationConsent>("profile:orientation-consent", async (signal) => (await profileApi.orientationConsent(signal)).data, { staleMs: 20_000 });
  const set = useCallback(async (granted: boolean) => {
    await profileApi.setOrientationConsent(granted, granted ? CONSENT_VERSION : undefined);
    invalidatePatientData("profile:orientation-consent");
  }, []);
  return { ...resource, set };
}
