"use client";

import { reportsApi } from "@/lib/api/patient";
import type { ReportDetail, ReportListItem } from "@/lib/api/patient-types";
import { usePatientResource } from "@/hooks/usePatientResource";

/** Weekly reports, newest first; the running week comes first with status IN_PROGRESS. */
export function useReports(limit = 12) {
  return usePatientResource<{ data: ReportListItem[]; meta: { firstWeek: string; currentWeek: string; count: number } }>(
    `reports:list:${limit}`,
    (signal) => reportsApi.list(limit, signal),
    { staleMs: 60_000 },
  );
}

/** One report; pass null while nothing is open. */
export function useReport(weekStart: string | null) {
  return usePatientResource<ReportDetail>(weekStart ? `reports:detail:${weekStart}` : null, async (signal) => (await reportsApi.get(weekStart as string, signal)).data, {
    staleMs: 60_000,
  });
}
