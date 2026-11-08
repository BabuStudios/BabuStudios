import type { BrandId } from "@/content/brands";
import { STUDIOS_WORDMARK_BOX } from "./lockup";

/**
 * Crops of the flat brand SVGs for the static (no-WebGL) fallback: each
 * file's artboard and the box its wordmark occupies, in SVG units (measured
 * from the artwork's path bounds, plus a little padding).
 *
 * All four wordmarks are drawn at the same scale and are ≈ 242 units tall, so
 * rendering every crop at one CSS height keeps "Babu" the same size, the same
 * rule the 3D row follows. Studios uses its lockup's wordmark (no B).
 */
export interface FlatLogoCrop {
  canvas: { width: number; height: number };
  box: { x: number; y: number; width: number; height: number };
}

const PAD = 6;
const pad = (box: FlatLogoCrop["box"]) => ({
  x: box.x - PAD,
  y: box.y - PAD,
  width: box.width + PAD * 2,
  height: box.height + PAD * 2,
});

export const FLAT_LOGO_CROPS: Record<BrandId, FlatLogoCrop> = {
  life: {
    canvas: { width: 987, height: 331 },
    box: pad({ x: 279.5, y: 32.2, width: 430.4, height: 243.1 }),
  },
  entertainment: {
    canvas: { width: 1600, height: 900 },
    box: pad({ x: 392.9, y: 316.6, width: 814.9, height: 242.2 }),
  },
  business: {
    canvas: { width: 1600, height: 900 },
    box: pad({ x: 567.9, y: 316.6, width: 463.3, height: 242.2 }),
  },
  // The Studios wordmark is 268 units tall with slightly larger letters; scale
  // it to the shared 242-unit height so "Babu" lines up with its siblings.
  studios: {
    canvas: { width: 1254, height: 1254 },
    box: pad(STUDIOS_WORDMARK_BOX),
  },
};
