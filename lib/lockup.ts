/**
 * Layout of the stacked Studios lockup (B mark above the wordmark), taken from
 * the official flat logo public/brand/babu-studios.svg so the 3D version is
 * proportioned exactly like it. Values are SVG user units (viewBox 0 0 1254).
 *
 *   B mark      x 373–896, y 105–775
 *   gap         y 775–857
 *   wordmark    x 392–871, y 857–1125  ("Babu", gold rule, "STUDIOS")
 *
 * The 3D parts were built from the same artwork: their aspect ratios match
 * (B 0.783 vs 523/670; wordmark 1.787 vs 479/268).
 */
const SVG = {
  mark: { left: 373, right: 896, top: 105, bottom: 775 },
  wordmark: { left: 392, right: 871, top: 857, bottom: 1125 },
} as const;

const top = SVG.mark.top;
const bottom = SVG.wordmark.bottom;
const left = Math.min(SVG.mark.left, SVG.wordmark.left);
const right = Math.max(SVG.mark.right, SVG.wordmark.right);
const height = bottom - top;
const centerX = (left + right) / 2;
const centerY = (top + bottom) / 2;

interface Slot {
  /** Height as a fraction of the whole lockup height. */
  height: number;
  /** Centre position in lockup units (lockup height = 1, centred on 0, y up). */
  x: number;
  y: number;
}

/** Converts an SVG box into a slot in normalised, y-up lockup space. */
function slot(box: { left: number; right: number; top: number; bottom: number }): Slot {
  return {
    height: (box.bottom - box.top) / height,
    x: ((box.left + box.right) / 2 - centerX) / height,
    // SVG y grows downward; flip so positive y is up.
    y: (centerY - (box.top + box.bottom) / 2) / height,
  };
}

/** The lockup's bounding box in the SVG, as an SVG viewBox (crops the 1254² canvas). */
export const STUDIOS_LOCKUP_VIEWBOX = `${left} ${top} ${right - left} ${height}`;

/** The B mark alone (the header logo), as an SVG viewBox, and its aspect. */
export const STUDIOS_MARK_VIEWBOX = `${SVG.mark.left} ${SVG.mark.top} ${SVG.mark.right - SVG.mark.left} ${SVG.mark.bottom - SVG.mark.top}`;
export const STUDIOS_MARK_ASPECT = (SVG.mark.right - SVG.mark.left) / (SVG.mark.bottom - SVG.mark.top);

/** The wordmark alone ("Babu" / rule / "STUDIOS"), as an SVG box in the 1254² canvas. */
export const STUDIOS_WORDMARK_BOX = {
  x: SVG.wordmark.left,
  y: SVG.wordmark.top,
  width: SVG.wordmark.right - SVG.wordmark.left,
  height: SVG.wordmark.bottom - SVG.wordmark.top,
} as const;

export const STUDIOS_LOCKUP = {
  /** width / height of the whole stacked lockup (≈ 0.513). */
  aspect: (right - left) / height,
  mark: slot(SVG.mark),
  wordmark: slot(SVG.wordmark),
} as const;
