"use client";

import { type RefObject, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { theme } from "@/content/brands";
import { dprRange, stepQuality } from "@/lib/quality";
import { CAMERA_FAR, CAMERA_FOV, CAMERA_NEAR, FOG_DENSITY } from "@/lib/scene";
import { useExperience } from "@/store/useExperience";
import { CameraRig } from "./CameraRig";
import { Particles } from "./Particles";
import { LoadProgressSignal, ReadySignal } from "./SceneSignals";
import { SectionScroller } from "./SectionScroller";
import { StudioEnvironment } from "./StudioEnvironment";
import { TransitionDirector } from "./TransitionDirector";
import { TransitionVeil } from "./TransitionVeil";
import { WorldManager } from "./WorldManager";

interface ExperienceProps {
  /** Element that receives pointer events, so the DOM overlay never blocks the scene. */
  eventSource: RefObject<HTMLElement | null>;
  /** Called if the GPU drops the WebGL context (driver reset, memory pressure). */
  onContextLost: () => void;
}

/**
 * The one persistent Canvas. Mounted once by ExperienceShell in the root layout
 * and never unmounted on navigation.
 *
 * `flat` disables tone mapping: the clear colour is never tone-mapped, so with
 * ACES the fogged objects would fade to a slightly different beige than the
 * background. Flat keeps clear colour, fog and HTML background identical.
 */
export default function Experience({ eventSource, onContextLost }: ExperienceProps) {
  const quality = useExperience((s) => s.quality);
  const setQuality = useExperience((s) => s.setQuality);

  return (
    <Canvas
      flat
      dpr={dprRange(quality)}
      eventSource={eventSource as RefObject<HTMLElement>}
      eventPrefix="client"
      camera={{ fov: CAMERA_FOV, near: CAMERA_NEAR, far: CAMERA_FAR, position: [0, 0, 0] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", onContextLost, { once: true });
      }}
    >
      <color attach="background" args={[theme.background]} />
      <fogExp2 attach="fog" args={[theme.background, FOG_DENSITY]} />

      <PerformanceMonitor
        flipflops={3}
        onDecline={() => setQuality(stepQuality(useExperience.getState().quality, -1))}
        onIncline={() => setQuality(stepQuality(useExperience.getState().quality, 1))}
        onFallback={() => setQuality("low")}
      />
      <LoadProgressSignal />
      <TransitionDirector />
      <CameraRig />
      <SectionScroller />
      <StudioEnvironment />

      <Suspense fallback={null}>
        <WorldManager />
        <ReadySignal />
      </Suspense>
      <Particles />
      <TransitionVeil />
    </Canvas>
  );
}
