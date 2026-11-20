import type { LightMode, RoomConfig, RoomItem, RoomItemKey, RoomPreset, RoomPresetId, Rotation, WallTone } from "./types";
import { ROOM_ITEMS } from "./types";

/** Same limits the API enforces (synq_backend parent-pack.util ROOM_LIMITS). */
export const ROOM_LIMITS = { minSize: 2.5, maxSize: 6, minIntensity: 0.1, maxIntensity: 1.5, minKelvin: 2200, maxKelvin: 6500 } as const;

// Declared first: the presets below are built at import time.
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round((Number.isFinite(n) ? n : 0) * 100) / 100));

/** Footprint of each piece in metres (width along x, depth along z before rotation). Geometric primitives, no external model. */
export const FOOTPRINT: Record<RoomItemKey, { w: number; d: number; h: number }> = {
  bed: { w: 1, d: 2, h: 0.5 },
  desk: { w: 1.2, d: 0.6, h: 0.75 },
  calmCorner: { w: 1, d: 1, h: 0.35 },
  storage: { w: 0.9, d: 0.4, h: 1.2 },
  lamp: { w: 0.3, d: 0.3, h: 1.5 },
};

export const WALL_COLORS: Record<WallTone, string> = { calm: "#dcebea", neutral: "#efece6", warm: "#f3e6d3" };

const item = (x: number, z: number, rotation: Rotation = 0, visible = true): RoomItem => ({ x, z, rotation, visible });

export const DEFAULT_ROOM: RoomConfig = {
  width: 3.6,
  depth: 3.4,
  wallTone: "neutral",
  decor: true,
  items: { bed: item(-1.1, -0.6), desk: item(1.1, -1.35), calmCorner: item(1.1, 1.1), storage: item(-1.3, 1.45), lamp: item(0.2, -1.4) },
  light: { mode: "soft", intensity: 0.8, temperature: 3200, ceiling: true },
};

const preset = (id: RoomPresetId, name: string, description: string, patch: (room: RoomConfig) => RoomConfig): RoomPreset =>
  ({ id, name, description, config: clampRoom(patch(structuredClone(DEFAULT_ROOM))) });

export const ROOM_PRESETS: RoomPreset[] = [
  preset("calm-corner", "Calm corner", "A soft, low corner with cushions, away from the desk and the door.", (r) => ({
    ...r, wallTone: "calm", items: { ...r.items, calmCorner: item(-1.15, 1.15, 0), lamp: item(-0.35, 1.4) }, light: { mode: "soft", intensity: 0.6, temperature: 2700, ceiling: false },
  })),
  preset("organized-desk", "Organized desk", "Desk facing a plain wall, storage within reach, bright work light.", (r) => ({
    ...r, decor: false, items: { ...r.items, desk: item(0.9, -1.4, 0), storage: item(1.55, -0.4, 90), lamp: item(0.25, -1.45) }, light: { mode: "work", intensity: 1.2, temperature: 4500, ceiling: true },
  })),
  preset("soft-lighting", "Soft lighting", "Warm, dim light for the evening wind-down.", (r) => ({
    ...r, wallTone: "warm", light: { mode: "soft", intensity: 0.45, temperature: 2400, ceiling: false },
  })),
  preset("minimal-distraction", "Minimal distraction", "Neutral walls, no decor, everything put away.", (r) => ({
    ...r, wallTone: "neutral", decor: false, items: { ...r.items, calmCorner: { ...r.items.calmCorner, visible: false } }, light: { mode: "work", intensity: 0.9, temperature: 4000, ceiling: true },
  })),
  preset("balanced", "Balanced bedroom", "A bit of everything: a quiet corner, a tidy desk and gentle light.", (r) => ({
    ...r, wallTone: "calm", decor: true, light: { mode: "soft", intensity: 0.8, temperature: 3200, ceiling: true },
  })),
];

export const presetById = (id: RoomPresetId) => ROOM_PRESETS.find((p) => p.id === id);

