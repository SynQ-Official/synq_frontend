import { EventStreamContentType, fetchEventSource, type EventSourceMessage } from "@microsoft/fetch-event-source";
import { linkedAbort, type LinkedAbort } from "@/lib/async";
import { ensureSession, refreshSession, unwrap } from "./client";
import { apiUrl } from "./config";
import { ApiError, apiErrorFrom, errorCode, errorStatus, messageFrom, readJson, resourcesOf, safeParse } from "./errors";
import type { Schema } from "./schemas";
import { getAccessToken } from "./tokens";

/**
 * Streamed agent turns (Mira): `POST …/stream` answers with server-sent events
 *   `delta` { text }*   then   `final` <the synchronous endpoint's body>   or   `error` { statusCode, message, code?, emergencyResources? }
 *
 * The browser talks to the API directly: SSE must never go through a Next.js rewrite or route
 * (Vercel would cut the stream). `fetch` is used (not EventSource) because the request carries
 * a bearer token and a JSON body.
 *
 * Failure model, so callers can decide what is safe to do silently:
 *  - `StreamUnavailable`  the stream never opened -> nothing happened server-side, use the sync endpoint;
 *  - `ApiError`           a normal JSON refusal before the stream opened (403, 409, validation, 429, 503...);
 *  - `StreamTurnError`    the agent turn failed after the stream opened (an `error` event);
 *  - `StreamInterrupted`  the connection dropped mid-answer, no `final` -> the turn may or may not exist;
 *  - an `AbortError`      the caller stopped it.
 */

/** The stream could not be opened (network, timeout, 404/405/5xx, or not an event stream). */
export class StreamUnavailable extends Error {
  constructor(message = "The live connection could not be opened.") {
    super(message);
    this.name = "StreamUnavailable";
  }
}

/** The connection dropped after the answer had started, before `final` arrived. */
export class StreamInterrupted extends Error {
  constructor(public readonly partialText: string) {
    super("The connection was interrupted.");
    this.name = "StreamInterrupted";
  }
}

/** An `error` event: the turn failed after the stream was already open. */
export class StreamTurnError extends ApiError {
  constructor(
    message: string,
    status: number,
    code: string | undefined,
    payload: unknown,
    public readonly emergencyResources: string[],
    public readonly partialText: string,
  ) {
    super(message, status, code, payload);
    this.name = "StreamTurnError";
  }
}

const OPEN_TIMEOUT_MS = 15_000;
/**
 * Statuses that mean "this route is not available here", not "the request was refused". 503 is not one of them:
 * it is the engine shedding load (MIRA_BUSY), and replaying the turn synchronously at once would only add to it.
 */
export const FALLBACK_STATUSES: ReadonlySet<number> = new Set([404, 405, 408, 500, 502, 504]);

class RetryWithFreshToken extends Error {}

export type StreamTurnOptions<T = unknown> = {
  /** Path under /api/v1, e.g. "/mira/session/:id/message/stream". */
  path: string;
  body: unknown;
  headers?: Record<string, string>;
  /** Attach the patient bearer token (default true). */
  auth?: boolean;
  signal?: AbortSignal;
  onDelta?: (text: string) => void;
  /** Validates the `final` body at runtime (see `unwrap`). */
  schema?: Schema<T>;
};

/** What one connection saw: whether it opened, the text so far, and the terminal event if one came. */
type TurnState = { opened: boolean; partial: string; final: { body: unknown } | null; failure: { payload: unknown } | null };

async function turnHeaders(options: StreamTurnOptions<unknown>): Promise<{ headers: Record<string, string>; token: string | null }> {
  if (options.auth !== false) await ensureSession();
  const token = options.auth === false ? null : getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json", ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  return { headers, token };
}

/** An event stream goes on; anything else is either "not available here" (fallback) or a normal JSON refusal. */
async function checkOpen(res: Response, canRetryAuth: boolean): Promise<void> {
  if (res.ok && (res.headers.get("content-type") ?? "").startsWith(EventStreamContentType)) return;
  if (res.status === 401 && canRetryAuth) throw new RetryWithFreshToken();
  if (res.ok || FALLBACK_STATUSES.has(res.status)) throw new StreamUnavailable();
  throw apiErrorFrom(await readJson(res), res.status);
}

