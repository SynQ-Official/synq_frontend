"use client";

import { useCallback } from "react";
import { usePatientResource } from "@/hooks/usePatientResource";
import { ambiencesApi } from "@/lib/api/patient";
import type { AmbiencePreferencesInput, Ambiences } from "@/lib/api/patient-types";
import { playableSounds } from "@/lib/patient/ambiences";

/**
 * The patient's comfort sounds and settings. `available` is false while loading and whenever there is nothing to
 * offer (no track; the psychosis track until the clinician switches it on), so navigation and cards stay hidden.
 * One shared cache entry: the nav, the home card and the page read the same answer.
 */
export function useAmbiences() {
  const resource = usePatientResource<Ambiences>("ambiences", async () => (await ambiencesApi.get()).data, { staleMs: 60_000 });
  const { setData } = resource;

  /** Save some settings and adopt the server's answer. Rejects when the request fails, so the caller can say so. */
  const update = useCallback(
    async (input: AmbiencePreferencesInput) => {
      const { data } = await ambiencesApi.update(input);
      setData(data);
      return data;
    },
    [setData],
  );

  const ambiences = resource.data;
  const sounds = ambiences ? playableSounds(ambiences.track, ambiences.sounds) : [];
  return { ...resource, ambiences, sounds, available: sounds.length > 0, update };
}
