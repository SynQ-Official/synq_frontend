/**
 * How the Nest API's answers and failures are read, in one place. No browser globals: the same-origin session route
 * (server side) uses it too.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
  get isConflict(): boolean {
    return this.status === 409;
  }
  /** The request never got an answer in time (slow network or a sleeping server). */
  get isTimeout(): boolean {
    return this.code === "TIMEOUT";
  }
  /** The request never reached the API (offline, DNS, CORS...). */
  get isNetwork(): boolean {
    return this.status === 0 && !this.isTimeout;
  }
}

/** The API answered 2xx with a body this app cannot read (a contract drift): never rendered as if it were valid. */
export const INVALID_RESPONSE = "INVALID_RESPONSE";

const DEFAULT_MESSAGES: Record<number, string> = {
  400: "The request was rejected. Check the values and try again.",
  401: "Your session expired. Please sign in again.",
  403: "You are not allowed to perform this action.",
  404: "This record no longer exists.",
  409: "This action is no longer possible.",
  429: "Too many requests. Please wait a moment and retry.",
  502: "The SynQ API is unreachable.",
};

const asRecord = (payload: unknown): Record<string, unknown> | null =>
  payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;

/** Nest's `message` (a string, or the list of DTO violations), then `error`, then a default for the status. */
export function messageFrom(payload: unknown, status: number): string {
  const body = asRecord(payload);
  const message = body?.message;
  if (Array.isArray(message) && message.length) return message.join(", ");
  if (typeof message === "string" && message.trim()) return message;
  if (typeof body?.error === "string" && body.error.trim()) return body.error;
  return DEFAULT_MESSAGES[status] ?? `Request failed (HTTP ${status}).`;
}

/** The machine-readable `code` of a refusal (e.g. ORIENTATION_COMPLETED, MIRA_BUSY), when it has one. */
export function errorCode(payload: unknown): string | undefined {
  const code = asRecord(payload)?.code;
  return typeof code === "string" ? code : undefined;
}

/** The `statusCode` an SSE `error` event carries, or `fallback`. */
export function errorStatus(payload: unknown, fallback: number): number {
  const status = asRecord(payload)?.statusCode;
  return typeof status === "number" ? status : fallback;
}

/** An ApiError built the same way for every refusal: Nest's message, its code, and the raw body kept for the caller. */
export function apiErrorFrom(payload: unknown, status: number): ApiError {
  return new ApiError(messageFrom(payload, status), status, errorCode(payload), payload);
}

/** Emergency resources the API attaches to a refusal tied to a safety concern. */
export function resourcesOf(payload: unknown): string[] {
  const list = asRecord(payload)?.emergencyResources;
  return Array.isArray(list) ? list.filter((item): item is string => typeof item === "string") : [];
}

/** JSON.parse that answers `undefined` instead of throwing (SSE frames, cached values). */
export function safeParse(data: string): unknown {
  try {
    return JSON.parse(data);
  } catch {
    return undefined;
  }
}

/** The optional `{ success, data }` envelope, opened; a raw payload is returned as it is. */
export function unwrapEnvelope(payload: unknown): unknown {
  const body = asRecord(payload);
  return body && "success" in body && "data" in body ? body.data : payload;
}

/** The JSON body of a response: `undefined` for 204, `null` when it is not JSON or cannot be read. */
export async function readJson(res: Response): Promise<unknown> {
  if (res.status === 204) return undefined;
  if (!(res.headers.get("content-type") || "").includes("application/json")) return null;
  return res.json().catch(() => null);
}
