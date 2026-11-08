"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, Color, NormalBlending, type Points, ShaderMaterial } from "three";
import { theme } from "@/content/brands";
import { createRandom } from "@/lib/random";
import { type SampleSource, sampleFrontSurface } from "@/lib/sampleSurface";
import { FOG_DENSITY } from "@/lib/scene";

/**
 * The cinematic entrance of a hub logo: a cloud of dust sampled from the
 * logo's own surface converges into its shape as `progress` goes 0 → 1, then
 * dissolves as the solid logo fades in over it (the parent fades the mesh).
 * Scrubbed by scroll, so scrolling back up scatters it again.
 *
 * Positions are in the logo's normalised space (height 1); the group scale
 * makes them world-sized. Each mote has its own delay, so the logo fills in
 * gradually rather than snapping together.
 */

const vertex = /* glsl */ `
  attribute vec3 aScatter;  // offset from the target at progress 0 (normalised units)
  attribute vec2 aSeed;     // x: start delay 0..1, y: size / swirl 0..1
  attribute vec3 aColor;    // linear RGB of the part the mote belongs to

  uniform float uProgress;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uFogDensity;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vFog;

  void main() {
    // Local progress: motes set off one after another over the first 45%.
    float t = clamp((uProgress - aSeed.x * 0.45) / 0.55, 0.0, 1.0);
    float e = 1.0 - pow(1.0 - t, 3.0); // ease-out cubic: fast, then settles

    // The remaining offset turns slowly about the logo's axis as it closes,
    // so the dust spirals in instead of flying in straight lines.
    float angle = (1.0 - e) * (aSeed.y - 0.5) * 3.2;
    vec3 offset = aScatter * (1.0 - e);
    float c = cos(angle);
    float s = sin(angle);
    offset.xy = mat2(c, s, -s, c) * offset.xy;

    vec4 mv = modelViewMatrix * vec4(position + offset, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = -mv.z;
    gl_PointSize = uSize * uPixelRatio * (0.6 + aSeed.y * 0.8) / dist;

    vColor = aColor;
    // Visible while travelling; gone once the solid logo has taken over.
    vAlpha = smoothstep(0.0, 0.2, t) * (1.0 - smoothstep(0.8, 0.98, uProgress));
    // Same exponential-squared fog as the scene, so far dust melts into beige.
    vFog = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uFogColor;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vFog;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.12, d) * vAlpha;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(mix(vColor, uFogColor, vFog), alpha);
    #include <colorspace_fragment>
  }
`;

interface LogoAssemblyProps {
  /** The logo's parts (normalised geometry) in their final colours. */
  sources: SampleSource[];
  /** The logo's width / height, to size the scatter. */
  aspect: number;
  /** Rendered height in world units (the same scale as the logo). */
  height: number;
  /** Read every frame: 0 scattered … 1 assembled (and dissolved). */
  progress: () => number;
  count: number;
  seed: number;
}

export function LogoAssembly({ sources, aspect, height, progress, count, seed }: LogoAssemblyProps) {
  const dpr = useThree((state) => state.viewport.dpr);
  const points = useRef<Points>(null);

  const geometry = useMemo(() => {
    const samples = sampleFrontSurface(sources, count, seed);
    const random = createRandom(seed * 7 + 3);
    const scatter = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      // Start in a wide, shallow shell around the logo and well behind it, so
      // the dust drifts forward out of the fog as it gathers.
      const angle = random() * Math.PI * 2;
      const radius = (1 + random() * 2.2) * Math.max(1, aspect * 0.7);
      scatter[i * 3] = Math.cos(angle) * radius;
      scatter[i * 3 + 1] = Math.sin(angle) * radius * 0.6;
      scatter[i * 3 + 2] = -(2 + random() * 8);
      seeds[i * 2] = random();
      seeds[i * 2 + 1] = random();
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(samples.positions, 3));
    g.setAttribute("aColor", new BufferAttribute(samples.colors, 3));
    g.setAttribute("aScatter", new BufferAttribute(scatter, 3));
    g.setAttribute("aSeed", new BufferAttribute(seeds, 2));
    // The cloud is far larger than the logo; never cull it by the logo's bounds.
    g.computeBoundingSphere();
    return g;
  }, [sources, count, seed, aspect]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uProgress: { value: 0 },
          // ≈ 3 CSS px at the hub's logo depth (~11 units).
          uSize: { value: 34 },
          uPixelRatio: { value: 1 },
          uFogDensity: { value: FOG_DENSITY },
          uFogColor: { value: new Color(theme.background) },
        },
        transparent: true,
        depthWrite: false,
        // Not additive: on a light background additive dust washes out to white.
        blending: NormalBlending,
      }),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(() => {
    const p = progress();
    const pts = points.current;
    if (!pts) return;
    pts.visible = p > 0.001 && p < 0.98;
    // Through the ref (React Compiler: memoised values are immutable).
    const { uniforms } = pts.material as ShaderMaterial;
    uniforms.uProgress.value = p;
    uniforms.uPixelRatio.value = dpr;
  });

  return (
    <points ref={points} geometry={geometry} material={material} scale={height} frustumCulled={false} renderOrder={2} />
  );
}
