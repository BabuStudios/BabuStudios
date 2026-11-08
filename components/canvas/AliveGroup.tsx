"use client";

import { type ReactNode, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { MathUtils, type Group } from "three";
import { breathScale, defaultAlive, floatOffset, type AliveParams } from "@/lib/alive";
import { useExperience } from "@/store/useExperience";

interface AliveGroupProps {
  children: ReactNode;
  params?: AliveParams;
  /** Maximum rotation toward the cursor, in degrees (brief: ~6°). */
  maxTiltDeg?: number;
  /**
   * Read every frame: 0..1 how much of the behaviour applies (e.g. fades out
   * while the logo docks into the header). Defaults to 1.
   */
  strength?: () => number;
}

/**
 * Gives its children the shared "alive" behaviour: a slow float, micro
 * breathing, and a damped turn toward the cursor. Owns only its own local
 * transform, so a parent can still move it (dock, fly-in) independently.
 */
export function AliveGroup({ children, params = defaultAlive, maxTiltDeg = 6, strength }: AliveGroupProps) {
  const ref = useRef<Group>(null);
  const tilt = useRef({ x: 0, y: 0 });
  const maxTilt = MathUtils.degToRad(maxTiltDeg);

  useFrame((state, delta) => {
    const group = ref.current;
    if (!group) return;
    const { pointer, reducedMotion } = useExperience.getState();
    const motion = reducedMotion ? 0 : (strength?.() ?? 1);
    const t = state.clock.elapsedTime;

    group.position.y = floatOffset(t, params) * motion;
    group.scale.setScalar(1 + (breathScale(t, params) - 1) * motion);

    // Facing the cursor: yaw follows x, pitch follows y at 70% (vertical tilt
    // reads stronger on a wide logo). A ±1° slow idle sway on top keeps the logo
    // from ever freezing when the cursor is still.
    const idleYaw = Math.sin((t + params.phase) * 0.31) * MathUtils.degToRad(1);
    // smoothTime 0.45 s: noticeably lagging, which reads as weight. The damped
    // tilt is kept separately and scaled by `motion` afterwards, so at strength
    // 0 the group is exactly square to its parent (no lingering damped tilt).
    const reduced = reducedMotion ? 0 : 1;
    easing.damp(tilt.current, "x", -pointer.y * maxTilt * 0.7 * reduced, 0.45, delta);
    easing.damp(tilt.current, "y", (pointer.x * maxTilt + idleYaw) * reduced, 0.45, delta);
    group.rotation.set(tilt.current.x * motion, tilt.current.y * motion, 0);
  });

  return <group ref={ref}>{children}</group>;
}
