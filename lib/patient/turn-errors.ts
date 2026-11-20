import { ApiError, resourcesOf } from "@/lib/api/errors";
import { StreamInterrupted, StreamTurnError } from "@/lib/api/stream";

/**
 * What went wrong with a conversation turn, in the terms the screen cares about. Nothing here is
 * raw error text: each kind maps to a calm, human sentence (see `copy.live.stream`).
 */
export type TurnFailureKind =
  | "support" // emergency resources came with the failure: show the support card
  | "offline"
  | "timeout"
  | "rateLimited"
  | "busy" // 503: the engine shed the turn under load (MIRA_BUSY); sending again later is safe
  | "validation"
  | "conflict"
  | "interrupted"
  | "other";

export type TurnFailure = {
  kind: TurnFailureKind;
  code?: string;
  emergencyResources: string[];
  /** Text that had already arrived when the turn failed (kept on screen). */
  partialText: string;
};

const resourcesFor = (error: ApiError): string[] => (error instanceof StreamTurnError ? error.emergencyResources : resourcesOf(error.payload));

export function classifyTurnFailure(error: unknown): TurnFailure {
  if (error instanceof StreamInterrupted) {
    return { kind: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "interrupted", emergencyResources: [], partialText: error.partialText };
  }
  if (!(error instanceof ApiError)) return { kind: "other", emergencyResources: [], partialText: "" };

  const emergencyResources = resourcesFor(error);
  const partialText = error instanceof StreamTurnError ? error.partialText : "";
  const base = { code: error.code, emergencyResources, partialText };

  if (emergencyResources.length > 0) return { ...base, kind: "support" };
  if (error.isTimeout) return { ...base, kind: "timeout" };
  if (error.isNetwork) return { ...base, kind: "offline" };
  if (error.status === 429) return { ...base, kind: "rateLimited" };
  if (error.status === 503) return { ...base, kind: "busy" };
  if (error.status === 400 || error.status === 422) return { ...base, kind: "validation" };
  if (error.status === 409) return { ...base, kind: "conflict" };
  return { ...base, kind: "other" };
}

/** The friendly sentence for a failure kind, or null when the kind has its own dedicated screen. */
export function failureMessage(
  kind: TurnFailureKind,
  copy: { stream: { interrupted: string; slow: string; offlineSend: string; rateLimited: string; validation: string; conflict: string } },
  generic: string,
): string | null {
  switch (kind) {
    case "offline": return copy.stream.offlineSend;
    case "timeout": return copy.stream.slow;
    case "rateLimited":
    case "busy": return copy.stream.rateLimited;
    case "validation": return copy.stream.validation;
    case "conflict": return copy.stream.conflict;
    case "interrupted": return copy.stream.interrupted;
    case "other": return generic;
    default: return null;
  }
}
