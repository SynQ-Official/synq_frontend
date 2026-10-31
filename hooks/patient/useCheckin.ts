"use client";

import { useCallback, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { checkinsApi, type CheckinInput, type CheckinSchedule, type CheckinScheduleInput } from "@/lib/api/patient";
import type { Checkin, DailyReport, GoalStatus } from "@/lib/api/patient-types";
import { currentStreak, localDay } from "@/lib/patient/format";
import { invalidatePatientData, usePatientResource } from "@/hooks/usePatientResource";

/** Today's check-in, or null when the patient has not checked in yet. */
export function useTodayCheckin() {
  const day = localDay();
  return usePatientResource<Checkin | null>(`checkins:today:${day}`, async () => (await checkinsApi.today(day)).data);
}

/** The patient's check-in schedule from the server (null until set). Under "checkins", so a submitted check-in refreshes `today`. */
export function useCheckinSchedule() {
  return usePatientResource<CheckinSchedule | null>("checkins:schedule", async () => (await checkinsApi.schedule()).data);
}

export async function saveCheckinSchedule(input: CheckinScheduleInput): Promise<CheckinSchedule> {
  const { data } = await checkinsApi.setSchedule(input);
  invalidatePatientData("checkins:schedule");
  return data;
}

/** The last `days` check-ins, oldest first, plus the streak they imply. */
export function useCheckinHistory(days = 30) {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - (days - 1));
  const range = { from: localDay(from), to: localDay(to) };
  const resource = usePatientResource<Checkin[]>(`checkins:list:${range.from}:${range.to}`, async () => (await checkinsApi.list(range)).data);
  const streak = resource.data ? currentStreak(resource.data.map((row) => row.date)) : 0;
  return { ...resource, streak };
}

/** The patient's own check-in report for a calendar month (built by the longitudinal service). */
export function useMonthlyCheckinReport(year: number, month: number) {
  return usePatientResource<DailyReport>(
    `reports:checkin-monthly:${year}-${month}`,
    async () => (await checkinsApi.monthlyReport(year, month)).data,
    { staleMs: 60_000 },
  );
}

export function useSubmitCheckin() {
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | Error | null>(null);

  const submit = useCallback(async (input: CheckinInput): Promise<Checkin | null> => {
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await checkinsApi.create({ ...input, date: localDay() });
      invalidatePatientData("checkins");
      invalidatePatientData("reports");
      return data;
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error("Request failed"));
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { submit, isSubmitting, error, clearError: () => setError(null) };
}

/** Resolve one of today's goals (COMPLETED / PARTIAL / MISSED, or back to PENDING). */
export function useSetGoalStatus() {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const setStatus = useCallback(async (goalId: string, status: GoalStatus) => {
    setPending(goalId);
    setError(null);
    try {
      await checkinsApi.setGoal(goalId, status);
      invalidatePatientData("checkins");
      invalidatePatientData("reports");
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error("Request failed"));
      return false;
    } finally {
      setPending(null);
    }
  }, []);

  return { setStatus, pendingGoalId: pending, error };
}
