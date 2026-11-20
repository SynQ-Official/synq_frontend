"use client";

import { useMemo, type ReactNode } from "react";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import { FOOTPRINT, sceneLighting, WALL_COLORS } from "@/lib/parent-pack/room";
import type { RoomConfig, RoomItemKey } from "@/lib/parent-pack/types";

const WALL_H = 2.6;
const WALL_T = 0.06;

/**
 * The bedroom, drawn from three.js primitives only (no downloaded model, so nothing to license or fail to load). Units are
 * metres; the floor is centred on the origin. Clicking a piece selects it for the controls.
 */
export default function RoomScene({ config, selected = null, onSelect = () => undefined, onReady, preview = false }: {
  config: RoomConfig;
  selected?: RoomItemKey | null;
  onSelect?: (key: RoomItemKey | null) => void;
  onReady?: () => void;
  /** Dashboard view: turns slowly on its own (never under reduced motion); no drag, zoom or pan, so touch still scrolls the page. */
  preview?: boolean;
}) {
  const light = sceneLighting(config.light);
  const { width: w, depth: d } = config;
  const wall = WALL_COLORS[config.wallTone];
  const lamp = config.items.lamp;
  const camera = useMemo(() => ({ position: [w * 0.3, 3.2, d * 1.45] as [number, number, number], fov: 45 }), [w, d]);
  const still = useReducedMotion();

  // Transparent canvas: the surface behind it (stage or card) gives the backdrop.
  return (
    <Canvas shadows="percentage" dpr={[1, 1.75]} camera={camera} onCreated={() => onReady?.()} onPointerMissed={() => onSelect(null)} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}>
      <hemisphereLight args={["#ffffff", "#c9d6d4", light.ambient]} />
      <ambientLight intensity={light.ambient * 0.6} color={light.color} />
      {light.ceiling > 0 && <pointLight position={[0, WALL_H - 0.15, 0]} intensity={light.ceiling * 6} distance={9} decay={1.6} color={light.color} castShadow />}

      {/* floor and three walls (the fourth is left open for the camera) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#d9c9b2" roughness={0.9} />
      </mesh>
      <mesh position={[0, WALL_H / 2, -d / 2]} receiveShadow><boxGeometry args={[w, WALL_H, WALL_T]} /><meshStandardMaterial color={wall} /></mesh>
      <mesh position={[-w / 2, WALL_H / 2, 0]} receiveShadow><boxGeometry args={[WALL_T, WALL_H, d]} /><meshStandardMaterial color={wall} /></mesh>
      <mesh position={[w / 2, WALL_H / 2, 0]} receiveShadow><boxGeometry args={[WALL_T, WALL_H, d]} /><meshStandardMaterial color={wall} /></mesh>
      {/* window on the back wall, door on the right wall */}
      <mesh position={[-w / 4, 1.5, -d / 2 + WALL_T]}><planeGeometry args={[1, 1.1]} /><meshStandardMaterial color="#cfe6f2" emissive="#cfe6f2" emissiveIntensity={config.light.mode === "night" ? 0.05 : 0.35} /></mesh>
      <mesh position={[w / 2 - WALL_T, 1, d / 4]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[0.85, 2]} /><meshStandardMaterial color="#a88d6d" /></mesh>

      <Piece k="bed" config={config} selected={selected} onSelect={onSelect}>
        <mesh position={[0, 0.15, 0]} castShadow><boxGeometry args={[1, 0.3, 2]} /><meshStandardMaterial color="#8c7a66" /></mesh>
        <mesh position={[0, 0.38, 0.05]} castShadow><boxGeometry args={[0.94, 0.16, 1.85]} /><meshStandardMaterial color="#f4f1ea" /></mesh>
        <mesh position={[0, 0.5, -0.75]} castShadow><boxGeometry args={[0.7, 0.1, 0.3]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh position={[0, 0.47, 0.35]}><boxGeometry args={[0.96, 0.04, 1]} /><meshStandardMaterial color="#86babc" /></mesh>
      </Piece>

      <Piece k="desk" config={config} selected={selected} onSelect={onSelect}>
        <mesh position={[0, 0.74, 0]} castShadow><boxGeometry args={[1.2, 0.04, 0.6]} /><meshStandardMaterial color="#c9b08f" /></mesh>
        {[[-0.55, -0.25], [0.55, -0.25], [-0.55, 0.25], [0.55, 0.25]].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x, 0.36, z]} castShadow><boxGeometry args={[0.04, 0.72, 0.04]} /><meshStandardMaterial color="#7d6a55" /></mesh>
        ))}
        <mesh position={[0, 0.45, 0.55]} castShadow><boxGeometry args={[0.42, 0.06, 0.42]} /><meshStandardMaterial color="#5b9091" /></mesh>
      </Piece>

      <Piece k="calmCorner" config={config} selected={selected} onSelect={onSelect}>
        <mesh position={[0, 0.01, 0]} receiveShadow><cylinderGeometry args={[0.5, 0.5, 0.02, 40]} /><meshStandardMaterial color="#dcebea" /></mesh>
        <mesh position={[-0.15, 0.2, -0.1]} castShadow scale={[1, 0.6, 1]}><sphereGeometry args={[0.3, 24, 16]} /><meshStandardMaterial color="#a3cdd1" roughness={1} /></mesh>
        <mesh position={[0.25, 0.12, 0.2]} castShadow scale={[1, 0.5, 1]}><sphereGeometry args={[0.2, 24, 16]} /><meshStandardMaterial color="#e6d5aa" roughness={1} /></mesh>
      </Piece>

      <Piece k="storage" config={config} selected={selected} onSelect={onSelect}>
        <mesh position={[0, 0.6, 0]} castShadow><boxGeometry args={[0.9, 1.2, 0.4]} /><meshStandardMaterial color="#efe9df" /></mesh>
        {[0.3, 0.6, 0.9].map((y) => <mesh key={y} position={[0, y, 0.205]}><boxGeometry args={[0.84, 0.02, 0.01]} /><meshStandardMaterial color="#cbdadc" /></mesh>)}
      </Piece>

      <Piece k="lamp" config={config} selected={selected} onSelect={onSelect}>
        <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.14, 0.14, 0.04, 24]} /><meshStandardMaterial color="#5a7480" /></mesh>
        <mesh position={[0, 0.72, 0]}><cylinderGeometry args={[0.015, 0.015, 1.4, 8]} /><meshStandardMaterial color="#5a7480" /></mesh>
        <mesh position={[0, 1.45, 0]}><coneGeometry args={[0.16, 0.2, 24, 1, true]} /><meshStandardMaterial color={light.color} emissive={light.color} emissiveIntensity={lamp.visible ? 0.6 : 0} side={2} /></mesh>
      </Piece>
      {lamp.visible && <pointLight position={[lamp.x, 1.4, lamp.z]} intensity={light.lamp} distance={5} decay={1.8} color={light.color} castShadow />}

      {config.decor && <Decor w={w} d={d} />}

      <ContactShadows position={[0, 0.005, 0]} opacity={0.35} scale={Math.max(w, d) * 1.4} blur={2.4} far={2.5} />
      <OrbitControls makeDefault target={[0, 0.6, 0]} enablePan={!preview} enableZoom={!preview} enableRotate={!preview} autoRotate={preview && !still} autoRotateSpeed={0.6} minDistance={2} maxDistance={10} maxPolarAngle={Math.PI / 2.15} />
    </Canvas>
  );
}

