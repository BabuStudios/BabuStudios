"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { Box3, type BufferGeometry, Color, type Group, type Mesh, type MeshStandardMaterial, Vector3 } from "three";
import type { BrandPalette } from "@/content/brands";
import { InlineAwareGLTFLoader } from "@/lib/inlineAssets";
import { createMarkMaterial, type MarkRole, setMarkFlatness, setMarkMute } from "@/lib/markMaterial";

export interface MarkPart {
  geometry: BufferGeometry;
  role: MarkRole;
}

export interface MarkGeometry {
  parts: MarkPart[];
  /** width / height of the whole logo. */
  aspect: number;
  /** depth / height. */
  depth: number;
}

/**
 * Loads (suspends) a 3D logo produced by `npm run convert:mark`: one mesh per
 * part, already centred and normalised to height 1 as a whole. Each part's
 * role travels as its material name. Geometries are cached by useLoader for
 * the page's lifetime and shared, so they are never disposed here.
 */
export function useMarkGeometry(url: string): MarkGeometry {
  const gltf = useLoader(InlineAwareGLTFLoader, url);
  return useMemo(() => {
    const parts: MarkPart[] = [];
    const bounds = new Box3();
    gltf.scene.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;
      const name = Array.isArray(mesh.material) ? "" : mesh.material.name;
      parts.push({ geometry: mesh.geometry, role: name === "accent" ? "accent" : "base" });
      mesh.geometry.computeBoundingBox();
      if (mesh.geometry.boundingBox) bounds.union(mesh.geometry.boundingBox);
    });
    if (parts.length === 0) throw new Error(`No mesh found in ${url}`);
    const size = bounds.getSize(new Vector3());
    return { parts, aspect: size.x / size.y, depth: size.z / size.y };
  }, [gltf, url]);
}

interface Mark3DProps {
  url: string;
  /** Rendered height in world units. */
  height: number;
  /** Colours: `base` (lettering) and `primary` (accent) from the brand tokens. */
  palette: BrandPalette;
  /** Read every frame: 0 studio look … 1 flat brand colours (see setMarkFlatness). */
  flatness?: () => number;
  /** Read every frame: 0..1 opacity (fades the part out; hidden at 0). */
  opacity?: () => number;
  /** Read every frame: 0 brand colours … 1 muted (see setMarkMute). */
  mute?: () => number;
}

/** A 3D logo: lettering in black lacquer, accents in gold, lit by StudioEnvironment. */
export function Mark3D({ url, height, palette, flatness, opacity, mute }: Mark3DProps) {
  const group = useRef<Group>(null);
  const { parts } = useMarkGeometry(url);
  const materials = useMemo(() => {
    const colors: Record<MarkRole, Color> = {
      base: new Color(palette.base ?? palette.accent),
      accent: new Color(palette.primary),
    };
    return parts.map((part) => createMarkMaterial(part.role, colors[part.role]));
  }, [parts, palette]);
  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials]);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const alpha = opacity?.() ?? 1;
    g.visible = alpha > 0.001;
    if (!flatness && !opacity && !mute) return;
    const flat = flatness?.();
    const muted = mute?.();
    for (const child of g.children) {
      const material = (child as Mesh).material as MeshStandardMaterial;
      if (flat !== undefined) setMarkFlatness(material, flat, state.scene.environment);
      if (muted !== undefined) setMarkMute(material, muted);
      if (opacity) {
        // Transparent only while fading, so the opaque pass is used at rest.
        const fading = alpha < 0.999;
        if (material.transparent !== fading) {
          material.transparent = fading;
          material.needsUpdate = true;
        }
        material.opacity = alpha;
      }
    }
  });

  return (
    <group ref={group} scale={height}>
      {parts.map((part, index) => (
        <mesh key={index} geometry={part.geometry} material={materials[index]} />
      ))}
    </group>
  );
}
