/** Shared scene constants (world units: 1 unit ≈ 1 metre). */

export const CAMERA_FOV = 45;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 90;

/**
 * Exponential-squared fog density. Visibility = exp(-(density * distance)^2):
 * about 95% at 4 units (the hero logo), 38% at 18 units, 2% at 36 units,
 * so the void dissolves well before the far plane.
 */
export const FOG_DENSITY = 0.055;

export const HUB = {
  /** Distance of the Studios logo in front of the camera (camera at z = 0). */
  logoZ: -4,
  /** How far behind its rest position the logo starts its entrance. */
  entranceDepth: 2.6,
} as const;

/**
 * The procedural studio that only the glossy 3D mark sees (in reflections).
 * Its backdrop is near-black, not beige: glossy black reflects ~4-8% of its
 * surroundings head-on, and without tone mapping a beige surround lifts the
 * whole face to charcoal grey. A dark studio keeps the mark truly black and
 * lets the light strips alone draw the highlights.
 */
export const STUDIO = {
  backdrop: "#0f0e0d",
  /** Emissive strengths. High, because head-on reflectance is only ~4-8%. */
  intensity: { softbox: 6, key: 8, rim: 4, horizon: 0.9, sweep: 5 },
} as const;
