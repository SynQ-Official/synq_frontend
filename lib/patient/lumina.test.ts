import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { patientCopy } from "@/lib/i18n/patient";
import { checkinSubjectKey, introText, promptTitle, rationaleText, showLegacyExercises, signalLabel } from "./lumina";

const en = patientCopy.en;
const ar = patientCopy.ar;

/** Every wording id the backend may send (synq_backend lumina.rules.ts CHECKIN_PROMPTS). */
const PROMPT_IDS = ["mood.low", "energy.elevated", "energy.low", "focus.low", "focus.adhd", "sleep.dip", "sleep.routine"];
const RATIONALES = ["sleep_dip", "low_mood", "low_focus", "low_energy", "high_energy", "spark_low_completion", "clinician_assigned", "track_fit"];

function keys(o: unknown, prefix = ""): string[] {
  if (typeof o !== "object" || o === null || Array.isArray(o)) return [prefix];
  return Object.entries(o).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

describe("Lumina copy", () => {
  it("English and Arabic have the same Lumina keys, all non-empty", () => {
    expect(keys(ar.lumina)).toEqual(keys(en.lumina));
    for (const lang of [en, ar]) {
      for (const id of PROMPT_IDS) expect((lang.lumina.prompts as Record<string, string>)[id]).toBeTruthy();
      for (const r of RATIONALES) expect((lang.lumina.rationale as Record<string, string>)[r]).toBeTruthy();
      expect(lang.lumina.rate.scale).toHaveLength(5);
    }
  });

  it("shows Psychosis for the SCHIZOPHRENIA track in both languages", () => {
    expect(en.lumina.tracks.SCHIZOPHRENIA).toBe("Psychosis");
    expect(ar.lumina.tracks.SCHIZOPHRENIA).toBe("الذهان");
  });

  it("resolves contextual titles and falls back to the standard question for unknown or default ids", () => {
    expect(promptTitle(en, "sleep", "sleep.dip")).toBe(en.lumina.prompts["sleep.dip"]);
    expect(promptTitle(ar, "focus", "focus.adhd")).toBe(ar.lumina.prompts["focus.adhd"]);
    expect(promptTitle(en, "mood", "mood.default")).toBe(en.checkin.q.mood.title);
    expect(promptTitle(en, "mood", "mood.something_new")).toBe(en.checkin.q.mood.title);
    expect(promptTitle(en, "energy", undefined)).toBe(en.checkin.q.energy.title);
  });

  it("intro, rationale and signal labels never show raw ids", () => {
    expect(introText(en, "intro.evening")).toBe(en.lumina.intro["intro.evening"]);
    expect(introText(en, "intro.default")).toBeNull();
    expect(rationaleText(ar, "unknown")).toBe(ar.lumina.rationale.track_fit);
    expect(signalLabel(en, "low_energy")).toBe("Low energy");
    expect(signalLabel(en, "new_signal")).toBe("new signal");
  });

  it("the check-in feedback key is the wording set actually shown", () => {
    expect(checkinSubjectKey({ mood: "mood.low", energy: "energy.default", focus: "focus.adhd", sleep: "sleep.dip" }))
      .toBe("mood.low|energy.default|focus.adhd|sleep.dip");
    expect(checkinSubjectKey(undefined)).toBe("checkin.default");
    expect(checkinSubjectKey({ mood: "mood.low", energy: "energy.default", focus: "focus.adhd", sleep: "sleep.dip" })).toMatch(/^[a-z0-9._|-]{1,120}$/);
  });

  it("has a localized error message for the Lumina card in both languages", () => {
    expect(en.lumina.today.error).toMatch(/not available/i);
    expect([...ar.lumina.today.error].some((c) => c.charCodeAt(0) >= 0x600 && c.charCodeAt(0) <= 0x6ff)).toBe(true);   // Arabic script
    expect(ar.lumina.today.error).not.toBe(en.lumina.today.error);
  });
});

describe("showLegacyExercises (P1-1: no recommendation under SAFETY_YIELD)", () => {
  it("shows the older ranking only when the server said NORMAL; fails closed otherwise", () => {
    expect(showLegacyExercises("NORMAL")).toBe(true);
    expect(showLegacyExercises("SAFETY_YIELD")).toBe(false);
    expect(showLegacyExercises(undefined)).toBe(false);   // loading or failed: mode unknown
  });

  it("the dashboard renders the legacy list only through LuminaHome, never directly", () => {
    const page = readFileSync(fileURLToPath(new URL("../../app/dashboard/page.tsx", import.meta.url)), "utf8");
    expect(page).toContain("<LuminaHome />");
    expect(page).not.toMatch(/<RecommendedExercises/);
    const home = readFileSync(fileURLToPath(new URL("../../components/patient/lumina/LuminaHome.tsx", import.meta.url)), "utf8");
    expect(home).toMatch(/showLegacyExercises\(today\.data\?\.mode\) && <RecommendedExercises/);
  });
});

