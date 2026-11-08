import { Color, DoubleSide, type IUniform, MeshBasicMaterial } from "three";
import { type BrandPalette, theme } from "@/content/brands";

/** Uniforms shared by every part of one logo so the sheen crosses it as one. */
export interface SheenUniforms {
  /** Position of the light band along the sweep axis (logo units, height = 1). */
  uSweep: IUniform<number>;
  /** 0..1 how far the band lifts the colour towards white. */
  uSheenStrength: IUniform<number>;
}

/** Off-artwork position: the band is invisible here. */
export const SHEEN_PARKED = -10;

export function createSheenUniforms(strength = 0.3): SheenUniforms {
  return { uSweep: { value: SHEEN_PARKED }, uSheenStrength: { value: strength } };
}

/*
 * The sweep axis is diagonal: s = x + 0.6·y in normalized logo space, so the
 * band leans like light catching a tilted surface. The band profile is a
 * Gaussian exp(-d²/w) with w = 0.008, i.e. about 0.09 units (9% of the logo
 * height) at 1/e: a soft, narrow highlight, not a wipe.
 */
const SHEEN_FRAGMENT = /* glsl */ `
  float sheenDistance = (vLogoPos.x + vLogoPos.y * 0.6) - uSweep;
  float sheenBand = exp(-(sheenDistance * sheenDistance) / 0.008);
  // Warm cream highlight rather than pure white, so it never greys the black.
  outgoingLight = mix(outgoingLight, vec3(1.0, 0.97, 0.9), sheenBand * uSheenStrength);
`;

/**
 * Unlit material that keeps the logo's exact brand colour (no lighting, no
 * tone mapping) plus an optional sheen band, injected into the built-in
 * MeshBasicMaterial shader so fog and colour management keep working.
 */
export function createLogoMaterial(color: Color, sheen?: SheenUniforms): MeshBasicMaterial {
  const material = new MeshBasicMaterial({ color, side: DoubleSide });
  prepareMuted(material);
  if (!sheen) return material;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSweep = sheen.uSweep;
    shader.uniforms.uSheenStrength = sheen.uSheenStrength;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vLogoPos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvLogoPos = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float uSweep;\nuniform float uSheenStrength;\nvarying vec3 vLogoPos;",
      )
      .replace("#include <opaque_fragment>", `${SHEEN_FRAGMENT}\n#include <opaque_fragment>`);
  };
  material.customProgramCacheKey = () => "babu-logo-sheen";
  return material;
}

interface MutedColors {
  base: Color;
  muted: Color;
}

/**
 * Precomputes the "receded" colour of a logo material: its luminance as grey,
 * then 45% of the way to the background, so a de-emphasised logo looks
 * desaturated and slightly further into the fog.
 */
function prepareMuted(material: MeshBasicMaterial): void {
  const base = material.color.clone();
  const luminance = 0.2126 * base.r + 0.7152 * base.g + 0.0722 * base.b;
  const muted = new Color(luminance, luminance, luminance).lerp(new Color(theme.background), 0.45);
  material.userData.mutedColors = { base, muted } satisfies MutedColors;
}

/** 0 = original brand colour, 1 = fully muted. */
export function setMuted(material: MeshBasicMaterial, amount: number): void {
  const colors = material.userData.mutedColors as MutedColors | undefined;
  if (colors) material.color.copy(colors.base).lerp(colors.muted, amount);
}

/**
 * Maps a colour from a logo file onto the brand palette: dark (lettering) →
 * `base` (falls back to `accent`), anything lighter (the gold rule) →
 * `primary`. Keeps logos whose files use slightly different blacks and golds
 * (navy #121f33, #B38532, #bf994a…) in the site's exact tokens.
 */
export function brandColorFor(source: Color, palette: BrandPalette): Color {
  const luminance = 0.2126 * source.r + 0.7152 * source.g + 0.0722 * source.b;
  return new Color(luminance < 0.1 ? (palette.base ?? palette.accent) : palette.primary);
}
