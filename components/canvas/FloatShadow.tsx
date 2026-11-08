"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, Color, type Mesh, MeshBasicMaterial, SRGBColorSpace } from "three";
import { defaultAlive, floatOffset, type AliveParams } from "@/lib/alive";
import { theme } from "@/content/brands";
import { useExperience } from "@/store/useExperience";

let blobTexture: CanvasTexture | null = null;

/** A soft radial blob, generated once and shared by every shadow. */
function getBlobTexture(): CanvasTexture {
  if (blobTexture) return blobTexture;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.45, "rgba(255,255,255,0.45)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  blobTexture = new CanvasTexture(canvas);
  blobTexture.colorSpace = SRGBColorSpace;
  return blobTexture;
}

interface FloatShadowProps {
  /** Vertical position under the object it belongs to. */
  y: number;
  width: number;
  /** Must match the AliveGroup params of the object above it. */
  params?: AliveParams;
  opacity?: number;
  /** Read every frame: 0..1 multiplier on the opacity. Defaults to 1. */
  strength?: () => number;
}

/**
 * A very soft contact shadow on an invisible floor. It stays put while the
 * object above floats: when the object rises the shadow fades and widens a
 * little, which sells the weightlessness.
 */
export function FloatShadow({ y, width, params = defaultAlive, opacity = 0.11, strength }: FloatShadowProps) {
  const ref = useRef<Mesh>(null);
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        map: getBlobTexture(),
        color: new Color(theme.text),
        transparent: true,
        depthWrite: false,
        opacity,
      }),
    [opacity],
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const { reducedMotion } = useExperience.getState();
    // lift: -1 at the bottom of the float, +1 at the top.
    const lift = reducedMotion ? 0 : floatOffset(state.clock.elapsedTime, params) / params.amplitude;
    const amount = strength?.() ?? 1;
    mesh.visible = amount > 0.001;
    (mesh.material as MeshBasicMaterial).opacity = opacity * (1 - lift * 0.22) * amount;
    mesh.scale.set(width * (1 + lift * 0.06), width * 0.32, 1);
  });

  return (
    <mesh ref={ref} position-y={y} rotation-x={-Math.PI / 2} material={material} renderOrder={-1}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
