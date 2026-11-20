"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ApiError } from "@/lib/api/client";

/**
 * Tiny stale-while-revalidate cache for the patient app (no extra dependency).
 *
 *  - a key that was loaded before renders instantly from memory and refreshes in the background;
 *  - `invalidatePatientData("checkins")` refetches every mounted hook whose key starts with it,
 *    so a mutation in one screen keeps the others truthful;
 *  - the cache is cleared on sign-out (see `clearPatientCache`) so one patient's data never
 *    shows for the next.
 *
 * The cache is an external store read with `useSyncExternalStore`, so every hook on a key sees
 * the same value and re-renders together.
 */

type Entry = { data: unknown; at: number };
const cache = new Map<string, Entry>();
const storeListeners = new Set<() => void>();
const invalidationListeners = new Set<(prefix: string) => void>();

const DEFAULT_STALE_MS = 30_000;

/** Requests started ahead of the screen that needs them (see `prefetchPatientData`), shared by key. */
const inflight = new Map<string, Promise<void>>();
/** Bumped on sign-out: a request that was already on its way never writes into the next patient's cache. */
let epoch = 0;

function notify() {
  storeListeners.forEach((listener) => listener());
}

function subscribeStore(listener: () => void) {
  storeListeners.add(listener);
  return () => {
    storeListeners.delete(listener);
  };
}

export function invalidatePatientData(prefix: string) {
  for (const key of [...cache.keys()]) if (key.startsWith(prefix)) cache.delete(key);
  invalidationListeners.forEach((listener) => listener(prefix));
  notify();
}

export function clearPatientCache() {
  epoch += 1;
  cache.clear();
  inflight.clear();
  notify();
}

/**
 * Put a known value in the cache without a request (the last profile, restored from this device).
 * `at: 0` marks it stale, so the screen shows it at once and the hook refreshes it in the background.
 */
export function seedPatientData<T>(key: string, data: T, at = 0) {
  if (cache.has(key)) return;
  cache.set(key, { data, at });
  notify();
}

/**
 * Start loading a key before its screen mounts (from the sign-in page). Independent calls can be
 * started together; the hook that later asks for the same key reuses the request in flight.
 */
export function prefetchPatientData<T>(key: string, fetcher: () => Promise<T>, staleMs = DEFAULT_STALE_MS): Promise<void> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < staleMs) return Promise.resolve();
  const running = inflight.get(key);
  if (running) return running;
  const startedIn = epoch;
  const request = fetcher()
    .then((data) => {
      if (startedIn !== epoch) return;
      cache.set(key, { data, at: Date.now() });
      notify();
    })
    .catch(() => undefined)
    .finally(() => {
      if (inflight.get(key) === request) inflight.delete(key);
    });
  inflight.set(key, request);
  return request;
}

export type Resource<T> = {
  data: T | undefined;
  error: Error | null;
  /** First load with nothing to show yet (drives skeletons). */
  isLoading: boolean;
  /** A background refresh is running while `data` is already shown. */
  isRefreshing: boolean;
  refresh: () => Promise<void>;
  /** Replace the cached value locally (optimistic update or a mutation response). */
  setData: (next: T | ((current: T | undefined) => T)) => void;
};

export function usePatientResource<T>(
  key: string | null,
  fetcher: (signal: AbortSignal) => Promise<T>,
  options: { staleMs?: number } = {},
): Resource<T> {
  const staleMs = options.staleMs ?? DEFAULT_STALE_MS;
  const entry = useSyncExternalStore(
    subscribeStore,
    () => (key ? cache.get(key) : undefined),
    () => undefined,
  );
  // An error belongs to the key that produced it; a new key starts clean.
  const [failure, setFailure] = useState<{ key: string; error: Error } | null>(null);
  const [refreshingKey, setRefreshingKey] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  const runId = useRef(0);
  /** The request in flight: aborted when a newer run replaces it, the key changes or the screen unmounts. */
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const run = useCallback(
    async (force: boolean) => {
      if (!key) return;
      const cached = cache.get(key);
      if (!force && cached && Date.now() - cached.at < staleMs) return;

      const id = ++runId.current;
      setRefreshingKey(key);
      try {
        // A request already started for this key (a prefetch) is reused instead of asking twice.
        const early = !force ? inflight.get(key) : undefined;
        if (early) {
          await early;
          const arrived = cache.get(key);
          if (arrived && Date.now() - arrived.at < staleMs) return;
        }
        controller.current?.abort();
        const current = new AbortController();
        controller.current = current;
        const next = await fetcherRef.current(current.signal);
        if (id !== runId.current) return;
        cache.set(key, { data: next, at: Date.now() });
        setFailure(null);
        notify();
      } catch (caught) {
        if (id !== runId.current || (caught as Error)?.name === "AbortError") return;
        setFailure({ key, error: caught instanceof Error ? caught : new ApiError("Request failed", 0) });
      } finally {
        if (id === runId.current) setRefreshingKey(null);
      }
    },
    [key, staleMs],
  );

  useEffect(() => {
    // Deferred a tick: the load is a subscription to the network, not a state sync.
    queueMicrotask(() => void run(false));
    return () => {
      runId.current += 1;
      controller.current?.abort();
      controller.current = null;
    };
  }, [run]);

  useEffect(() => {
    const onInvalidate = (prefix: string) => {
      if (key?.startsWith(prefix)) void run(true);
    };
    invalidationListeners.add(onInvalidate);
    return () => {
      invalidationListeners.delete(onInvalidate);
    };
  }, [key, run]);

  const setData = useCallback(
    (next: T | ((current: T | undefined) => T)) => {
      if (!key) return;
      const previous = cache.get(key)?.data as T | undefined;
      const value = typeof next === "function" ? (next as (current: T | undefined) => T)(previous) : next;
      cache.set(key, { data: value, at: Date.now() });
      notify();
    },
    [key],
  );

  const data = entry?.data as T | undefined;
  const error = failure && failure.key === key ? failure.error : null;

  return {
    data,
    error,
    isLoading: data === undefined && error === null && key !== null,
    isRefreshing: refreshingKey !== null && refreshingKey === key,
    refresh: () => run(true),
    setData,
  };
}
