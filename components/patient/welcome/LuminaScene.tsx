"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles } from "@react-three/drei";
import * as THREE from "three";

type Distortable = { distort: number };

/** Lumina as a living orb: it breathes when idle and swells with an imagined voice when speaking. */
function Orb({ speaking, still }: { speaking: boolean; still: boolean }) {
  const body = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const material = useRef<Distortable | null>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const idle = 0.14 + 0.1 * Math.sin(t * 1.15);
    const voice = 0.5 + 0.5 * Math.abs(Math.sin(t * 7.3) * Math.sin(t * 3.1 + 1));
    const amp = still ? 0.15 : speaking ? voice : idle;

    if (material.current) material.current.distort = THREE.MathUtils.lerp(material.current.distort, 0.24 + amp * 0.34, 0.08);
    if (body.current) {
      const scale = 1 + amp * 0.07;
      body.current.scale.setScalar(THREE.MathUtils.lerp(body.current.scale.x, scale, 0.1));
      if (!still) body.current.rotation.y += delta * 0.16;
    }
    if (halo.current) {
      const glow = 1.32 + amp * 0.16;
      halo.current.scale.setScalar(THREE.MathUtils.lerp(halo.current.scale.x, glow, 0.06));
    }
    if (!still) {
      // Gentle parallax: the scene leans toward the pointer.
      state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, state.pointer.x * 0.55, 0.04);
      state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, state.pointer.y * 0.35, 0.04);
      state.camera.lookAt(0, 0, 0);
    }
  });

  return (
    <Float speed={still ? 0 : 1.3} rotationIntensity={still ? 0 : 0.25} floatIntensity={still ? 0 : 0.7}>
      <mesh ref={body}>
        <sphereGeometry args={[1.25, 64, 64]} />
        <MeshDistortMaterial
          ref={material as never}
          color="#5b98a3"
          emissive="#2f535a"
          emissiveIntensity={0.4}
          roughness={0.14}
          metalness={0.3}
          distort={0.3}
          speed={still ? 0 : 2}
        />
      </mesh>
      <mesh ref={halo} scale={1.32}>
        <sphereGeometry args={[1.25, 32, 32]} />
        <meshBasicMaterial color="#a9c7cb" transparent opacity={0.16} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </Float>
  );
}

export default function LuminaScene({ speaking, still, onDrawn }: { speaking: boolean; still: boolean; onDrawn?: () => void }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 5.2], fov: 42 }} gl={{ antialias: true, alpha: true }} onCreated={() => requestAnimationFrame(() => onDrawn?.())} aria-hidden>
      <ambientLight intensity={0.9} />
      <pointLight position={[3, 3, 4]} intensity={38} color="#e9f4f4" />
      <pointLight position={[-4, -1.5, 3]} intensity={26} color="#e3b01c" />
      <pointLight position={[2, -3, -2]} intensity={22} color="#b87070" />
      <Orb speaking={speaking} still={still} />
      {!still && <Sparkles count={64} scale={[7, 4.5, 5]} size={3.2} speed={0.35} opacity={0.75} color="#f8ebc2" />}
    </Canvas>
  );
}
