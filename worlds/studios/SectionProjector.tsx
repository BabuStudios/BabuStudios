"use client";

import { useFrame } from "@react-three/fiber";
import type { PerspectiveCamera } from "three";
import { Vector3 } from "three";
import { useExperience } from "@/store/useExperience";
import { STUDIOS_SECTIONS } from "./sections";

const world = new Vector3();
const view = new Vector3();

/**
 * Projects every corridor panel's 3D anchor to the screen each frame and
 * publishes it (store `sectionFrames`, mutated in place). The DOM panels read
 * these to place, scale, fade and blur themselves (lib/focus.ts).
 */
export function SectionProjector() {
  useFrame((state) => {
    const camera = state.camera as PerspectiveCamera;
    const { sectionFrames } = useExperience.getState();
    const portrait = state.size.width / state.size.height < 0.85;
    for (const s of STUDIOS_SECTIONS) {
      world.set(portrait ? 0 : s.x, s.y, s.z);
      view.copy(world).applyMatrix4(camera.matrixWorldInverse);
      world.project(camera);
      const frame = (sectionFrames[s.id] ??= { x: 0, y: 0, depth: 100 });
      frame.x = (world.x * 0.5 + 0.5) * state.size.width;
      frame.y = (-world.y * 0.5 + 0.5) * state.size.height;
      frame.depth = -view.z;
    }
  });
  return null;
}
