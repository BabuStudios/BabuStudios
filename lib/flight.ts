import { Vector3 } from "three";

/**
 * Fly transitions (Beat 4). Time-based, two halves:
 *
 *   departure  the camera accelerates (ease-in cubic) toward the chosen logo
 *              and through it like a portal; leaving a brand world it pulls
 *              back instead. FOV pushes 45° → 60°.
 *   ── swap ── under a full beige veil: the world changes, scroll resets,
 *              the camera is re-placed for the arrival.
 *   arrival    the camera decelerates (ease-out quart) into the new world's
 *              start (or, back in the hub, out of the logo it entered by).
 *
 * Total 1.6 s. With prefers-reduced-motion the camera does not move and the
 * transition is a short veil crossfade instead.
 */
export const FLIGHT = {
  departure: 0.75,
  arrival: 0.85,
  reducedDeparture: 0.22,
  reducedArrival: 0.3,
  /** Extra vertical FOV at the peak of the flight (degrees). */
  fovPush: 15,
  /** How far past the logo the departure ends (the logo has passed the camera). */
  throughDepth: 2,
  /** Leaving a brand world: how far the camera pulls back. */
  pullBack: 7,
  /** Arriving in a brand world: how far behind its start the camera begins. */
  approach: 7,
  /** Arriving back in the hub: how far beyond the logo the camera begins. */
  reEntry: 1.5,
} as const;

/**
 * The current flight, written by TransitionDirector every frame and read by
 * CameraRig and TransitionVeil. Mutated in place (no allocations
 * per frame, no React updates).
 */
export const flight = {
  /** True while the director drives the camera. */
  active: false,
  position: new Vector3(),
  lookAt: new Vector3(),
  fov: 45,
  /** 0..1 beige veil over the scene. */
  veil: 0,
};
