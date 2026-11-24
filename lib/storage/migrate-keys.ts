/**
 * Copies every localStorage key written under the old `vitamind` name to its `synq` twin, then removes the old one.
 * An existing `synq` key wins: the old value is only dropped. Per-user keys keep their suffix (`vitamind_x:id` -> `synq_x:id`).
 * Runs once per load before the app reads storage (see lib/api/tokens.ts and contexts/LanguageContext.tsx); a second run is a no-op.
 */
// legacy: read until 2026-12-22, then remove
const LEGACY_PREFIXES = ["vitamind_", "vitamind-"];

export function migrateLegacyKeys(storage: Storage | undefined = typeof window === "undefined" ? undefined : window.localStorage): void {
  if (!storage) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key) keys.push(key);
    }
    for (const key of keys) {
      if (!LEGACY_PREFIXES.some((prefix) => key.startsWith(prefix))) continue;
      const next = "synq" + key.slice("vitamind".length);
      if (storage.getItem(next) === null) {
        const value = storage.getItem(key);
        // Copy before removing: a failed write leaves the original in place.
        if (value !== null) storage.setItem(next, value);
      }
      storage.removeItem(key);
    }
  } catch {
    /* storage unavailable or full: nothing to migrate */
  }
}