/** Half the extent of a piece along x and z once rotated, so a piece never pokes through a wall. */
export function halfExtent(key: RoomItemKey, rotation: Rotation) {
  const { w, d } = FOOTPRINT[key];
  const turned = rotation === 90 || rotation === 270;
  return { x: (turned ? d : w) / 2, z: (turned ? w : d) / 2 };
}

/** Keep every piece inside the walls and every value within the limits. The API applies the same limits. */
export function clampRoom(room: RoomConfig): RoomConfig {
  const width = clamp(room.width, ROOM_LIMITS.minSize, ROOM_LIMITS.maxSize);
  const depth = clamp(room.depth, ROOM_LIMITS.minSize, ROOM_LIMITS.maxSize);
  const items = Object.fromEntries(ROOM_ITEMS.map((key) => {
    const current = room.items[key] ?? DEFAULT_ROOM.items[key];
    const half = halfExtent(key, current.rotation);
    return [key, { ...current, x: clamp(current.x, -width / 2 + half.x, width / 2 - half.x), z: clamp(current.z, -depth / 2 + half.z, depth / 2 - half.z) }];
  })) as Record<RoomItemKey, RoomItem>;
  return {
    ...room,
    width,
    depth,
    items,
    light: {
      ...room.light,
      intensity: clamp(room.light.intensity, ROOM_LIMITS.minIntensity, ROOM_LIMITS.maxIntensity),
      temperature: Math.round(clamp(room.light.temperature, ROOM_LIMITS.minKelvin, ROOM_LIMITS.maxKelvin)),
    },
  };
}

export const moveItem = (room: RoomConfig, key: RoomItemKey, patch: Partial<RoomItem>) => clampRoom({ ...room, items: { ...room.items, [key]: { ...room.items[key], ...patch } } });

export const rotateItem = (room: RoomConfig, key: RoomItemKey) =>
  moveItem(room, key, { rotation: (((room.items[key].rotation + 90) % 360) as Rotation) });

/** A saved room from the server, or anything else, as a usable room (unknown shapes fall back to the default). */
export function toRoom(value: unknown): RoomConfig {
  if (!value || typeof value !== "object" || !("items" in value) || !("light" in value)) return DEFAULT_ROOM;
  const room = value as RoomConfig;
  return clampRoom({ ...DEFAULT_ROOM, ...room, items: { ...DEFAULT_ROOM.items, ...room.items }, light: { ...DEFAULT_ROOM.light, ...room.light } });
}

/**
 * Approximate RGB of a black body at `kelvin` (Tanner Helland's fit), as a hex colour. Simulation only: a screen cannot
 * reproduce a real bulb.
 */
export function kelvinToHex(kelvin: number): string {
  const t = clamp(kelvin, 1000, 40000) / 100;
  const r = t <= 66 ? 255 : 329.698727446 * (t - 60) ** -0.1332047592;
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * (t - 60) ** -0.0755148492;
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const hex = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/** What the scene's lights do for a configuration: night mode dims and warms whatever the sliders say. */
export function sceneLighting(light: RoomConfig["light"]) {
  const night = light.mode === "night";
  const kelvin = night ? Math.min(light.temperature, 2400) : light.temperature;
  const intensity = night ? Math.min(light.intensity, 0.25) : light.intensity;
  const ambientByMode: Record<LightMode, number> = { soft: 0.7, work: 0.9, night: 0.14 };
  return {
    color: kelvinToHex(kelvin),
    ambient: ambientByMode[light.mode] * Math.max(0.4, intensity),
    ceiling: light.ceiling && !night ? intensity * 1.4 : 0,
    lamp: (light.mode === "work" ? 1.4 : 0.9) * intensity * 3,
  };
}

export const ITEM_LABELS: Record<RoomItemKey, string> = { bed: "Bed", desk: "Desk", calmCorner: "Calm corner", storage: "Storage", lamp: "Lamp" };
