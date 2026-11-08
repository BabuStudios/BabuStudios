/**
 * Geometry of the docked header logo, shared by the DOM header (DockedLogo)
 * and the 3D logo that flies into its place, so the two line up to the pixel
 * at the hand-off. No three.js import: the DOM side uses it too.
 */

export interface DockMetrics {
  /** Distance from the top of the viewport, CSS px. */
  top: number;
  /** Height of the header logo, which is the B mark alone (user decision), CSS px. */
  height: number;
}

export function dockMetrics(viewportWidth: number): DockMetrics {
  // Sits below the MenuBar (globals.css .menu-bar), with air between them.
  return viewportWidth < 640 ? { top: 64, height: 64 } : { top: 96, height: 84 };
}

/**
 * Compact header logo, used inside vertically scrolling worlds once the page
 * has scrolled (DOM only; the 3D logo never docks there).
 */
export function compactDockMetrics(viewportWidth: number): DockMetrics {
  return viewportWidth < 640 ? { top: 50, height: 44 } : { top: 72, height: 52 };
}

/**
 * How far in front of the camera the docked 3D logo sits. Close enough that
 * fog is negligible there (visibility exp(-(0.055 * 1.5)^2) ≈ 0.993), far
 * enough from the near plane (0.1).
 */
export const DOCK_DISTANCE = 1.5;

export interface DockedPose {
  /** Position in camera space (camera looks down -Z). */
  x: number;
  y: number;
  z: number;
  /** Lockup height in world units at that distance. */
  height: number;
}

/**
 * Camera-space pose that projects exactly onto the DOM header logo.
 *
 * At distance d a perspective camera sees a height of 2·d·tan(fov/2). The DOM
 * logo is `height` px of a `viewportHeight` px viewport, so in world units it
 * is (height / viewportHeight) · 2·d·tan(fov/2). Its centre sits at
 * top + height/2 px, i.e. NDC y = 1 − 2·(top + height/2) / viewportHeight,
 * which is y = ndc · d·tan(fov/2) in camera space. It is centred horizontally.
 */
export function dockedPose(fovDeg: number, viewportWidth: number, viewportHeight: number): DockedPose {
  const { top, height } = dockMetrics(viewportWidth);
  const halfHeight = DOCK_DISTANCE * Math.tan((fovDeg * Math.PI) / 360);
  const ndcY = 1 - (2 * (top + height / 2)) / viewportHeight;
  return {
    x: 0,
    y: ndcY * halfHeight,
    z: -DOCK_DISTANCE,
    height: (height / viewportHeight) * 2 * halfHeight,
  };
}
