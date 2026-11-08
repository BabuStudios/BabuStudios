/**
 * The Studios corridor: where each DOM panel lives in the 3D world. Plain data
 * (no three.js), shared by the scene (projection), the DOM (panels) and the
 * section scroller. Panels are 8 units apart down -Z; the camera path ends
 * 4.5 units in front of the last one (its focus distance).
 */
export type StudiosSectionId = "intro" | "premium" | "essential" | "work" | "process";

export interface SectionAnchor {
  id: StudiosSectionId;
  /** Landscape position (portrait centres every panel: x = 0). */
  x: number;
  y: number;
  z: number;
}

export const STUDIOS_SECTIONS: readonly SectionAnchor[] = [
  // Under the hero wordmark (which floats at z = -4 a little above centre).
  { id: "intro", x: 0, y: -0.75, z: -4 },
  // Offers alternate left / right for an editorial rhythm.
  { id: "premium", x: -1.3, y: 0, z: -12 },
  { id: "essential", x: 1.3, y: 0, z: -20 },
  { id: "work", x: 0, y: 0, z: -28 },
  { id: "process", x: 0, y: 0, z: -36 },
];

export function studiosSection(id: StudiosSectionId): SectionAnchor {
  return STUDIOS_SECTIONS.find((s) => s.id === id) ?? STUDIOS_SECTIONS[0];
}
