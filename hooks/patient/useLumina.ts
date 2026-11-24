"use client";

import { useCallback, useState } from "react";
import { luminaApi, type JournalSynthesis, type LuminaFeedbackInput, type LuminaToday } from "@/lib/api/lumina";
import { usePatientResource } from "@/hooks/usePatientResource";
import { luminaSynthesisKey, luminaTodayKey } from "@/lib/patient/lumina-cache";

/** Short on purpose: today's mode is a safety decision. An SOS also invalidates it at once (lib/patient/lumina-cache.ts). */
const TODAY_STALE_MS = 30_000;

/** Today's Lumina: contextual check-in wording and activities (keyed by local hour so the greeting follows the day). */
export function useLuminaToday() {
  const hour = new Date().getHours();
  return usePatientResource<LuminaToday>(luminaTodayKey(hour), async (signal) => (await luminaApi.today(hour, signal)).data, { staleMs: TODAY_STALE_MS });
}

export function useJournalSynthesis(window: 7 | 30) {
  return usePatientResource<JournalSynthesis>(luminaSynthesisKey(window), async (signal) => (await luminaApi.synthesis(window, signal)).data, { staleMs: 300_000 });
}

/** Ratings sent from this screen: remembers what was sent so the row can say thank you. */
export function useLuminaFeedback() {
  const [sent, setSent] = useState<Record<string, number>>({});
  const [failed, setFailed] = useState<string | null>(null);
  const rate = useCallback(async (input: LuminaFeedbackInput) => {
    setFailed(null);
    try {
      await luminaApi.feedback(input);
      setSent((prev) => ({ ...prev, [input.subjectKey]: input.usefulness }));
    } catch {
      setFailed(input.subjectKey);
    }
  }, []);
  return { rate, sent, failed };
}
