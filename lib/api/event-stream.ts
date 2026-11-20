import { EventStreamContentType, fetchEventSource, type EventSourceMessage } from "@microsoft/fetch-event-source";
import { sleep } from "@/lib/async";
import { refreshSession } from "./client";
import { apiUrl } from "./config";
import { safeParse } from "./errors";
import { getAccessToken } from "./tokens";

/**
 * The per-user event stream, `GET /api/v1/events`, as a plain loop (the React hook only starts and stops it).
 *
 * - Talks to the API directly. SSE must never pass through a Next.js rewrite or route handler
 *   (Vercel would cut the stream).
 * - Reconnects forever with exponential backoff and full jitter, resuming with `Last-Event-ID`
 *   so nothing published in the gap is lost (the API keeps a short replay buffer).
 * - Quiet by design: a drop, a server restart (`shutdown`) or a full house (429) never surfaces
 *   an error; the state only drives a subtle "reconnecting" hint.
 * - The API ends the stream at the token's `exp` (`shutdown` with `reason: "token_expired"`): the token is
 *   renewed first, then the stream reopens, so the expired one is never sent again.
 * - Stops for good when its signal aborts (sign-out, unmount) or the session is gone.
 */

/** The envelope the API writes in every event frame's `data`. */
export type StreamEnvelope<T = unknown> = { id: number; type: string; ts: string; data: T };

export type ReportReadyData = { reportId: string | null; weekStart: string; audience: "psychologist" | "patient"; trafficLight?: string | null };
export type JobProgressData = {
  jobId: string;
  kind: string;
  status: "queued" | "running" | "completed" | "failed";
  progress?: number;
};

export type LiveEvent =
  | { type: "report.ready"; id: number; data: ReportReadyData }
  | { type: "job.progress"; id: number; data: JobProgressData }
  | { type: string; id: number; data: unknown };

export type StreamState = "connecting" | "open" | "reconnecting" | "offline";

export type EventStreamHandlers = { onEvent: (event: LiveEvent) => void; onState: (state: StreamState) => void };

const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 30_000;
/** 429 means this account already holds its maximum streams: wait longer, and never complain. */
const TOO_MANY_DELAY_MS = 20_000;
const DEFAULT_HEARTBEAT_S = 15;
/**
 * Renewals in a row without the stream ever opening. Past it the stream gives up: a fresh token refused again
 * would otherwise rotate the refresh token in a tight loop.
 */
export const MAX_AUTH_RETRIES = 2;

type ReconnectReason = "retry" | "tooMany" | "auth" | "expired" | "ended";

class Reconnect extends Error {
  constructor(readonly delayMs: number | null, readonly reason: ReconnectReason) {
    super(reason);
  }
}

/** Full jitter: a random point below the exponential ceiling, so many tabs never reconnect in lockstep. */
export function backoffDelay(attempt: number, random: () => number = Math.random): number {
  const ceiling = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attempt);
  return Math.round(ceiling / 2 + random() * (ceiling / 2));
}

/** Everything one run of the loop remembers between connections. */
type Loop = {
  signal: AbortSignal;
  handlers: EventStreamHandlers;
  lastEventId?: string;
  attempt: number;
  authRetries: number;
  heartbeatMs: number;
  lastActivity: number;
};

/** Resolves when the browser is back online (or immediately if it already is); never leaves a listener behind. */
function whenOnline(signal: AbortSignal): Promise<void> {
  return new Promise<void>((resolve) => {
    if (navigator.onLine) return resolve();
    const done = () => {
      window.removeEventListener("online", done);
      signal.removeEventListener("abort", done);
      resolve();
    };
    window.addEventListener("online", done, { once: true });
    signal.addEventListener("abort", done, { once: true });
  });
}

/** Wraps fetch so the idle watchdog can see any byte, comments and heartbeats included. */
function trackedFetch(onActivity: () => void): typeof fetch {
  return async (input, init) => {
    const response = await fetch(input, init);
    if (!response.body) return response;
    const body = response.body.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          onActivity();
          controller.enqueue(chunk);
        },
      }),
    );
    return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  };
}

function onOpen(res: Response, loop: Loop): void {
  if (res.ok && (res.headers.get("content-type") ?? "").startsWith(EventStreamContentType)) {
    loop.attempt = 0;
    loop.authRetries = 0;
    loop.handlers.onState("open");
    return;
  }
  if (res.status === 401) throw new Reconnect(0, "auth");
  if (res.status === 429) throw new Reconnect(TOO_MANY_DELAY_MS, "tooMany");
  throw new Reconnect(null, "retry");
}

