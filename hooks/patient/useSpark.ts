"use client";

import { useCallback, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { sparkApi } from "@/lib/api/patient";
import type { SparkView } from "@/lib/api/patient-types";
import { usePatientResource } from "@/hooks/usePatientResource";

/** What went wrong with the last action, as a code the screen words for the patient. */
export type SparkFailure = "unavailable" | "full" | "failed";

function failureOf(error: unknown): SparkFailure {
  if (error instanceof ApiError) {
    if (error.status === 503 || error.status === 502 || error.status === 504 || error.status === 0) return "unavailable";
    if (error.code === "SPARK_LIST_FULL") return "full";
  }
  return "failed";
}

/**
 * Spark, the ADHD task assistant. One shared view (the Spark page and the home section read the same
 * cache), every action answers with the whole updated view, and taps that only change one task (finish,
 * tick a step) show at once and are confirmed by the answer.
 */
export function useSpark(enabled = true) {
  const resource = usePatientResource<SparkView>(enabled ? "spark:view" : null, (signal) => sparkApi.view(signal), { staleMs: 60_000 });
  const { setData } = resource;
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<SparkFailure | null>(null);

  /** Run one request. `optimistic` shows the result at once; on failure the previous view comes back. */
  const act = useCallback(
    async (request: () => Promise<SparkView>, optimistic?: (view: SparkView) => SparkView): Promise<SparkView | null> => {
      const before = resource.data;
      setFailure(null);
      if (optimistic && before) setData(optimistic(before));
      else setBusy(true);
      try {
        const next = await request();
        setData(next);
        return next;
      } catch (error) {
        if (before) setData(before);
        setFailure(failureOf(error));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [resource.data, setData],
  );

  const add = useCallback((text: string) => act(() => sparkApi.add(text)), [act]);

  const finish = useCallback(
    (id: string) =>
      act(
        () => sparkApi.setStatus(id, "DONE"),
        (view) => {
          const task = view.tasks.find((t) => t.id === id);
          if (!task) return view;
          const tasks = view.tasks.filter((t) => t.id !== id);
          return {
            ...view,
            tasks,
            doneToday: [{ id, title: task.title, completedAt: new Date().toISOString() }, ...view.doneToday],
            stats: { ...view.stats, openToday: tasks.filter((t) => t.bucket !== "later").length, doneToday: view.stats.doneToday + 1 },
          };
        },
      ),
    [act],
  );

  const reopen = useCallback((id: string) => act(() => sparkApi.setStatus(id, "TODO")), [act]);
  const defer = useCallback((id: string) => act(() => sparkApi.defer(id)), [act]);
  const remove = useCallback((id: string) => act(() => sparkApi.remove(id)), [act]);

  const tick = useCallback(
    (id: string, index: number, done: boolean) =>
      act(
        () => sparkApi.setStep(id, index, done),
        (view) => ({
          ...view,
          tasks: view.tasks.map((t) => (t.id === id ? { ...t, steps: t.steps.map((s, i) => (i === index ? { ...s, done } : s)) } : t)),
        }),
      ),
    [act],
  );

  const logFocus = useCallback((minutes: number, taskId?: string) => act(() => sparkApi.focus(minutes, taskId)), [act]);
  const replan = useCallback(() => act(() => sparkApi.view()), [act]);

  return {
    view: resource.data,
    isLoading: resource.isLoading,
    error: resource.error,
    refresh: resource.refresh,
    busy,
    failure,
    clearFailure: () => setFailure(null),
    add, finish, reopen, defer, remove, tick, logFocus, replan,
  };
}
