import { describe, expect, it } from "vitest";
import { addDays, contactError, dailySeries, difficultyCounts, EMPTY_PLAN, emergencyState, isDialable, telLink } from "./observations";
import { clampRoom, DEFAULT_ROOM, kelvinToHex, moveItem, presetById, ROOM_LIMITS, ROOM_PRESETS, rotateItem, sceneLighting, toRoom } from "./room";
import { asBoolArray, readStored, writeStored, type StorageLike } from "./storage";
import type { CaregiverCheckin } from "./types";

const memory = (): StorageLike & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};

describe("room planner", () => {
  it("has five presets that each change the scene", () => {
    expect(ROOM_PRESETS.map((p) => p.id)).toEqual(["calm-corner", "organized-desk", "soft-lighting", "minimal-distraction", "balanced"]);
    for (const preset of ROOM_PRESETS) {
      const changed = JSON.stringify(preset.config) !== JSON.stringify(DEFAULT_ROOM);
      expect(changed, preset.id).toBe(true);
    }
    expect(presetById("minimal-distraction")!.config.decor).toBe(false);
    expect(presetById("minimal-distraction")!.config.items.calmCorner.visible).toBe(false);
  });

  it("keeps furniture inside the walls when the room shrinks or a piece moves", () => {
    const small = clampRoom({ ...DEFAULT_ROOM, width: 1, depth: 99 });
    expect(small.width).toBe(ROOM_LIMITS.minSize);
    expect(small.depth).toBe(ROOM_LIMITS.maxSize);
    const moved = moveItem(DEFAULT_ROOM, "bed", { x: 50 });
    expect(moved.items.bed.x).toBe(DEFAULT_ROOM.width / 2 - 0.5); // bed is 1 m wide
    const turned = rotateItem(DEFAULT_ROOM, "bed");
    expect(turned.items.bed.rotation).toBe(90);
    expect(rotateItem(rotateItem(rotateItem(turned, "bed"), "bed"), "bed").items.bed.rotation).toBe(0);
  });

  it("restores a saved room and falls back to the default for anything else", () => {
    const saved = toRoom(JSON.parse(JSON.stringify(presetById("calm-corner")!.config)));
    expect(saved).toEqual(presetById("calm-corner")!.config);
    expect(toRoom(null)).toEqual(DEFAULT_ROOM);
    expect(toRoom({ width: 3 })).toEqual(DEFAULT_ROOM);
  });

  it("simulates light colour and night mode", () => {
    expect(kelvinToHex(6600)).toBe("#ffffff");
    const warm = kelvinToHex(2700);
    expect(parseInt(warm.slice(1, 3), 16)).toBeGreaterThan(parseInt(warm.slice(5, 7), 16)); // more red than blue
    const night = sceneLighting({ mode: "night", intensity: 1.5, temperature: 6000, ceiling: true });
    expect(night.ceiling).toBe(0);
    expect(night.color).toBe(kelvinToHex(2400));
    expect(sceneLighting({ mode: "work", intensity: 1, temperature: 4000, ceiling: true }).lamp).toBeGreaterThan(sceneLighting({ mode: "soft", intensity: 1, temperature: 4000, ceiling: true }).lamp);
  });
});

describe("family journal", () => {
  const checkin = (date: string, sleepHours: number, difficulties: CaregiverCheckin["difficulties"] = []): CaregiverCheckin =>
    ({ id: date, date: `${date}T00:00:00.000Z`, mood: 3, energy: 3, focus: 3, sleepHours, sleepQuality: null, difficulties, medication: null, updatedAt: date });

  it("keeps a day without observation empty", () => {
    const series = dailySeries([checkin("2026-11-18", 7), checkin("2026-11-20", 9)], 3, "sleepHours", "2026-11-20");
    expect(series.map((p) => p.value)).toEqual([7, null, 9]);
    expect(series[2].label).toBe("11/20");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("counts reported difficulties", () => {
    const counts = difficultyCounts([checkin("2026-11-19", 7, ["focus", "sleep"]), checkin("2026-11-20", 7, ["focus"])]);
    expect(counts).toEqual([{ label: "focus", count: 2 }, { label: "sleep", count: 1 }]);
  });
});

describe("safety plan", () => {
  it("validates contacts", () => {
    expect(contactError({ name: "", phone: "999" })).toMatch(/name/);
    expect(contactError({ name: "Aunt", phone: "12" })).toMatch(/digits/);
    expect(contactError({ name: "Aunt", phone: "+971 50 123 4567" })).toBeNull();
    expect(isDialable("call me")).toBe(false);
    expect(telLink("+971 (50) 123-4567")).toBe("tel:+971501234567");
    expect(telLink("abc")).toBeNull();
  });

  it("tells the emergency panel what it can show", () => {
    expect(emergencyState(null)).toBe("empty");
    expect(emergencyState(EMPTY_PLAN)).toBe("empty");
    expect(emergencyState({ ...EMPTY_PLAN, contacts: [{ name: "A", relation: "", phone: "999", role: "trusted" }] })).toBe("no-emergency-number");
    expect(emergencyState({ ...EMPTY_PLAN, emergencyNumber: "999" })).toBe("ready");
  });
});

describe("exercise storage", () => {
  it("round-trips and rejects corrupted values", () => {
    const store = memory();
    expect(writeStored("k", [true, false], store)).toBe(true);
    expect(readStored("k", asBoolArray, [], store)).toEqual([true, false]);
    store.data.set("k", "{not json");
    expect(readStored("k", asBoolArray, [], store)).toEqual([]);
    expect(readStored("k", asBoolArray, [], null)).toEqual([]);
  });
});
