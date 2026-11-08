"use client";

import { type Ref, useEffect, useImperativeHandle, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import type { MeshBasicMaterial } from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { getLogoGeometry, type LogoGeometry } from "@/lib/svgToMesh";
import type { BrandPalette } from "@/content/brands";
import {
  brandColorFor,
  createLogoMaterial,
  createSheenUniforms,
  type SheenUniforms,
} from "@/lib/logoMaterial";

/**
 * Loads (suspends) and returns the cached geometry for a logo. Callers use it
 * to size things around the logo (shadow, labels) from its real aspect ratio.
 */
export function useLogoGeometry(url: string): LogoGeometry {
  const svg = useLoader(SVGLoader, url);
  return useMemo(() => getLogoGeometry(url, svg), [url, svg]);
}

/** Height in world units that fits a logo of this aspect into a box. */
export function fitLogoHeight(aspect: number, maxWidth: number, maxHeight: number): number {
  return Math.min(maxHeight, maxWidth / aspect);
}

interface Logo3DProps {
  /** URL of the logo SVG (resolved with assetUrl). */
  url: string;
  /** Rendered height in world units (see fitLogoHeight). */
  height: number;
  /**
   * Opt-in sheen. The logo owns its uniforms and exposes them through this ref;
   * the parent animates `sheenRef.current.uSweep.value` in its own useFrame.
   */
  sheenRef?: Ref<SheenUniforms>;
  /** Exposes this instance's materials (e.g. to mute them on hover elsewhere). */
  materialsRef?: Ref<MeshBasicMaterial[]>;
  /** Draw in these brand tokens instead of the file's own colours (see brandColorFor). */
  palette?: BrandPalette;
}

/**
 * A brand logo as shallow extruded meshes, one per SVG path, each in its
 * original colour. Suspends while the SVG loads.
 */
export function Logo3D({ url, height, sheenRef, materialsRef, palette }: Logo3DProps) {
  const logo = useLogoGeometry(url);
  const withSheen = sheenRef !== undefined;
  const sheen = useMemo(() => (withSheen ? createSheenUniforms() : undefined), [withSheen]);
  const materials = useMemo(
    () =>
      logo.parts.map((part) =>
        createLogoMaterial(palette ? brandColorFor(part.color, palette) : part.color, sheen),
      ),
    [logo, sheen, palette],
  );

  useImperativeHandle(sheenRef, () => sheen ?? createSheenUniforms(), [sheen]);
  useImperativeHandle(materialsRef, () => materials, [materials]);
  // Geometries are cached and shared; only the materials belong to this instance.
  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials]);

  return (
    <group scale={height}>
      {logo.parts.map((part, index) => (
        <mesh key={index} geometry={part.geometry} material={materials[index]} />
      ))}
    </group>
  );
}
