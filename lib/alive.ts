/**
 * The shared "alive" motion language: slow sine breathing, never bouncy.
 * Pure functions so a shadow, label, etc. can follow the same float as its logo.
 */

const TAU = Math.PI * 2;

export interface AliveParams {
  /** Seconds per float cycle (brief: 4–6 s). */
  period: number;
  /** Vertical float amplitude, in world units. */
  amplitude: number;
  /** Micro-scale amplitude (0.008 = ±0.8%). */
  breath: number;
  /** Phase offset in seconds, so several logos float out of phase. */
  phase: number;
}

export const defaultAlive: AliveParams = {
  period: 5.2,
  amplitude: 0.055,
  breath: 0.008,
  phase: 0,
};

/** Vertical offset at time t (seconds). */
export function floatOffset(t: number, p: AliveParams): number {
  return Math.sin(((t + p.phase) * TAU) / p.period) * p.amplitude;
}

/**
 * Uniform scale at time t. Phase-shifted ~50° from the float so the logo
 * "inhales" slightly before it reaches the top of its rise.
 */
export function breathScale(t: number, p: AliveParams): number {
  return 1 + Math.sin(((t + p.phase) * TAU) / p.period + 0.9) * p.breath;
}
