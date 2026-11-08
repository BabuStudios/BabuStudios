import type { ComponentType } from "react";
import type { BrandPalette } from "@/content/brands";
import type { WorldId } from "@/store/useExperience";

/** Plain-data part of a world (safe to import from DOM components). */
export interface WorldMeta {
  id: WorldId;
  /**
   * How scrolling moves through the world:
   *  - "depth": the camera travels down its -Z path (scroll height from zLength);
   *  - "vertical": a normal page. The DOM content defines the height, and the
   *    camera slides down 1:1 with the page so 3D objects scroll with it.
   */
  scrollMode: "depth" | "vertical";
  /** Length of the world's Z corridor in world units (depth worlds: scroll height). */
  zLength: number;
  /** Camera path control points, sampled by scroll progress. */
  cameraPath: ReadonlyArray<readonly [number, number, number]>;
}

export interface WorldDefinition extends WorldMeta {
  palette: BrandPalette;
  Scene: ComponentType;
}
