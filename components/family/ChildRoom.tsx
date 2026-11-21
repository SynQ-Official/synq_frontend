"use client";

import dynamic from "next/dynamic";
import { Component, useState, useSyncExternalStore, type ReactNode } from "react";
import { ArrowRight, BedDouble, Check, Eye, EyeOff, LayoutGrid, Lightbulb, Rotate3d, RotateCw, Ruler, Save, Sofa, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { familyApi } from "@/lib/family/api";
import { clampRoom, DEFAULT_ROOM, FOOTPRINT, halfExtent, kelvinToHex, moveItem, ROOM_LIMITS, ROOM_PRESETS, rotateItem, toRoom, WALL_COLORS } from "@/lib/parent-pack/room";
import { ROOM_ITEMS, type LightMode, type RoomConfig, type RoomItemKey, type RoomPresetId, type WallTone } from "@/lib/parent-pack/types";
import { cn } from "@/lib/utils";
import { Card, LoadError, Notice, useFamilyCopy, useLoad } from "./FamilyShell";

const RoomScene = dynamic(() => import("@/components/parent-pack/RoomScene"), { ssr: false, loading: () => <div className="size-full animate-pulse bg-teal-50/40" /> });

let webglSupport: boolean | undefined;
function hasWebGL(): boolean {
  if (webglSupport === undefined) {
    try {
      const canvas = document.createElement("canvas");
      webglSupport = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}
const noSubscription = () => () => undefined;
/** null on the server and during hydration, then the browser's answer (it never changes). */
const useWebGL = () => useSyncExternalStore(noSubscription, hasWebGL, () => null);

/** If the 3D scene fails (no GPU, a driver error), the plan view takes over instead of a blank area. */
class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

type Saved = Awaited<ReturnType<typeof familyApi.room>>["data"];
type Note = { tone: "ok" | "error"; text: string } | null;

/**
 * The child's room planner (a browser simulation, saved per family link through `/parent/children/:childId/room`).
 * Everything the clinician has not allowed is refused by the API (`canViewResources`); the API also clamps every saved value.
 */
export function ChildRoom({ childId }: { childId: string }) {
  const { t } = useFamilyCopy();
  const saved = useLoad(() => familyApi.room(childId).then((r) => r.data), [childId]);
  if (saved.error) return <LoadError error={saved.error} retry={saved.reload} />;
  if (saved.loading) return <div className="lm-glass h-[38rem] animate-pulse" aria-busy aria-label={t.loading} />;
  // Restarts from the default after a reset; a save keeps the editor (and the 3D scene) as it is.
  return <RoomEditor key={saved.data ? "saved" : "default"} childId={childId} saved={saved.data ?? null} onSaved={saved.setData} />;
}

function RoomEditor({ childId, saved, onSaved }: { childId: string; saved: Saved; onSaved: (room: Saved) => void }) {
  const { t } = useFamilyCopy();
  const copy = t.room;
  const baseline = saved ? toRoom(saved.config) : DEFAULT_ROOM;
  const [room, setRoom] = useState<RoomConfig>(baseline);
  const [presetId, setPresetId] = useState<RoomPresetId | null>(saved?.presetId ?? null);
  const [selected, setSelected] = useState<RoomItemKey | null>("desk");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const webgl = useWebGL();
  const [view, setView] = useState<"3d" | "plan">("3d");

  const dirty = JSON.stringify(room) !== JSON.stringify(baseline);
  const update = (next: RoomConfig) => { setRoom(next); setPresetId(null); };

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await familyApi.saveRoom(childId, room, presetId);
      onSaved(data);
      setNote({ tone: "ok", text: copy.saved });
    } catch {
      setNote({ tone: "error", text: copy.saveError });
    } finally {
      setSaving(false);
    }
  };
  const reset = async () => {
    try {
      await familyApi.resetRoom(childId);
      onSaved(null);
      setRoom(DEFAULT_ROOM);
      setPresetId(null);
      setNote({ tone: "ok", text: copy.resetDone });
    } catch {
      setNote({ tone: "error", text: copy.resetError });
    }
  };

  const plan = <RoomPlan2D room={room} selected={selected} onSelect={setSelected} />;
  const status = presetId ? copy.preset[presetId].name : dirty ? copy.custom : saved ? copy.savedLayout : copy.starting;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl  tracking-[-0.01em]">{copy.title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-muted">{copy.lead}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => setRoom(baseline)} disabled={!dirty}><Undo2 aria-hidden className="rtl:-scale-x-100" />{copy.restore}</Button>
          <Button variant="outline" onClick={() => void reset()}><X aria-hidden />{copy.reset}</Button>
          <Button onClick={() => void save()} disabled={saving || (!dirty && !!saved)} aria-busy={saving}><Save aria-hidden />{saving ? copy.saving : copy.save}</Button>
        </div>
      </div>
      {note && <Notice kind={note.tone}>{note.text}</Notice>}

      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <Card className="flex min-w-0 flex-col overflow-hidden p-0 sm:p-0">
          <div className="relative h-[min(70vh,38rem)] min-h-80 w-full bg-gradient-to-b from-teal-50/80 via-white/60 to-sage-50/70">
            {webgl === null ? <div className="size-full animate-pulse bg-canvas" /> : webgl && view === "3d" ? (
              <SceneBoundary fallback={plan}>
                <RoomScene config={room} selected={selected} onSelect={setSelected} />
              </SceneBoundary>
            ) : plan}
            {/* Overlays: the layout's state at the start, the view switch at the end. */}
            <p className="pointer-events-none absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-xs font-medium text-ink-soft shadow-sm ring-1 ring-line backdrop-blur">
              <span aria-hidden className={cn("size-1.5 rounded-full", dirty ? "bg-gold-600" : "bg-sage-700")} />{status}
            </p>
            {webgl && (
              <div role="group" aria-label={copy.view} className="absolute end-3 top-3 flex gap-1 rounded-full bg-white/85 p-1 shadow-sm ring-1 ring-line backdrop-blur">
                <Button size="sm" variant={view === "3d" ? "default" : "ghost"} aria-pressed={view === "3d"} onClick={() => setView("3d")}><Rotate3d aria-hidden />{copy.view3d}</Button>
                <Button size="sm" variant={view === "plan" ? "default" : "ghost"} aria-pressed={view === "plan"} onClick={() => setView("plan")}><LayoutGrid aria-hidden />{copy.plan}</Button>
              </div>
            )}
            {webgl === false && <p className="absolute inset-x-3 bottom-3 rounded-xl bg-white/90 px-3 py-2 text-xs text-ink-muted">{copy.noWebgl}</p>}
          </div>
          <RoomStats room={room} className="border-t border-line/70" />
        </Card>

        <RoomControls room={room} selected={selected} onSelect={setSelected} onChange={update} />
      </div>

      <section aria-label={copy.presets}>
        <h3 className="mb-2.5 text-sm ">{copy.presets}</h3>
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-5">
          {ROOM_PRESETS.map((p) => (
            <button key={p.id} type="button" aria-pressed={presetId === p.id} onClick={() => { setRoom(p.config); setPresetId(p.id); }}
              className={cn("lm-inset relative flex w-60 shrink-0 snap-start flex-col justify-start px-4 py-3.5 text-start sm:w-auto",
                presetId === p.id && "border-teal-600 bg-white shadow-[0_14px_28px_-20px_rgb(36_107_112/0.45)]")}>
              <span className="flex items-center gap-2">
                <span aria-hidden className="size-3 shrink-0 rounded-full ring-1 ring-black/5" style={{ background: kelvinToHex(p.config.light.temperature) }} />
                <span className="text-sm ">{copy.preset[p.id].name}</span>
                {presetId === p.id && <Check aria-hidden className="ms-auto size-4 text-teal-700" />}
              </span>
              <span className="mt-1 block text-xs leading-snug text-ink-muted">{copy.preset[p.id].description}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

/** Size, light and pieces of a room, read at a glance (the editor's footer and the dashboard card). */
function RoomStats({ room, className }: { room: RoomConfig; className?: string }) {
  const { t } = useFamilyCopy();
  const shown = ROOM_ITEMS.filter((k) => room.items[k].visible).length;
  const stats = [
    { icon: Ruler, label: t.overview.room.size, value: <span dir="ltr">{room.width} × {room.depth} m</span> },
    { icon: Lightbulb, label: t.overview.room.light, value: <span className="inline-flex flex-wrap items-center gap-x-1.5">
      <span aria-hidden className="size-2.5 rounded-full ring-1 ring-black/5" style={{ background: kelvinToHex(room.light.temperature) }} />
      {t.room.light[room.light.mode]} <span dir="ltr" className="font-medium text-ink-muted">{room.light.temperature} K</span></span> },
    { icon: Sofa, label: t.overview.room.pieces, value: <span dir="ltr">{shown} / {ROOM_ITEMS.length}</span> },
  ];
  return (
    <dl className={cn("grid grid-cols-3 divide-x divide-line/70 rtl:divide-x-reverse", className)}>
      {stats.map(({ icon: Icon, label, value }) => (
        <div key={label} className="min-w-0 px-3 py-3 sm:px-5">
          <dt className="flex items-center gap-1.5 text-xs leading-tight text-ink-muted"><Icon aria-hidden className="size-3.5 shrink-0" /><span>{label}</span></dt>
          <dd className="mt-1 text-sm  leading-snug tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The room on the child's dashboard: the saved layout (or the starting one), live in 3D and turning slowly, with its
 * numbers and the way into the planner. Read-only: arranging happens in the Room tab.
 */
export function RoomPreviewCard({ childId, onOpen, className }: { childId: string; onOpen: () => void; className?: string }) {
  const { t } = useFamilyCopy();
  const copy = t.overview.room;
  return (
    <Card className={cn("flex min-w-0 flex-col overflow-hidden p-0 sm:p-0", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base "><BedDouble aria-hidden className="size-[1.1rem] text-teal-700" />{copy.title}</h2>
          <p className="mt-1 text-sm text-ink-muted">{copy.lead}</p>
        </div>
        <Button onClick={onOpen}>{copy.open}<ArrowRight aria-hidden className="rtl:-scale-x-100" /></Button>
      </div>
      <RoomLive childId={childId} onOpen={onOpen} className="min-h-72 flex-1" />
    </Card>
  );
}

/** The saved room (or the starting one) live in 3D, turning slowly, with its numbers underneath. Shared by the dashboards. */
export function RoomLive({ childId, onOpen, className }: { childId: string; onOpen: () => void; className?: string }) {
  const { t } = useFamilyCopy();
  const saved = useLoad(() => familyApi.room(childId).then((r) => r.data), [childId]);
  const webgl = useWebGL();
  const room = saved.data ? toRoom(saved.data.config) : DEFAULT_ROOM;
  const plan = <RoomPlan2D room={room} selected={null} onSelect={onOpen} />;
  const status = saved.data?.presetId ? t.room.preset[saved.data.presetId].name : saved.data ? t.room.savedLayout : t.overview.room.notSaved;
  // Refused (permission withdrawn) or unreachable: the card simply has no room to show.
  if (saved.error) return null;
  return (
    <>
      <div className={cn("relative bg-gradient-to-b from-teal-50/70 via-white/50 to-sage-50/70", className)}>
        <div className="absolute inset-0">
          {saved.loading || webgl === null ? <div className="size-full animate-pulse bg-teal-50/40" aria-busy aria-label={t.loading} />
            : webgl ? <SceneBoundary fallback={plan}><RoomScene config={room} preview /></SceneBoundary> : plan}
        </div>
        <p className="pointer-events-none absolute start-3 top-3 rounded-full bg-white/85 px-3 py-1.5 text-xs font-medium text-ink-soft shadow-sm ring-1 ring-line backdrop-blur">{status}</p>
      </div>
      <RoomStats room={room} className="border-t border-line/70" />
    </>
  );
}

function Range({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  return (
    <label className="block">
      <span className="flex justify-between text-xs font-medium text-ink-soft"><span>{label}</span><span dir="ltr" className="tabular-nums text-ink-muted">{format ? format(value) : value}</span></span>
      <input type="range" dir="ltr" className="mt-1.5 w-full accent-teal-600" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-ink-soft">{label}</p>
      <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-full bg-canvas p-1">
        {options.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={value === o.id} onClick={() => onChange(o.id)}
            className={cn("rounded-full px-2 py-1.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-teal-500", value === o.id ? "bg-white text-teal-800 shadow-sm" : "text-ink-muted")}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

function RoomControls({ room, selected, onSelect, onChange }: { room: RoomConfig; selected: RoomItemKey | null; onSelect: (k: RoomItemKey) => void; onChange: (r: RoomConfig) => void }) {
  const { t } = useFamilyCopy();
  const copy = t.room;
  const item = selected ? room.items[selected] : null;
  const half = selected ? halfExtent(selected, room.items[selected].rotation) : null;
  const m = (v: number) => `${v.toFixed(2)} m`;
  const walls = (["calm", "neutral", "warm"] as const).map((id) => ({ id, label: copy.wall[id] }));
  const modes = (["soft", "work", "night"] as const).map((id) => ({ id, label: copy.light[id] }));
  const tab = "flex-1 gap-1.5 rounded-full px-3 py-2 text-xs  text-ink-muted data-[state=active]:bg-white data-[state=active]:text-teal-800 data-[state=active]:shadow-sm [&_svg]:size-3.5";
  return (
    <Card className="min-w-0 p-4 sm:p-5">
      <Tabs defaultValue="furniture">
        <TabsList className="flex h-auto w-full rounded-full bg-teal-50/80 p-1 ring-1 ring-teal-100/70">
          <TabsTrigger value="room" className={tab}><Ruler aria-hidden />{copy.room}</TabsTrigger>
          <TabsTrigger value="furniture" className={tab}><Sofa aria-hidden />{copy.furniture}</TabsTrigger>
          <TabsTrigger value="light" className={tab}><Lightbulb aria-hidden />{t.overview.room.light}</TabsTrigger>
        </TabsList>
      <TabsContent value="room" className="mt-5 space-y-5">
        <Range label={copy.width} value={room.width} min={ROOM_LIMITS.minSize} max={ROOM_LIMITS.maxSize} step={0.1} format={m} onChange={(width) => onChange(clampRoom({ ...room, width }))} />
        <Range label={copy.depth} value={room.depth} min={ROOM_LIMITS.minSize} max={ROOM_LIMITS.maxSize} step={0.1} format={m} onChange={(depth) => onChange(clampRoom({ ...room, depth }))} />
        <Segmented<WallTone> label={copy.walls} value={room.wallTone} options={walls} onChange={(wallTone) => onChange({ ...room, wallTone })} />
        <label className="flex items-center justify-between text-sm">{copy.decor}
          <input type="checkbox" className="size-4 accent-teal-600" checked={room.decor} onChange={(e) => onChange({ ...room, decor: e.target.checked })} />
        </label>
      </TabsContent>

      <TabsContent value="furniture" className="mt-5 space-y-5">
        <div role="radiogroup" aria-label={copy.pieceToArrange} className="flex flex-wrap gap-1.5">
          {ROOM_ITEMS.map((k) => (
            <Button key={k} size="sm" role="radio" aria-checked={selected === k} variant={selected === k ? "default" : "outline"} onClick={() => onSelect(k)}>{copy.item[k]}</Button>
          ))}
        </div>
        {selected && item && half ? (
          <>
            <Range label={copy.leftRight} value={item.x} min={-room.width / 2 + half.x} max={room.width / 2 - half.x} step={0.05} format={m} onChange={(x) => onChange(moveItem(room, selected, { x }))} />
            <Range label={copy.backFront} value={item.z} min={-room.depth / 2 + half.z} max={room.depth / 2 - half.z} step={0.05} format={m} onChange={(z) => onChange(moveItem(room, selected, { z }))} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => onChange(rotateItem(room, selected))}><RotateCw aria-hidden />{copy.rotate(item.rotation)}</Button>
              <Button size="sm" variant="ghost" onClick={() => onChange(moveItem(room, selected, { visible: !item.visible }))} aria-pressed={!item.visible}>
                {item.visible ? <><EyeOff aria-hidden />{copy.hide}</> : <><Eye aria-hidden />{copy.show}</>}
              </Button>
            </div>
          </>
        ) : <p className="text-xs text-ink-muted">{copy.selectPiece}</p>}
      </TabsContent>

      <TabsContent value="light" className="mt-5 space-y-5">
        <p className="text-xs text-ink-muted">{copy.lighting}</p>
        <Segmented<LightMode> label={copy.mode} value={room.light.mode} options={modes} onChange={(mode) => onChange({ ...room, light: { ...room.light, mode } })} />
        <Range label={copy.intensity} value={room.light.intensity} min={ROOM_LIMITS.minIntensity} max={ROOM_LIMITS.maxIntensity} step={0.05} format={(v) => `${Math.round(v * 100)} %`} onChange={(intensity) => onChange({ ...room, light: { ...room.light, intensity } })} />
        <Range label={copy.temperature} value={room.light.temperature} min={ROOM_LIMITS.minKelvin} max={ROOM_LIMITS.maxKelvin} step={100} format={(v) => `${v} K`} onChange={(temperature) => onChange({ ...room, light: { ...room.light, temperature } })} />
        <div aria-hidden className="h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${kelvinToHex(ROOM_LIMITS.minKelvin)}, ${kelvinToHex(4300)}, ${kelvinToHex(ROOM_LIMITS.maxKelvin)})` }} />
        <label className="flex items-center justify-between text-sm">{copy.ceiling}
          <input type="checkbox" className="size-4 accent-teal-600" checked={room.light.ceiling} onChange={(e) => onChange({ ...room, light: { ...room.light, ceiling: e.target.checked } })} />
        </label>
        <p className="text-xs text-ink-muted">{copy.lampHint}</p>
      </TabsContent>
      </Tabs>
    </Card>
  );
}

/** Top-down plan: the fallback without WebGL, and a precise alternative view. Same data as the 3D scene. */
function RoomPlan2D({ room, selected, onSelect }: { room: RoomConfig; selected: RoomItemKey | null; onSelect: (k: RoomItemKey) => void }) {
  const { t } = useFamilyCopy();
  const pad = 0.3;
  const fill: Record<RoomItemKey, string> = { bed: "#d6cbbd", desk: "#c9b08f", calmCorner: "#a3cdd1", storage: "#efe9df", lamp: kelvinToHex(room.light.temperature) };
  return (
    <svg viewBox={`${-room.width / 2 - pad} ${-room.depth / 2 - pad} ${room.width + pad * 2} ${room.depth + pad * 2}`} className="size-full" role="group" aria-label={t.room.planLabel}>
      <rect x={-room.width / 2} y={-room.depth / 2} width={room.width} height={room.depth} fill="#e8dccb" stroke={WALL_COLORS[room.wallTone]} strokeWidth={0.08} />
      {ROOM_ITEMS.filter((k) => room.items[k].visible).map((k) => {
        const it = room.items[k];
        const { w, d } = FOOTPRINT[k];
        return (
          <g key={k} transform={`translate(${it.x} ${it.z}) rotate(${it.rotation})`} onClick={() => onSelect(k)} className="cursor-pointer" role="button" tabIndex={0} aria-label={t.room.item[k]} aria-pressed={selected === k}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(k)}>
            {k === "calmCorner" || k === "lamp" ? <circle r={w / 2} fill={fill[k]} stroke={selected === k ? "#2b7080" : "#7c929b"} strokeWidth={selected === k ? 0.05 : 0.02} />
              : <rect x={-w / 2} y={-d / 2} width={w} height={d} rx={0.04} fill={fill[k]} stroke={selected === k ? "#2b7080" : "#7c929b"} strokeWidth={selected === k ? 0.05 : 0.02} />}
            <text y={0.05} textAnchor="middle" fontSize={0.13} fill="#114c61">{t.room.item[k]}</text>
          </g>
        );
      })}
    </svg>
  );
}
