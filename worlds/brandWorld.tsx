"use client";

import { useMemo } from "react";
import { MathUtils } from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { useLoader, useThree } from "@react-three/fiber";
import { AliveGroup } from "@/components/canvas/AliveGroup";
import { FloatShadow } from "@/components/canvas/FloatShadow";
import { Logo3D } from "@/components/canvas/Logo3D";
import { Mark3D, useMarkGeometry } from "@/components/canvas/Mark3D";
import { type BrandId, brands, subBrandIds } from "@/content/brands";
import { defaultAlive } from "@/lib/alive";
import { assetUrl } from "@/lib/assets";
import { CAMERA_FOV } from "@/lib/scene";
import { getLogoGeometry } from "@/lib/svgToMesh";
import { brandWorldMeta, CONTENT_PLANE_DISTANCE } from "./brandMeta";
import { isCorridorWorld } from "./corridors";
import { SectionProjector } from "./SectionProjector";
import type { WorldDefinition } from "./types";

/** The hero logo sits on the world's content plane. */
const HERO_Z = -CONTENT_PLANE_DISTANCE;

/**
 * Hero framing (fractions of the visible frame at the hero's distance). The
 * logo sits between the docked header logo (ends ~23% from the top) and the
 * intro text (starts ~60%): centred 41% from the top, at most 18% of the
 * height for the wordmarks (Studios included).
 */
const HERO_FRAME = {
  centreFromTop: 0.41,
  wordmarkHeight: 0.18,
  /** Max width: landscape / portrait (portrait gets more so names stay legible). */
  width: { landscape: 0.36, portrait: 0.7 },
} as const;

/** Visible frame at the hero's distance from the corridor start (camera at z = 0). */
function useHeroFrame() {
  const size = useThree((s) => s.size);
  const height = 2 * Math.abs(HERO_Z) * Math.tan(MathUtils.degToRad(CAMERA_FOV) / 2);
  const aspect = size.width / size.height;
  const width = height * aspect;
  return {
    height,
    maxWidth: width * (aspect < 0.85 ? HERO_FRAME.width.portrait : HERO_FRAME.width.landscape),
    // World-space y of the hero centre: (50% − centreFromTop) of the frame above the middle.
    y: (0.5 - HERO_FRAME.centreFromTop) * height,
  };
}

const wordmarkUrls = subBrandIds.map((id) => assetUrl(brands[id].logo));

/**
 * The shared wordmark scale. Like in the hub, the sub-brand wordmarks share
 * one SVG-units→world factor (they are drawn at the same scale), so "Babu" is
 * the same size in every world; the widest (Entertainment) sets it.
 */
function useWordmarkScale() {
  const svgs = useLoader(SVGLoader, wordmarkUrls);
  const logos = useMemo(() => wordmarkUrls.map((u, i) => getLogoGeometry(u, svgs[i])), [svgs]);
  const frame = useHeroFrame();
  const maxHeight = frame.height * HERO_FRAME.wordmarkHeight;
  const unit = Math.min(...logos.map((l) => Math.min(frame.maxWidth / l.width, maxHeight / l.height)));
  return { logos, unit, frame };
}

/** A sub-brand's flat SVG wordmark, in the palette tokens. */
function WordmarkHero({ id }: { id: BrandId }) {
  const url = assetUrl(brands[id].logo);
  const { logos, unit, frame } = useWordmarkScale();
  const logo = logos[wordmarkUrls.indexOf(url)] ?? logos[0];
  const aspect = logo.aspect;
  const height = logo.height * unit;
  return (
    <group position-y={frame.y}>
      <AliveGroup params={defaultAlive}>
        <Logo3D url={url} height={height} palette={brands[id].palette} />
      </AliveGroup>
      <FloatShadow y={-height * 0.85} width={height * aspect * 0.9} params={defaultAlive} />
    </group>
  );
}

/**
 * The Studios world shows its 3D wordmark ("Babu" / rule / STUDIOS) at the
 * same size as the other worlds' wordmarks; the B lives in the header. "Babu"
 * takes the same share of the height in every wordmark (≈ 51.5%: 28.8/55.9 in
 * the Studios model, ~125/242 in the SVGs), so equal heights give an equal
 * "Babu". The reference height is the mean of the sub-brand wordmarks.
 */
function StudiosWordmarkHero({ url }: { url: string }) {
  const { aspect } = useMarkGeometry(url);
  const { logos, unit, frame } = useWordmarkScale();
  const height = (logos.reduce((sum, l) => sum + l.height, 0) / logos.length) * unit;
  return (
    <group position-y={frame.y}>
      <AliveGroup params={defaultAlive}>
        <Mark3D url={url} height={height} palette={brands.studios.palette} />
      </AliveGroup>
      <FloatShadow y={-height * 0.85} width={height * aspect * 0.9} params={defaultAlive} />
    </group>
  );
}

/** A brand world (Phase 3 template): the brand's logo waiting at the start of its corridor. */
function BrandWorldScene({ id }: { id: BrandId }) {
  const studiosWordmark = id === "studios" ? brands.studios.logo3d?.wordmark : undefined;
  return (
    <>
      <group position={[0, 0, HERO_Z]}>
        {studiosWordmark ? <StudiosWordmarkHero url={assetUrl(studiosWordmark)} /> : <WordmarkHero id={id} />}
      </group>
      {isCorridorWorld(id) && <SectionProjector corridor={id} />}
    </>
  );
}

export function createBrandWorld(id: BrandId, Scene: () => React.JSX.Element): WorldDefinition {
  return { ...brandWorldMeta(id), palette: brands[id].palette, Scene };
}

export { BrandWorldScene };
