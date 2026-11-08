"use client";

import { useCallback, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { AliveGroup } from "@/components/canvas/AliveGroup";
import { Mark3D, useMarkGeometry } from "@/components/canvas/Mark3D";
import { brands } from "@/content/brands";
import { defaultAlive } from "@/lib/alive";
import { clamp01, easeOutExpo, lerp } from "@/lib/easing";
import { wordmarkTravel } from "@/lib/hubTimeline";
import { STUDIOS_LOCKUP } from "@/lib/lockup";
import { HUB } from "@/lib/scene";
import { useExperience } from "@/store/useExperience";
import { useHubRow } from "./rowScale";

/** Same as StudiosLogo: the hero glides forward out of the fog after the loader. */
const ENTRANCE_DURATION = 2.4;

/**
 * The "Babu Studios" wordmark of the hero lockup, as its own object, so that
 * on scroll it can fly into its place in the brand row while the B docks in
 * the header (user request).
 *
 * At travel 0 it is indistinguishable from the lockup's wordmark: same pivot
 * (the lockup centre), same entrance, same "alive" float and tilt (identical
 * parameters and inputs give identical motion), same front-face alignment.
 *
 * Travel math: the outer group is the pivot and is scaled by s. The wordmark
 * sits at offset o = slot·restHeight inside it, so it ends up at pivot + o·s.
 * Moving the pivot from the lockup centre to (target − o·s_end) while s goes
 * 1 → s_end puts the wordmark centre exactly on its row placement at travel 1,
 * at exactly the row height. The alive motion and the reflections fade out on
 * the way, so at travel 1 it matches the row's Studios slot pixel for pixel;
 * the slot takes over there (see SubBrands) and this object hides.
 */
export function StudiosWordmarkTraveler({ url, restHeight }: { url: string; restHeight: number }) {
  const { layout, studiosHeight } = useHubRow();
  const { depth } = useMarkGeometry(url);
  const outer = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const revealedAt = useRef<number | null>(null);
  const travel = useRef(0);
  const strength = useCallback(() => 1 - travel.current, []);
  const flatness = useCallback(() => travel.current, []);

  const slot = STUDIOS_LOCKUP.wordmark;
  const wordHeight = restHeight * slot.height;
  const endScale = studiosHeight / wordHeight;
  const frontAlign = (-depth * wordHeight) / 2;

  useFrame((state) => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const { scrollProgress, revealed, reducedMotion } = useExperience.getState();
    const now = state.clock.elapsedTime;
    const w = wordmarkTravel(scrollProgress);
    travel.current = w;
    o.visible = w < 0.999;

    // Entrance: computed exactly like the B's (same inputs, same frame).
    if (revealed) revealedAt.current ??= now;
    const k =
      reducedMotion || revealedAt.current === null
        ? Number(revealed || reducedMotion)
        : easeOutExpo(clamp01((now - revealedAt.current) / ENTRANCE_DURATION));
    const entranceZ = (1 - k) * -HUB.entranceDepth * (1 - w);

    const target = layout.studios;
    o.position.set(
      lerp(0, target.x - slot.x * restHeight * endScale, w),
      lerp(0, target.y - slot.y * restHeight * endScale, w),
      lerp(HUB.logoZ, target.z, w) + entranceZ,
    );
    o.scale.setScalar(lerp(1, endScale, w));
    // Front-face alignment with the B only matters inside the lockup.
    i.position.z = frontAlign * (1 - w);
  });

  return (
    <group ref={outer} position={[0, 0, HUB.logoZ - HUB.entranceDepth]}>
      <AliveGroup params={defaultAlive} strength={strength}>
        <group ref={inner} position={[slot.x * restHeight, slot.y * restHeight, frontAlign]}>
          <Mark3D url={url} height={wordHeight} palette={brands.studios.palette} flatness={flatness} />
        </group>
      </AliveGroup>
    </group>
  );
}
