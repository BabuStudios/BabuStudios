import { smoothstep } from "./easing";

/**
 * Depth-of-field for DOM panels placed along the Z corridor (Studios). Given a
 * panel's view-space depth (units in front of the camera):
 *
 *  - scale: perspective, 1 at `reference` units (the panel's design size);
 *  - opacity: invisible beyond 13 units, full by 6, then it fades out again
 *    between 2.6 and 1.0 units as the camera passes through. Panels are 8
 *    units apart, so while one is in focus (4.5) the next (12.5) is almost
 *    invisible instead of ghosting through it; they cross-fade as you move;
 *  - blur (px): sharp within ±1.2 units of the focus distance, then +1.1 px
 *    per unit, capped at 10 px.
 */
export const FOCUS = {
  reference: 4,
  focus: 4.5,
  far: { hidden: 13, full: 6 },
  near: { hidden: 1.0, full: 2.6 },
  deadZone: 1.2,
  blurPerUnit: 1.1,
  maxBlur: 10,
} as const;

export interface PanelLook {
  scale: number;
  opacity: number;
  blur: number;
}

export function panelLook(depth: number, reducedMotion = false): PanelLook {
  const d = Math.max(depth, 0.01);
  const opacity =
    smoothstep(FOCUS.far.hidden, FOCUS.far.full, d) * smoothstep(FOCUS.near.hidden, FOCUS.near.full, d);
  const blur = reducedMotion
    ? 0
    : Math.min(FOCUS.maxBlur, Math.max(0, Math.abs(d - FOCUS.focus) - FOCUS.deadZone) * FOCUS.blurPerUnit);
  return { scale: FOCUS.reference / Math.max(d, 0.5), opacity, blur };
}
