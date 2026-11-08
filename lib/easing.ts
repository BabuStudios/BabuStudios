/** Easing curves. Expo/quart only: nothing linear, nothing bouncy. */

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

export const easeOutExpo = (t: number): number => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

export const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

export const easeInOutQuart = (t: number): number =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const easeInCubic = (t: number): number => t * t * t;

/** Hermite smoothstep between edges a and b. */
export const smoothstep = (a: number, b: number, x: number): number => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
