/**
 * Brand world metadata. Plain data with no three.js imports, so DOM components
 * can read it.
 */
import type { BrandId } from "@/content/brands";
import { type PageWorldId, pageWorldIds } from "@/content/pages";
import type { WorldId } from "@/store/useExperience";
import type { WorldMeta } from "./types";

/**
 * Distance from the camera to the plane of a brand world's content (the hero
 * logo). In vertical worlds the camera slides down so that this plane moves
 * exactly with the page: one CSS pixel of scroll = (visible height at this
 * distance) / (viewport height in px) world units.
 */
export const CONTENT_PLANE_DISTANCE = 4;

/**
 * Life, Entertainment and Business are normal vertically scrolling pages once
 * you have flown in (user decision), and so are the page worlds (Contact,
 * Policies). Studios keeps the
 * depth corridor.
 */
const VERTICAL_WORLDS: readonly WorldId[] = ["life", "entertainment", "business", ...pageWorldIds];

/** The entry pose of a vertical world (only the first point is used). */
const VERTICAL_PATH: WorldMeta["cameraPath"] = [
  [0, 0, 0],
  [0.1, 0.05, -5],
  [-0.1, 0.1, -10],
  [0, 0.05, -14],
];

export function brandWorldMeta(id: BrandId): WorldMeta {
  if (id === "studios") {
    return {
      id,
      scrollMode: "depth",
      // The corridor (worlds/studios/sections.ts): panels every 8 units to
      // z = -36 (Process); the path ends 4.5 units in front of the last one.
      // The small x/y offsets give the long dolly a slow organic sway.
      zLength: 32,
      cameraPath: [
        [0, 0, 0],
        [0.12, 0.05, -8],
        [-0.12, 0.1, -16],
        [0.1, 0.05, -24],
        [0, 0, -31.5],
      ],
    };
  }
  return {
    id,
    scrollMode: VERTICAL_WORLDS.includes(id) ? "vertical" : "depth",
    zLength: 16,
    // Depth worlds: down -Z with the same gentle drift as the hub. Vertical
    // worlds only use the first point (the entry pose).
    cameraPath: VERTICAL_PATH,
  };
}

/** A page world (Contact, Policies): a vertical world with no hero logo. */
export const pageWorldMeta = (id: PageWorldId): WorldMeta => ({
  id,
  scrollMode: "vertical",
  zLength: 16,
  cameraPath: VERTICAL_PATH,
});

/** True for worlds that scroll as a normal page. */
export function isVerticalWorld(world: WorldId): boolean {
  return VERTICAL_WORLDS.includes(world);
}