function Piece({ k, config, selected, onSelect, children }: { k: RoomItemKey; config: RoomConfig; selected: RoomItemKey | null; onSelect: (key: RoomItemKey) => void; children: ReactNode }) {
  const item = config.items[k];
  if (!item.visible) return null;
  const { w, d } = FOOTPRINT[k];
  const pick = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onSelect(k);
  };
  return (
    <group position={[item.x, 0, item.z]} rotation={[0, (-item.rotation * Math.PI) / 180, 0]} onPointerDown={pick}>
      {children}
      {selected === k && (
        <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w + 0.12, d + 0.12]} />
          <meshBasicMaterial color="#2b7080" transparent opacity={0.22} />
        </mesh>
      )}
    </group>
  );
}

/** Posters, a shelf and toys: the visual clutter "minimal distraction" removes. */
function Decor({ w, d }: { w: number; d: number }) {
  const colors = ["#e07a5f", "#f2cc8f", "#81b29a", "#3d405b", "#e5989b"];
  return (
    <group>
      <mesh position={[w / 4, 1.6, -d / 2 + 0.04]}><planeGeometry args={[0.6, 0.8]} /><meshStandardMaterial color={colors[0]} /></mesh>
      <mesh position={[w / 4 + 0.6, 1.75, -d / 2 + 0.04]}><planeGeometry args={[0.4, 0.5]} /><meshStandardMaterial color={colors[3]} /></mesh>
      <mesh position={[-w / 2 + 0.04, 1.6, -d / 6]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[0.7, 0.5]} /><meshStandardMaterial color={colors[2]} /></mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[-0.3 + i * 0.18, 0.08, d / 2 - 0.5 - (i % 2) * 0.2]} rotation={[0, i, 0]} castShadow>
          <boxGeometry args={[0.14, 0.14, 0.14]} />
          <meshStandardMaterial color={colors[i]} />
        </mesh>
      ))}
    </group>
  );
}
