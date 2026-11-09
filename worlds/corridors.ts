/**
 * Depth corridors: worlds whose content panels float along -Z and the camera
 * travels through them on scroll (Studios, and Life by user request: "ta
 * tillbaka samma scroll som det är i studios till life"). Plain data (no
 * three.js), shared by the scene (projection), the DOM (panels) and the
 * section scroller.
 *
 * Panels are 8 units apart down -Z from the intro at z = -4; the camera path
 * ends FOCUS.focus (4.5) units in front of the last one, so it settles there.
 */
import { worldText } from "@/content/worlds";
import type { WorldId } from "@/store/useExperience";
import type { WorldMeta } from "./types";

export interface SectionAnchor {
  id: string;
  /** Landscape position (portrait centres every panel: x = 0). */
  x: number;
  y: number;
  z: number;
}

const SPACING = 8;
const FIRST_Z = -4;
/** Matches FOCUS.focus in lib/focus.ts (kept here so this file has no imports from lib). */
const END_IN_FRONT = 4.5;

/** Anchors down the corridor: the intro sits under the hero logo, the rest follow every 8 units. */
function corridor(ids: string[], x: (id: string, i: number) => number = () => 0): SectionAnchor[] {
  return ids.map((id, i) => ({ id, x: x(id, i), y: i === 0 ? -0.75 : 0, z: FIRST_Z - i * SPACING }));
}

export const STUDIOS_SECTION_IDS = ["intro", "premium", "essential", "work", "process"] as const;
export type StudiosSectionId = (typeof STUDIOS_SECTION_IDS)[number];

/** Life: one panel per app (as in content/worlds.ts), then "Next" and the outro. */
export const lifeAppSectionId = (index: number) => `app-${index}`;
const LIFE_SECTION_IDS = [
  "intro",
  ...(worldText("life").page?.apps ?? []).map((_, i) => lifeAppSectionId(i)),
  "next",
  "outro",
];

export const CORRIDORS = {
  // Studios' offers alternate left / right for an editorial rhythm.
  studios: corridor([...STUDIOS_SECTION_IDS], (id) => (id === "premium" ? -1.3 : id === "essential" ? 1.3 : 0)),
  life: corridor(LIFE_SECTION_IDS),
} satisfies Record<string, SectionAnchor[]>;

export type CorridorWorld = keyof typeof CORRIDORS;

export function isCorridorWorld(world: WorldId | null | undefined): world is CorridorWorld {
  return world === "studios" || world === "life";
}

export function corridorSection(world: CorridorWorld, id: string): SectionAnchor {
  const sections = CORRIDORS[world];
  return sections.find((s) => s.id === id) ?? sections[0];
}

/**
 * Depth meta for a corridor world: the camera path ends 4.5 units in front of
 * the last panel, with small x/y offsets for a slow organic sway.
 */
export function corridorMeta(world: CorridorWorld): Pick<WorldMeta, "scrollMode" | "zLength" | "cameraPath"> {
  const sections = CORRIDORS[world];
  const end = sections[sections.length - 1].z + END_IN_FRONT;
  return {
    scrollMode: "depth",
    zLength: Math.ceil(-end),
    cameraPath: [
      [0, 0, 0],
      [0.12, 0.05, end * 0.25],
      [-0.12, 0.1, end * 0.5],
      [0.1, 0.05, end * 0.75],
      [0, 0, end],
    ],
  };
}
