"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import type { Mesh } from "three";
import { clamp01, easeInOutQuart, lerp } from "@/lib/easing";
import { STUDIO } from "@/lib/scene";
import { useExperience } from "@/store/useExperience";

/**
 * Light-sweep timing (seconds after the loader fades): the first pass, then
 * one pass per cycle. The strip parks off to the side between passes.
 */
// The face only reflects the strip while |x| ≲ 2.5 (the mark subtends about
// ±0.3 rad in reflection), so the path is kept short and slow across it.
const SWEEP = { delay: 1.6, duration: 2.6, cycle: 7, fromX: -3.2, toX: 3.2, parkedX: -14 };

/**
 * A procedural studio, rendered into the environment map (no HDR download).
 * Only physically based materials (the 3D mark) see it; it never appears as
 * the scene background, which stays the beige clear colour. See STUDIO in
 * lib/scene.ts for why its backdrop is dark.
 *
 * Geometry of the reflections: the camera looks down -Z at the mark, so the
 * mark's front face reflects what is behind the camera (+Z). A tall, thin
 * strip at z = +6 moving along x therefore reads as a band of light gliding
 * across the face; the cursor tilt (±6°) slides reflections by ±12°.
 */
export function StudioEnvironment() {
  // Static map on low quality; live (re-rendered each frame) otherwise so the
  // sweep strip can move.
  const live = useExperience((s) => s.quality !== "low");
  const sweep = useRef<Mesh>(null);
  const revealedAt = useRef<number | null>(null);

  useFrame((state) => {
    const strip = sweep.current;
    if (!strip) return;
    const { revealed, reducedMotion } = useExperience.getState();
    if (!revealed || reducedMotion) {
      strip.position.x = SWEEP.parkedX;
      return;
    }
    const now = state.clock.elapsedTime;
    revealedAt.current ??= now;
    const local = now - revealedAt.current - SWEEP.delay;
    const progress = local < 0 ? 1 : (local % SWEEP.cycle) / SWEEP.duration;
    strip.position.x =
      progress < 1 ? lerp(SWEEP.fromX, SWEEP.toX, easeInOutQuart(clamp01(progress))) : SWEEP.parkedX;
  });

  return (
    <Environment resolution={256} frames={live ? Infinity : 1}>
      <color attach="background" args={[STUDIO.backdrop]} />
      {/* Overhead softbox: a broad, soft highlight along the top bevels. */}
      <Lightformer form="rect" intensity={STUDIO.intensity.softbox} scale={[14, 6, 1]} position={[0, 7, -1]} rotation-x={Math.PI / 2} />
      {/* Key strip, left. */}
      <Lightformer form="rect" intensity={STUDIO.intensity.key} scale={[1.4, 12, 1]} position={[-6, 0, 2]} rotation-y={Math.PI / 2} />
      {/* Rim strip, right: weaker, so the mark has a lit side and a shadow side. */}
      <Lightformer form="rect" intensity={STUDIO.intensity.rim} scale={[0.6, 12, 1]} position={[6, 0, 1]} rotation-y={-Math.PI / 2} />
      {/*
        Horizon band behind the camera, slightly above eye level. A flat face
        mirrors what is behind the viewer, so this puts a permanent soft gloss
        across the upper part of the mark that slides as it tilts; without it
        the face is a dead black silhouette between sweeps.
      */}
      <Lightformer
        form="rect"
        intensity={STUDIO.intensity.horizon}
        scale={[18, 2.4, 1]}
        position={[0, 3, 7]}
        rotation-y={Math.PI}
      />
      {/* The sweep. */}
      <Lightformer
        ref={sweep}
        form="rect"
        intensity={STUDIO.intensity.sweep}
        scale={[0.3, 14, 1]}
        position={[SWEEP.parkedX, 0, 6]}
        rotation-y={Math.PI}
      />
    </Environment>
  );
}
