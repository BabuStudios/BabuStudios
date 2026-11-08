export type Quality = "high" | "medium" | "low";

export interface QualityPreset {
  /** Instanced dust motes in the active world. */
  particles: number;
  /** Upper bound of the device pixel ratio. */
  maxDpr: number;
}

export const qualityPresets: Record<Quality, QualityPreset> = {
  // Counts scaled with the taller particle volume (±12 instead of ±7) to keep the density.
  high: { particles: 1300, maxDpr: 2 },
  medium: { particles: 760, maxDpr: 1.5 },
  low: { particles: 380, maxDpr: 1 },
};

const ladder: readonly Quality[] = ["low", "medium", "high"];

/** One step up (+1) or down (-1) the quality ladder, clamped at the ends. */
export function stepQuality(current: Quality, direction: 1 | -1): Quality {
  const i = ladder.indexOf(current) + direction;
  return ladder[Math.min(ladder.length - 1, Math.max(0, i))];
}

/** Touch-first devices (phones, tablets). */
export function isCoarsePointer(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

/** Phones start at medium; PerformanceMonitor adjusts from there. */
export function initialQuality(): Quality {
  return isCoarsePointer() ? "medium" : "high";
}

/** DPR range for the Canvas: [1, 2] on desktop, [1, 1.5] on mobile. */
export function dprRange(quality: Quality): [number, number] {
  const deviceCap = isCoarsePointer() ? 1.5 : 2;
  return [1, Math.min(deviceCap, qualityPresets[quality].maxDpr)];
}
