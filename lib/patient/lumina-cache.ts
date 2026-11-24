import { invalidatePatientData } from "@/hooks/usePatientResource";

/** Every Lumina cache key starts with this prefix (see hooks/patient/useLumina.ts). */
export const LUMINA_CACHE_PREFIX = "lumina";
export const luminaTodayKey = (hour: number) => `${LUMINA_CACHE_PREFIX}:today:${hour}`;
export const luminaSynthesisKey = (window: 7 | 30) => `${LUMINA_CACHE_PREFIX}:synthesis:${window}`;

/** The cached "today" no longer holds the moment an SOS is raised: Lumina must switch to its safety mode on the next render. */
export function invalidateLumina() {
  invalidatePatientData(LUMINA_CACHE_PREFIX);
}

/** After an SOS: the status read before it no longer applies, and neither do Lumina's recommendations. */
export function invalidateAfterSos(statusKey: string) {
  invalidatePatientData(statusKey);
  invalidateLumina();
}
