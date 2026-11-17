import { describe, expect, it } from "vitest";
import type { AmbienceSound } from "@/lib/api/patient-types";
import {
  AMBIENCE_DEFAULT_VOLUME,
  AMBIENCE_MAX_VOLUME,
  capHowlVolume,
  clampVolume,
  defaultTimer,
  formatRemaining,
  howlVolume,
  msUntilBedtime,
  playableSounds,
  restoreVolume,
  soundSources,
  timerChoices,
  timerDurationMs,
} from "./ambiences";

const sound = (id: string, category: AmbienceSound["category"]): AmbienceSound => ({
  id, category, label: { en: id, ar: id }, url: `ambiances/${id}`, licence: "CC0", author: "a", source: "s", isDefault: false,
});

describe("playableSounds", () => {
  it("psychosis without activation: the server sends nothing, so nothing is shown", () => {
    expect(playableSounds("SCHIZOPHRENIA", [])).toEqual([]);
  });

  it("psychosis never gets coloured noise, even if one slips through", () => {
    const sounds = [sound("rain", "NATURE"), sound("white", "NOISE"), sound("lofi", "LOFI")];
    expect(playableSounds("SCHIZOPHRENIA", sounds).map((s) => s.id)).toEqual(["rain"]);
  });

  it("no track, no sounds", () => {
    expect(playableSounds("UNSPECIFIED", [sound("pink", "NOISE")])).toEqual([]);
  });

  it("ADHD keeps pink and white noise", () => {
    expect(playableSounds("ADHD", [sound("pink", "NOISE"), sound("white", "NOISE")]).map((s) => s.id)).toEqual(["pink", "white"]);
  });
});

describe("volume", () => {
  it("starts at 40 and never passes 70 %", () => {
    expect(AMBIENCE_DEFAULT_VOLUME).toBe(40);
    expect(AMBIENCE_MAX_VOLUME).toBe(70);
  });

  it.each([-50, -1, 0, 39.6, 70, 71, 100, 1000, Infinity, NaN])("howlVolume(%s) stays between 0 and 0.7", (percent) => {
    const volume = howlVolume(percent);
    expect(volume).toBeGreaterThanOrEqual(0);
    expect(volume).toBeLessThanOrEqual(0.7);
  });

  it("clampVolume rounds, caps and replaces junk by the default", () => {
    expect(clampVolume(39.6)).toBe(40);
    expect(clampVolume(95)).toBe(70);
    expect(clampVolume(-3)).toBe(0);
    expect(clampVolume(NaN)).toBe(40);
  });
});

describe("timers", () => {
  it("15, 25 and 45 minutes for everyone; 'until bedtime' only for bipolar with a bedtime set", () => {
    expect(timerChoices("ADHD", true)).toEqual([15, 25, 45]);
    expect(timerChoices("BIPOLAR", false)).toEqual([15, 25, 45]);
    expect(timerChoices("BIPOLAR", true)).toEqual([15, 25, 45, "bedtime"]);
    expect(timerChoices("SCHIZOPHRENIA", true)).toEqual([15, 25, 45]);
  });

  it("there is always an end: 25 minutes, or the bedtime on the evening track", () => {
    expect(defaultTimer("ADHD", false)).toBe(25);
    expect(defaultTimer("BIPOLAR", false)).toBe(25);
    expect(defaultTimer("BIPOLAR", true)).toBe("bedtime");
  });

  it("minute timers are in milliseconds", () => {
    expect(timerDurationMs(15, null)).toBe(15 * 60_000);
    expect(timerDurationMs(45, null)).toBe(45 * 60_000);
  });
});

describe("msUntilBedtime", () => {
  const at = (iso: string) => new Date(iso);

  it("counts to the next bedtime on the clock of the stored time zone", () => {
    expect(msUntilBedtime("22:30", "UTC", at("2026-11-01T21:30:00Z"))).toBe(3_600_000);
    // 21:30 UTC is 22:30 in Tunis (UTC+1, no clock change in November): bedtime 23:00 is 30 minutes away.
    expect(msUntilBedtime("23:00", "Africa/Tunis", at("2026-11-01T21:30:00Z"))).toBe(1_800_000);
  });

  it("after bedtime it is tomorrow's, and at the exact minute it is a full day", () => {
    expect(msUntilBedtime("22:30", "UTC", at("2026-11-01T23:00:00Z"))).toBe(23.5 * 3_600_000);
    expect(msUntilBedtime("22:30", "UTC", at("2026-11-01T22:30:00Z"))).toBe(24 * 3_600_000);
  });

  it("feeds the bedtime timer", () => {
    expect(timerDurationMs("bedtime", { time: "22:30", timeZone: "UTC" }, at("2026-11-01T21:30:00Z"))).toBe(3_600_000);
    expect(timerDurationMs("bedtime", null)).toBe(25 * 60_000);
  });
});

describe("formatRemaining", () => {
  it.each([
    [0, "0:00"],
    [59_000, "0:59"],
    [24 * 60_000 + 10_000, "24:10"],
    [45 * 60_000, "45:00"],
    [3_600_000 + 61_000, "1:01:01"],
    [-5, "0:00"],
  ])("%s ms is %s", (ms, text) => {
    expect(formatRemaining(ms)).toBe(text);
  });
});

describe("soundSources", () => {
  it("lists Opus first, then AAC, under the media origin", () => {
    expect(soundSources("ambiances/generated/noise-pink", "https://media.example.com/")).toEqual([
      "https://media.example.com/ambiances/generated/noise-pink.opus",
      "https://media.example.com/ambiances/generated/noise-pink.m4a",
    ]);
  });

  it("is empty without a media origin, so nothing is requested from a wrong place", () => {
    expect(soundSources("ambiances/x", "")).toEqual([]);
  });
});

describe("a restored volume is capped before it is applied", () => {
  it("injecting 1.0 (Howler's full scale) gives 0.70", () => {
    expect(capHowlVolume(1.0)).toBe(0.7);
    expect(capHowlVolume(0.95)).toBe(0.7);
    expect(capHowlVolume(0.7)).toBe(0.7);
    expect(capHowlVolume(0.4)).toBe(0.4);
  });

  it("injecting 100 % (a stored maximum, from the server or the device) gives 0.70 on Howler's scale", () => {
    expect(howlVolume(restoreVolume(100))).toBe(0.7);
    expect(howlVolume(restoreVolume("100"))).toBe(0.7);
    expect(howlVolume(restoreVolume(1000))).toBe(0.7);
  });

  it.each([null, undefined, "", "loud", {}, [], NaN, Infinity, -Infinity])("junk %j comes back as the default, never as a loud value", (junk) => {
    expect(restoreVolume(junk)).toBe(AMBIENCE_DEFAULT_VOLUME);
    expect(howlVolume(restoreVolume(junk))).toBe(0.4);
  });

  it("keeps a sensible stored value, as a whole percent", () => {
    expect(restoreVolume(55)).toBe(55);
    expect(restoreVolume("30")).toBe(30);
    expect(restoreVolume(-5)).toBe(0);
  });

  it("whatever is injected, Howler never gets more than 0.70", () => {
    for (const raw of [1.0, 100, 255, 1e9, "9999", Number.MAX_VALUE]) {
      expect(howlVolume(restoreVolume(raw))).toBeLessThanOrEqual(0.7);
      expect(capHowlVolume(Number(raw))).toBeLessThanOrEqual(0.7);
    }
  });
});
