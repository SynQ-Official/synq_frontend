/** Small async primitives shared by the API client, the streams and the chat pacing. */

/** Resolves after `ms`, or as soon as `signal` aborts; either way its abort listener is removed. */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve) => {
    if (signal?.aborted) return resolve();
    const done = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", done);
      resolve();
    };
    const timer = setTimeout(done, ms);
    signal?.addEventListener("abort", done, { once: true });
  });
}

export type LinkedAbort = {
  /** Aborts when the caller's signal does, when `timeoutMs` runs out, or on `abort()`. */
  readonly signal: AbortSignal;
  abort: () => void;
  /** True when the timeout (not the caller) aborted it. */
  readonly timedOut: boolean;
  /** The work has started answering: the timeout no longer applies, the caller can still cancel. */
  stopTimer: () => void;
  /** Releases the timer and the listener on the caller's signal. Call it once the work is over. */
  dispose: () => void;
};

/** One signal for "the caller cancelled" and "it took too long", without leaking a listener on the caller's signal. */
export function linkedAbort(parent?: AbortSignal, timeoutMs?: number): LinkedAbort {
  const controller = new AbortController();
  const abort = () => controller.abort();
  let timedOut = false;
  if (parent?.aborted) abort();
  else parent?.addEventListener("abort", abort, { once: true });
  const timer =
    timeoutMs === undefined
      ? undefined
      : setTimeout(() => {
          timedOut = true;
          abort();
        }, timeoutMs);
  const stopTimer = () => clearTimeout(timer);
  return {
    signal: controller.signal,
    abort,
    get timedOut() {
      return timedOut;
    },
    stopTimer,
    dispose: () => {
      stopTimer();
      parent?.removeEventListener("abort", abort);
    },
  };
}
