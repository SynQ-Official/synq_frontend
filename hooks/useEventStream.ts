"use client";

import { useEffect, useRef, useState } from "react";
import { runEventStream, type LiveEvent, type StreamState } from "@/lib/api/event-stream";

export { MAX_AUTH_RETRIES, backoffDelay } from "@/lib/api/event-stream";
export type { JobProgressData, LiveEvent, ReportReadyData, StreamEnvelope, StreamState } from "@/lib/api/event-stream";

/**
 * One server-sent event stream for the whole signed-in shell (see `lib/api/event-stream.ts` for the loop itself).
 * Runs while `enabled`; turning it off or unmounting aborts the loop, which removes every listener and timer it set.
 */
export function useEventStream({ enabled, onEvent }: { enabled: boolean; onEvent: (event: LiveEvent) => void }): { state: StreamState } {
  const [state, setState] = useState<StreamState>("connecting");
  const handler = useRef(onEvent);
  useEffect(() => {
    handler.current = onEvent;
  });

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void runEventStream(controller.signal, { onEvent: (event) => handler.current(event), onState: setState });
    return () => controller.abort();
  }, [enabled]);

  return { state };
}
