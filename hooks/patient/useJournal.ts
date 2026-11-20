"use client";

import { useCallback, useState } from "react";
import { journalApi, type JournalEntryInput } from "@/lib/api/patient";
import type { JournalEntry, JournalInsights, Paginated } from "@/lib/api/patient-types";
import { localDay } from "@/lib/patient/format";
import { invalidatePatientData, usePatientResource } from "@/hooks/usePatientResource";

/** Entries of the last `days` days, newest first. */
export function useJournalEntries(days: number, page = 1, limit = 20) {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - (days - 1));
  const range = { from: localDay(from), to: localDay(to) };
  return usePatientResource<Paginated<JournalEntry>>(
    `journal:list:${days}:${page}:${limit}:${range.to}`,
    (signal) => journalApi.list({ ...range, page, limit }, signal),
    { staleMs: 10_000 },
  );
}

/** Longitudinal reading of the journal (mood, goals, emotions, consistency). */
export function useJournalInsights(days = 30) {
  return usePatientResource<JournalInsights>(`journal:insights:${days}`, async (signal) => (await journalApi.insights(days, signal)).data, {
    staleMs: 20_000,
  });
}

function refreshJournalViews() {
  invalidatePatientData("journal");
  invalidatePatientData("reports");
}

export function useJournalActions() {
  const [isSaving, setSaving] = useState(false);

  const create = useCallback(async (input: JournalEntryInput) => {
    setSaving(true);
    try {
      const entry = await journalApi.create(input);
      refreshJournalViews();
      return entry;
    } finally {
      setSaving(false);
    }
  }, []);

  const update = useCallback(async (id: string, input: Partial<JournalEntryInput>) => {
    setSaving(true);
    try {
      const entry = await journalApi.update(id, input);
      refreshJournalViews();
      return entry;
    } finally {
      setSaving(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    await journalApi.remove(id);
    refreshJournalViews();
  }, []);

  const retryAnalysis = useCallback(async (id: string) => {
    const entry = await journalApi.analyze(id);
    invalidatePatientData("journal");
    return entry;
  }, []);

  return { create, update, remove, retryAnalysis, isSaving };
}