/** One SSE frame: text is delivered as it arrives; a terminal event is kept and the connection closed. */
function onFrame(event: EventSourceMessage, state: TurnState, link: LinkedAbort, onDelta?: (text: string) => void): void {
  if (event.event === "delta") {
    const text = (safeParse(event.data) as { text?: unknown } | undefined)?.text;
    if (typeof text !== "string" || !text) return;
    state.partial += text;
    onDelta?.(text);
  } else if (event.event === "final" || event.event === "error") {
    if (event.event === "final") state.final = { body: safeParse(event.data) };
    else state.failure = { payload: safeParse(event.data) };
    link.abort();
  }
}

function connect(options: StreamTurnOptions<unknown>, headers: Record<string, string>, state: TurnState, link: LinkedAbort, canRetryAuth: boolean) {
  return fetchEventSource(apiUrl(options.path), {
    method: "POST",
    headers,
    body: JSON.stringify(options.body ?? {}),
    signal: link.signal,
    // A conversation must keep streaming when the patient glances at another tab.
    openWhenHidden: true,
    async onopen(res) {
      state.opened = true;
      link.stopTimer();
      await checkOpen(res, canRetryAuth);
    },
    onmessage: (event) => onFrame(event, state, link, options.onDelta),
    onclose() {
      // The server ended the stream. Never let the library reconnect and re-run a turn.
      throw new StreamInterrupted(state.partial);
    },
    onerror(error) {
      // Throwing stops the library's automatic retry.
      throw error;
    },
  });
}

const stopped = () => new DOMException("Stopped", "AbortError");

/** What a throw while connecting means for the caller; `null` when it was our own abort after a terminal event. */
function connectionFailure(error: unknown, state: TurnState, link: LinkedAbort, signal?: AbortSignal): Error | "retry" | null {
  if (state.final || state.failure) return null;
  if (error instanceof RetryWithFreshToken) return "retry";
  if (error instanceof ApiError || error instanceof StreamUnavailable) return error;
  if (signal?.aborted) return stopped();
  if (link.timedOut || !state.opened) return new StreamUnavailable();
  return error instanceof StreamInterrupted ? error : new StreamInterrupted(state.partial);
}

/** The outcome once the connection is over: the `final` body, the turn's error, or why nothing came. */
function settle<T>(state: TurnState, link: LinkedAbort, options: StreamTurnOptions<T>): T {
  if (state.final) return unwrap(state.final.body, options.schema);
  if (state.failure) {
    const { payload } = state.failure;
    const status = errorStatus(payload, 500);
    throw new StreamTurnError(messageFrom(payload, status), status, errorCode(payload), payload, resourcesOf(payload), state.partial);
  }
  // fetchEventSource resolves quietly when aborted: tell a stop, a stalled open and a dropped stream apart.
  if (options.signal?.aborted) throw stopped();
  if (link.timedOut || !state.opened) throw new StreamUnavailable();
  throw new StreamInterrupted(state.partial);
}

async function attempt<T>(options: StreamTurnOptions<T>, retryAuth: boolean): Promise<T> {
  const { headers, token } = await turnHeaders(options);
  const link = linkedAbort(options.signal, OPEN_TIMEOUT_MS);
  const state: TurnState = { opened: false, partial: "", final: null, failure: null };
  try {
    await connect(options, headers, state, link, retryAuth && token !== null);
  } catch (error) {
    const failure = connectionFailure(error, state, link, options.signal);
    if (failure === "retry") {
      if (await refreshSession()) return attempt<T>(options, false);
      throw new ApiError(messageFrom(null, 401), 401);
    }
    if (failure) throw failure;
  } finally {
    link.dispose();
  }
  return settle(state, link, options);
}

/** Open the stream, deliver text as it arrives, and resolve with the `final` body (the source of truth). */
export function streamTurn<T>(options: StreamTurnOptions<T>): Promise<T> {
  return attempt<T>(options, true);
}

/**
 * The streamed turn with a silent safety net: if the stream cannot open, the synchronous endpoint
 * answers instead and the patient just sees the reply arrive whole.
 * `resumable` turns carry a client message id the API de-duplicates on, so after a dropped
 * connection the same sync call is safe too (it returns the stored turn or runs it once).
 */
export async function streamWithFallback<T>(
  options: StreamTurnOptions<T> & { sync: () => Promise<T>; resumable?: boolean },
): Promise<T> {
  const { sync, resumable = false, ...stream } = options;
  try {
    return await streamTurn<T>(stream);
  } catch (error) {
    if (stream.signal?.aborted) throw error;
    if (error instanceof StreamUnavailable || (resumable && error instanceof StreamInterrupted)) return sync();
    throw error;
  }
}
