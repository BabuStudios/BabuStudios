/**
 * Hub world metadata. Plain data with no three.js imports, so DOM components
 * (scroll height) can read it without pulling the 3D chunk.
 */
import type { HubBrandId } from "@/store/useExperience";
import type { WorldMeta } from "../types";

export interface Placement {
  x: number;
  y: number;
  z: number;
}

export const hubMeta: WorldMeta = {
  id: "hub",
  scrollMode: "depth",
  zLength: 12,
  /**
   * Camera path (CatmullRom through these points, sampled by scroll progress).
   * The small x/y offsets give the dolly a slight organic drift instead of a
   * rail-straight push. It ends 6.5 units in front of the sub-brand logos.
   */
  cameraPath: [
    [0, 0, 0],
    [0.12, 0.04, -1.4],
    [-0.08, 0.1, -3],
    [0, 0.05, -4.5],
  ],
};

/** Where the hub's brand logos settle (world space) and how they arrive. */
export const SUB_BRAND_LAYOUT = {
  /**
   * Landscape (user layout): Life, Studios and Business on one line, the
   * Studios wordmark in the middle; Entertainment centred below the line.
   * All at the same depth so every "Babu" renders at exactly the same size.
   */
  arc: {
    life: { x: -2.7, y: 0.3, z: -10.9 },
    // Raised a little above its neighbours (user request: "lyft babu studios
    // textloggan något"); at y 0.3 it read slightly low in perspective.
    studios: { x: 0, y: 0.45, z: -10.9 },
    business: { x: 2.7, y: 0.3, z: -10.9 },
    entertainment: { x: 0, y: -0.95, z: -10.9 },
  } satisfies Record<HubBrandId, Placement>,
  /**
   * Portrait: a vertical stack, Studios on top, 1.13 units apart (the top
   * item clears the docked header B, the bottom one the viewport edge).
   */
  stack: {
    studios: { x: 0, y: 1.4, z: -11 },
    life: { x: 0, y: 0.27, z: -11 },
    entertainment: { x: 0, y: -0.86, z: -11 },
    business: { x: 0, y: -1.99, z: -11 },
  } satisfies Record<HubBrandId, Placement>,
  /** Viewport aspect (w/h) below which the stack is used. */
  stackBelowAspect: 0.85,
  /**
   * Every logo must fit this box (world units); all share one scale (see
   * SubBrands), so the widest one, Entertainment (3.4:1), sets it.
   */
  fit: { arc: { width: 2.1, height: 0.95 }, stack: { width: 1.9, height: 0.78 } },
  /** Logos rise from this far behind and below their rest position. */
  rise: { y: -1.2, z: -18 },
  /** Hover: the hovered logo drifts toward the camera, the others recede. */
  hover: { lift: 0.6, recede: -0.35 },
} as const;

/** Scroll height of a world: its z-length × this many viewport heights per unit. */
export const SCROLL_VH_PER_UNIT = 25;

/** Rest position of a hub brand logo (world space) for a viewport aspect (w/h). */
export function hubBrandRestPosition(id: HubBrandId, viewportAspect: number): Placement {
  const layout = viewportAspect < SUB_BRAND_LAYOUT.stackBelowAspect ? SUB_BRAND_LAYOUT.stack : SUB_BRAND_LAYOUT.arc;
  return layout[id];
}
