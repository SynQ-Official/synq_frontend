"use client";

import { Component, useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import { LuminaOrb } from "@/components/patient/ui/primitives";
import { cn } from "@/lib/utils";

/** The soft CSS orb: holds the place while the 3D scene loads, and for good when WebGL is unavailable or fails. */
function OrbFallback() {
  const reduce = useReducedMotion();
  return (
    <div className="flex size-full items-center justify-center">
      {/* The cap keeps the orb inside a short viewport's smaller container (the 3D scene is sized by it too). */}
      <LuminaOrb size={220} breathe={!reduce} className="max-h-[85%] max-w-[85%]" />
    </div>
  );
}

const LuminaScene = dynamic(() => import("@/components/patient/welcome/LuminaScene"), { ssr: false });

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Runs `task` once the browser is idle, so the 3D scene never competes with the page's entrance animation. */
function whenIdle(task: () => void) {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(task, { timeout: 1200 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(task, 400);
  return () => window.clearTimeout(id);
}

/** A scene that throws leaves the orb in place (it is only hidden once the scene has really drawn). */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * The 3D Lumina. The CSS orb is there from the first paint; once the browser is idle the scene loads and
 * cross-fades over it (opacity only, so nothing shifts). No WebGL, or a scene that fails: the orb simply stays.
 */
export function LuminaHero3D({ speaking }: { speaking: boolean }) {
  const reduce = useReducedMotion();
  const [sceneWanted, setSceneWanted] = useState(false);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    // WebGL support can only be probed in the browser, and the scene waits for idle time.
    if (!webglAvailable()) return;
    return whenIdle(() => setSceneWanted(true));
  }, []);

  return (
    <div className="relative size-full" role="img" aria-label="SynQ">
      <div className={cn("absolute inset-0 transition-opacity duration-700 motion-reduce:duration-0", drawn && "opacity-0")}>
        <OrbFallback />
      </div>
      {sceneWanted && (
        <SceneBoundary>
          <div className={cn("absolute inset-0 opacity-0 transition-opacity duration-700 motion-reduce:duration-0", drawn && "opacity-100")}>
            <LuminaScene speaking={speaking} still={Boolean(reduce)} onDrawn={() => setDrawn(true)} />
          </div>
        </SceneBoundary>
      )}
    </div>
  );
}
