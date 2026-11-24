import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";

const invalidatePatientData = vi.fn();
vi.mock("@/hooks/usePatientResource", () => ({ invalidatePatientData }));

const { LUMINA_CACHE_PREFIX, invalidateAfterSos, invalidateLumina, luminaSynthesisKey, luminaTodayKey } = await import("./lumina-cache");

describe("Lumina cache invalidation on SOS (P1-2)", () => {
  beforeEach(() => invalidatePatientData.mockClear());

  it("an SOS invalidates both the SOS status and every Lumina answer, status first", () => {
    invalidateAfterSos("sos:status");
    expect(invalidatePatientData.mock.calls).toEqual([["sos:status"], ["lumina"]]);
  });

  it("invalidateLumina clears the whole lumina prefix", () => {
    invalidateLumina();
    expect(invalidatePatientData).toHaveBeenCalledExactlyOnceWith(LUMINA_CACHE_PREFIX);
  });

  it("every Lumina cache key lives under the invalidated prefix (the store drops keys by prefix)", () => {
    for (const key of [luminaTodayKey(0), luminaTodayKey(23), luminaSynthesisKey(7), luminaSynthesisKey(30)]) {
      expect(key.startsWith(LUMINA_CACHE_PREFIX)).toBe(true);
    }
  });

  it("the SOS hook goes through invalidateAfterSos, and the today answer is no longer cached for 2 minutes", () => {
    const sos = readFileSync(fileURLToPath(new URL("../../hooks/patient/useSos.ts", import.meta.url)), "utf8");
    expect(sos).toContain("invalidateAfterSos(STATUS_KEY)");
    const hook = readFileSync(fileURLToPath(new URL("../../hooks/patient/useLumina.ts", import.meta.url)), "utf8");
    const stale = Number(/TODAY_STALE_MS = ([\d_]+)/.exec(hook)?.[1].replaceAll("_", ""));
    expect(stale).toBeGreaterThan(0);
    expect(stale).toBeLessThanOrEqual(30_000);
  });
});
