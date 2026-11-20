"use client";

import { usePatientResource } from "@/hooks/usePatientResource";
import { parentPackApi } from "@/lib/parent-pack/api";
import { addDays, localDay } from "@/lib/parent-pack/observations";

/** Parent Pack data, cached like every other patient resource (one entry per key, shared by the screens). */
export const useParentOverview = () => usePatientResource("parent-pack:overview", async (signal) => (await parentPackApi.overview(signal)).data, { staleMs: 30_000 });

export const useGuidance = () => usePatientResource("parent-pack:guidance", async (signal) => (await parentPackApi.guidance(signal)).data, { staleMs: 60_000 });

export const useSavedRoom = () => usePatientResource("parent-pack:room", async (signal) => (await parentPackApi.room(signal)).data, { staleMs: 60_000 });

export const useSafetyPlan = () => usePatientResource("parent-pack:safety", (signal) => parentPackApi.safetyPlan(signal), { staleMs: 60_000 });

export const useParentWellbeing = (days = 30) =>
  usePatientResource(`parent-pack:wellbeing:${days}`, async (signal) => (await parentPackApi.wellbeing(days, signal)).data, { staleMs: 30_000 });

/** Observations of the last `days` days, ending today. */
export function useCaregiverCheckins(days: number) {
  const to = localDay();
  const from = addDays(to, -(days - 1));
  return usePatientResource(`parent-pack:checkins:${from}:${to}`, async (signal) => (await parentPackApi.checkins({ from, to }, signal)).data, { staleMs: 30_000 });
}

export const useCaregiverJournal = () =>
  usePatientResource("parent-pack:journal", async (signal) => (await parentPackApi.journal({ limit: 20 }, signal)).data, { staleMs: 30_000 });
