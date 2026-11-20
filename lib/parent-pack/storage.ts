/**
 * Device-only state for the guidance exercises (ticked checklist steps, tokens on a token board). Nothing clinical lives
 * here: observations, journal, plans and the room are stored by the API. Every read is validated; a blocked or corrupted
 * storage falls back to the default.
 */
export type StorageLike = Pick<Storage, "getItem" | "setItem">;

function browserStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export const exerciseKey = (accountId: string, exerciseId: string) => `synq.parentPack.${accountId}.exercise.${exerciseId}`;

export function readStored<T>(key: string, sanitize: (raw: unknown) => T | null, fallback: T, store = browserStorage()): T {
  if (!store) return fallback;
  try {
    const raw = store.getItem(key);
    return raw === null ? fallback : sanitize(JSON.parse(raw)) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStored(key: string, value: unknown, store = browserStorage()): boolean {
  if (!store) return false;
  try {
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const asBoolArray = (raw: unknown) => (Array.isArray(raw) && raw.every((v) => typeof v === "boolean") ? raw : null);
export const asCount = (raw: unknown) => (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 99 ? raw : null);