function onFrame(message: EventSourceMessage, loop: Loop): void {
  if (message.event === "ready") {
    const beat = (safeParse(message.data) as { heartbeatSeconds?: unknown } | undefined)?.heartbeatSeconds;
    if (typeof beat === "number" && beat > 0) loop.heartbeatMs = beat * 1000;
    return;
  }
  if (message.event === "shutdown") {
    const reason = (safeParse(message.data) as { reason?: unknown } | undefined)?.reason;
    throw reason === "token_expired" ? new Reconnect(0, "expired") : new Reconnect(300, "ended");
  }
  if (!message.event) return;
  const envelope = safeParse(message.data) as StreamEnvelope | undefined;
  if (!envelope || typeof envelope !== "object") return;
  if (message.id) loop.lastEventId = message.id;
  else if (typeof envelope.id === "number") loop.lastEventId = String(envelope.id);
  loop.handlers.onEvent({ type: message.event, id: envelope.id, data: envelope.data } as LiveEvent);
}

/** One connection, from open to its end. It always ends by throwing: a `Reconnect`, or the error that cut it. */
async function connect(loop: Loop): Promise<never> {
  const token = getAccessToken();
  if (!token) throw new Reconnect(null, "auth");
  const connection = new AbortController();
  const stop = () => connection.abort();
  loop.signal.addEventListener("abort", stop, { once: true });
  loop.lastActivity = Date.now();
  // The API sends a heartbeat every few seconds: silence for three beats means a dead connection.
  const watchdog = setInterval(() => {
    if (Date.now() - loop.lastActivity > loop.heartbeatMs * 3) connection.abort();
  }, loop.heartbeatMs);
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (loop.lastEventId) headers["Last-Event-ID"] = loop.lastEventId;
  try {
    await fetchEventSource(apiUrl("/events"), {
      method: "GET",
      headers,
      signal: connection.signal,
      fetch: trackedFetch(() => (loop.lastActivity = Date.now())),
      openWhenHidden: true,
      onopen: async (res) => onOpen(res, loop),
      onmessage: (message) => onFrame(message, loop),
      onclose: () => {
        throw new Reconnect(null, "retry");
      },
      onerror: (error) => {
        throw error;
      },
    });
    throw new Reconnect(null, "retry");
  } finally {
    clearInterval(watchdog);
    loop.signal.removeEventListener("abort", stop);
  }
}

/** After a connection ended: wait the right amount, renew the token when that is the reason, or give up. */
async function recover(error: unknown, loop: Loop): Promise<"again" | "stop"> {
  if (!(error instanceof Reconnect)) {
    loop.handlers.onState(navigator.onLine ? "reconnecting" : "offline");
    await sleep(backoffDelay(loop.attempt++), loop.signal);
    return "again";
  }
  if (error.reason === "auth" || error.reason === "expired") {
    // A stale or expired token: renew it and reconnect at once, a bounded number of times in a row;
    // otherwise leave (the shell signs the patient out).
    if (error.delayMs !== 0 || loop.authRetries >= MAX_AUTH_RETRIES || !(await refreshSession())) return "stop";
    loop.authRetries += 1;
    return "again";
  }
  loop.handlers.onState("reconnecting");
  const delay = error.delayMs ?? backoffDelay(loop.attempt++);
  await sleep(error.reason === "tooMany" ? delay + Math.random() * 10_000 : delay, loop.signal);
  return "again";
}

/** Runs until `signal` aborts or the session is gone; every listener and timer it set is gone when it resolves. */
export async function runEventStream(signal: AbortSignal, handlers: EventStreamHandlers): Promise<void> {
  const loop: Loop = { signal, handlers, attempt: 0, authRetries: 0, heartbeatMs: DEFAULT_HEARTBEAT_S * 1000, lastActivity: Date.now() };
  const onOffline = () => handlers.onState("offline");
  window.addEventListener("offline", onOffline);
  try {
    while (!signal.aborted) {
      if (!navigator.onLine) {
        handlers.onState("offline");
        await whenOnline(signal);
        if (signal.aborted) return;
      }
      try {
        await connect(loop);
      } catch (error) {
        if (signal.aborted || (await recover(error, loop)) === "stop") return;
      }
    }
  } finally {
    window.removeEventListener("offline", onOffline);
  }
}
