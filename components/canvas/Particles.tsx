"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import {
  Color,
  InstancedBufferAttribute,
  type Mesh,
  InstancedBufferGeometry,
  MathUtils,
  NormalBlending,
  PlaneGeometry,
  type PerspectiveCamera,
  ShaderMaterial,
  Vector2,
} from "three";
import { type BrandId, brands, theme } from "@/content/brands";
import { createRandom } from "@/lib/random";
import { qualityPresets } from "@/lib/quality";
import { flight } from "@/lib/flight";
import { FOG_DENSITY, HUB } from "@/lib/scene";
import { useExperience, type WorldId } from "@/store/useExperience";
import { particleFragment, particleVertex } from "./particleShaders";

/**
 * Tints: brand primaries are common, accents rarer and pushed further toward
 * the background, so the field stays low-contrast (no rainbow).
 * [colour, weight, min mix toward bg, max mix toward bg]
 */
function particleTints(): Array<[Color, number, number, number]> {
  const unique = new Map<string, [Color, number, number, number]>();
  for (const brand of Object.values(brands)) {
    const { primary, accent } = brand.palette;
    if (!unique.has(primary)) unique.set(primary, [new Color(primary), 0.7, 0.2, 0.5]);
    if (!unique.has(accent)) unique.set(accent, [new Color(accent), 0.3, 0.55, 0.8]);
  }
  return [...unique.values()];
}

const background = new Color(theme.background);

function buildGeometry(count: number): InstancedBufferGeometry {
  const random = createRandom(1337);
  const tints = particleTints();
  const totalWeight = tints.reduce((sum, [, w]) => sum + w, 0);
  const { x, y, zNear, zFar } = HUB.particleVolume;

  const offsets = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 4);
  const colors = new Float32Array(count * 3);
  const color = new Color();

  for (let i = 0; i < count; i++) {
    offsets[i * 3] = (random() * 2 - 1) * x;
    offsets[i * 3 + 1] = (random() * 2 - 1) * y;
    offsets[i * 3 + 2] = MathUtils.lerp(zNear, zFar, random());

    seeds[i * 4] = random();
    seeds[i * 4 + 1] = 0.08 + random() * 0.14;
    seeds[i * 4 + 2] = 0.022 + Math.pow(random(), 2.2) * 0.07;

    let pick = random() * totalWeight;
    const tint = tints.find(([, weight]) => (pick -= weight) <= 0) ?? tints[0];
    const [base, , minMix, maxMix] = tint;
    color.copy(base).lerp(background, MathUtils.lerp(minMix, maxMix, random()));
    colors.set([color.r, color.g, color.b], i * 3);
  }

  const geometry = new InstancedBufferGeometry();
  const quad = new PlaneGeometry(1, 1);
  geometry.index = quad.index;
  geometry.setAttribute("position", quad.getAttribute("position"));
  geometry.setAttribute("uv", quad.getAttribute("uv"));
  geometry.setAttribute("aOffset", new InstancedBufferAttribute(offsets, 3));
  geometry.setAttribute("aSeed", new InstancedBufferAttribute(seeds, 4));
  geometry.setAttribute("aColor", new InstancedBufferAttribute(colors, 3));
  geometry.instanceCount = count;
  return geometry;
}

function createMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: particleVertex,
    fragmentShader: particleFragment,
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uMotion: { value: 1 },
      uPointer: { value: new Vector2() },
      uTanHalfFov: { value: 0.41 },
      uAspect: { value: 1 },
      uFogDensity: { value: FOG_DENSITY },
      uOpacity: { value: 0.9 },
      uTint: { value: new Color() },
      uTintAmount: { value: 0 },
      uStreak: { value: 0 },
      uCameraY: { value: 0 },
      uHalfHeight: { value: HUB.particleVolume.y },
      uCameraZ: { value: 0 },
      uZFar: { value: HUB.particleVolume.zFar },
      uDepthRange: { value: HUB.particleVolume.zNear - HUB.particleVolume.zFar },
    },
  });
}

/** A sparse field of slow-drifting dust motes, one instanced draw call. */
export function Particles() {
  const quality = useExperience((s) => s.quality);
  const count = qualityPresets[quality].particles;
  const geometry = useMemo(() => buildGeometry(count), [count]);
  const material = useMemo(() => createMaterial(), []);
  const mesh = useRef<Mesh>(null);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    const { pointer, reducedMotion, hoveredBrand, activeWorld, targetWorld } = useExperience.getState();
    const camera = state.camera as PerspectiveCamera;
    const u = (mesh.current.material as ShaderMaterial).uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uTanHalfFov.value = Math.tan(MathUtils.degToRad(camera.fov) / 2);
    u.uAspect.value = camera.aspect;
    easing.damp(u.uMotion, "value", reducedMotion ? 0 : 1, 0.4, delta);
    // Damped separately from the logo tilt so motes trail the cursor softly.
    easing.damp2(u.uPointer.value, [pointer.x, pointer.y], 0.6, delta);

    u.uStreak.value = flight.streak;
    u.uCameraY.value = camera.position.y;
    u.uCameraZ.value = camera.position.z;

    // The dust leans toward the colour of the hovered brand, the brand being
    // flown to, or the brand world we are in (kept soft: the tint itself is
    // 40% background, and at most 45% of each mote).
    const tintBrand = hoveredBrand ?? brandOf(targetWorld) ?? brandOf(activeWorld);
    if (tintBrand) {
      (u.uTint.value as Color).set(brands[tintBrand].palette.primary).lerp(background, 0.4);
    }
    easing.damp(u.uTintAmount, "value", tintBrand ? (hoveredBrand ? 0.45 : 0.3) : 0, 0.5, delta);
  });

  return <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} renderOrder={1} />;
}

/** The brand a world belongs to (the hub and the page worlds have none: no tint). */
function brandOf(world: WorldId | null): BrandId | null {
  return world && world in brands ? (world as BrandId) : null;
}
