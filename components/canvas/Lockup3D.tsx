"use client";

import type { BrandPalette } from "@/content/brands";
import { STUDIOS_LOCKUP } from "@/lib/lockup";
import { Mark3D, useMarkGeometry } from "./Mark3D";

interface Lockup3DProps {
  markUrl: string;
  wordmarkUrl: string;
  /** Height of the whole stacked lockup in world units. */
  height: number;
  palette: BrandPalette;
  /** Passed to both parts (see Mark3D). */
  flatness?: () => number;
  /** Read every frame: opacity of the wordmark only. */
  wordmarkOpacity?: () => number;
  /** False: draw the B alone (the hub renders its wordmark as a separate traveller). */
  showWordmark?: boolean;
}

/**
 * The stacked Studios lockup in 3D: the B mark above the wordmark, positioned
 * exactly like the flat SVG logo (see lib/lockup.ts).
 *
 * The two models have different extrusion depths (B 12%, wordmark 7% of their
 * own heights) and both are centred on z = 0. Each is pushed back by half its
 * depth so their FRONT faces share the plane z = 0 and read as one object.
 */
export function Lockup3D({
  markUrl,
  wordmarkUrl,
  height,
  palette,
  flatness,
  wordmarkOpacity,
  showWordmark = true,
}: Lockup3DProps) {
  const mark = useMarkGeometry(markUrl);
  const wordmark = useMarkGeometry(wordmarkUrl);
  const { mark: markSlot, wordmark: wordSlot } = STUDIOS_LOCKUP;
  const markHeight = height * markSlot.height;
  const wordHeight = height * wordSlot.height;

  return (
    <group>
      <group position={[markSlot.x * height, markSlot.y * height, (-mark.depth * markHeight) / 2]}>
        <Mark3D url={markUrl} height={markHeight} palette={palette} flatness={flatness} />
      </group>
      {showWordmark && (
        <group position={[wordSlot.x * height, wordSlot.y * height, (-wordmark.depth * wordHeight) / 2]}>
          <Mark3D
            url={wordmarkUrl}
            height={wordHeight}
            palette={palette}
            flatness={flatness}
            opacity={wordmarkOpacity}
          />
        </group>
      )}
    </group>
  );
}
