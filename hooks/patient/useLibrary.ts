"use client";

import { useCallback, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { libraryApi } from "@/lib/api/patient";
import type { LibraryEventType, LibraryItem } from "@/lib/api/patient-types";
import { usePatientResource } from "@/hooks/usePatientResource";

/** How many articles one request brings, and the most the backend allows. */
const BATCH = 6;

type LibraryState = { items: LibraryItem[]; /** Backend reason code when there is nothing to show. */ reason?: string };

/** Sent once per article and kind in this tab; a repeated click or a re-render never adds a second event. */
const sent = new Set<string>();

const newEventId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`);

/**
 * The articles the Smart Library recommends from this patient's own Smart Journal.
 *
 * It reads what still applies (read-only, so reloading the page does not use up the catalog) and only asks for new
 * articles when the backend says a theme in the Journal has one waiting. An empty answer (too few entries, no recurring
 * theme, nothing relevant) is a normal state, not an error: `items` is empty and `reason` says why. Everything is the
 * signed-in patient's own; nothing here sends an id or any free text.
 *
 * The key sits under "journal" so that every change to the Journal, or a finished analysis, recalculates it.
 */
export function useLibrary(enabled = true) {
  const resource = usePatientResource<LibraryState>(
    enabled ? "journal:library" : null,
    async () => {
      let current = await libraryApi.current();
      if (current.refresh) {
        await libraryApi.recommend({ limit: 3 });
        current = await libraryApi.current();
      }
      return { items: current.items, reason: current.reason };
    },
    { staleMs: 5 * 60_000 },
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<Error | null>(null);
  const [noMore, setNoMore] = useState(false);
  const { setData } = resource;

  /** Ask for further articles and add them after the ones already shown. */
  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    setMoreError(null);
    try {
      const fresh = await libraryApi.recommend({ limit: BATCH });
      if (fresh.type === "NO_RECOMMENDATION") {
        setNoMore(true);
        return;
      }
      setNoMore(false);
      setData((current) => {
        const shown = new Set((current?.items ?? []).map((i) => i.content.id));
        return { items: [...(current?.items ?? []), ...fresh.items.filter((i) => !shown.has(i.content.id))] };
      });
    } catch (caught) {
      setMoreError(caught instanceof Error ? caught : new ApiError("Request failed", 0));
    } finally {
      setLoadingMore(false);
    }
  }, [setData]);

  /** Tell the library what the patient did. Best effort: feedback never blocks reading, and a failure is not shown. */
  const sendEvent = useCallback(
    (contentId: string, type: LibraryEventType) => {
      const key = `${contentId}:${type}`;
      if (sent.has(key)) return;
      sent.add(key);
      libraryApi.sendEvent({ eventId: newEventId(), contentId, type }).catch(() => sent.delete(key));
      // A dismissed article leaves the list straight away; the backend also stops listing it.
      if (type === "DISMISSED") setData((current) => ({ ...current, items: (current?.items ?? []).filter((i) => i.content.id !== contentId) }));
    },
    [setData],
  );

  return {
    items: resource.data?.items ?? [],
    /** Why there is nothing to show (`NO_JOURNAL_ENTRIES`, `LIMITED_JOURNAL`, …), when the answer was empty. */
    reason: resource.data?.reason,
    isLoading: resource.isLoading,
    error: resource.error,
    refresh: resource.refresh,
    loadMore,
    loadingMore,
    moreError,
    noMore,
    sendEvent,
  };
}
