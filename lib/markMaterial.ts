import { Color, MeshPhysicalMaterial, MeshStandardMaterial, type Texture } from "three";
import { theme } from "@/content/brands";

/** Self-glow of the gold accent in the dark studio (see createGoldMaterial). */
const GOLD_EMISSIVE = 0.55;

/** Which material a part of a 3D logo gets (set by `npm run convert:mark`). */
export type MarkRole = "base" | "accent";

/**
 * Black lacquer for the lettering.
 *
 * Black *metal* reflects nothing in a physically based renderer (a metal's
 * reflections are tinted by its base colour) and reads as a flat silhouette.
 * A black dielectric with a clear coat stays deep black with crisp glossy
 * reflections, so the studio's light strips travel across the faces and edges.
 */
export function createLacquerMaterial(color: Color): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color,
    metalness: 0,
    roughness: 0.15,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
  });
}

/**
 * Polished gold for the accent rule. The studio is near-black, so pure metal
 * would mostly mirror darkness and turn brown; a low self-glow in the same
 * gold keeps the brand colour recognisable, and the light strips add the
 * metallic highlights on top.
 */
export function createGoldMaterial(color: Color): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color,
    metalness: 1,
    roughness: 0.28,
    emissive: color.clone(),
    emissiveIntensity: GOLD_EMISSIVE,
  });
}

export function createMarkMaterial(role: MarkRole, color: Color): MeshStandardMaterial {
  const material = role === "accent" ? createGoldMaterial(color) : createLacquerMaterial(color);
  material.userData.role = role;
  material.userData.baseColor = color.clone();
  material.userData.mutedColor = mutedColorOf(color);
  return material;
}

/** Same "receded" colour as the flat logos: luminance grey, 45% toward the background. */
function mutedColorOf(color: Color): Color {
  const luminance = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
  return new Color(luminance, luminance, luminance).lerp(new Color(theme.background), 0.45);
}

/**
 * 0 = brand colours, 1 = muted (another logo is being chosen). Black lacquer
 * in the dark studio receives almost no light, so changing its base colour
 * would barely show; the muted colour is added as self-glow (emissive)
 * instead, and the gold's colour and glow fade toward it.
 */
export function setMarkMute(material: MeshStandardMaterial, amount: number): void {
  const base = material.userData.baseColor as Color | undefined;
  const muted = material.userData.mutedColor as Color | undefined;
  if (!base || !muted) return;
  if (material.userData.role === "accent") {
    material.color.copy(base).lerp(muted, amount);
    material.emissive.copy(base).lerp(muted, amount);
  } else {
    material.emissive.copy(muted).multiplyScalar(amount);
  }
}

/**
 * 0 = full studio look (reflections), 1 = flat brand colours exactly like the
 * SVG: no environment reflections, so lacquer is pure base black and the gold
 * is pure emissive brand gold. Used while the logo docks, so the 3D logo is
 * indistinguishable from the DOM header logo at the hand-off.
 *
 * three.js only applies `envMapIntensity` to a material's OWN envMap, not to
 * scene.environment, so the studio map is assigned to the material directly
 * (same texture, no extra cost) to make the per-material fade work.
 */
export function setMarkFlatness(
  material: MeshStandardMaterial,
  flatness: number,
  environment: Texture | null,
): void {
  if (material.envMap !== environment) {
    material.envMap = environment;
    material.needsUpdate = true;
  }
  material.envMapIntensity = 1 - flatness;
  if (material.userData.role === "accent") {
    material.emissiveIntensity = GOLD_EMISSIVE + (1 - GOLD_EMISSIVE) * flatness;
  }
}
