"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type Mesh, ShaderMaterial } from "three";
import { theme } from "@/content/brands";
import { flight } from "@/lib/flight";

/**
 * Full-screen beige veil that hides the world swap. Drawn in clip space (no
 * camera dependency), last, without depth: the header DOM stays above it.
 * Same colour as the background, so at full opacity it reads as "into the
 * fog", not as a flash.
 */
export function TransitionVeil() {
  const mesh = useRef<Mesh>(null);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: { uColor: { value: new Color(theme.background) }, uOpacity: { value: 0 } },
        vertexShader: /* glsl */ `
          void main() { gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uOpacity;
          void main() {
            gl_FragColor = vec4(uColor, uOpacity);
            #include <colorspace_fragment>
          }
        `,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    m.visible = flight.veil > 0.001;
    (m.material as ShaderMaterial).uniforms.uOpacity.value = flight.veil;
  });

  return (
    <mesh ref={mesh} material={material} frustumCulled={false} renderOrder={1000}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
