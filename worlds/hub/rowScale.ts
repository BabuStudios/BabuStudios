"use client";

import { useMemo } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { brands, subBrandIds } from "@/content/brands";
import { assetUrl } from "@/lib/assets";
import { getLogoGeometry } from "@/lib/svgToMesh";
import { SUB_BRAND_LAYOUT } from "./meta";

export const subBrandUrls = subBrandIds.map((id) => assetUrl(brands[id].logo));

/**
 * Layout and scale of the hub's brand row for the current viewport. Shared by
 * the row (SubBrands) and the travelling Studios wordmark, which must land on
 * exactly the same pose.
 *
 * Shared scale: the three sub-brand SVGs are drawn at the same scale ("Babu"
 * ≈ 125 SVG units tall in each), so they use ONE units→world factor, the
 * largest at which each still fits its box (Entertainment, the widest, sets
 * it). The Studios wordmark gets the mean sub-brand height: "Babu" is ≈ 51.5%
 * of the height in every wordmark, so "Babu" matches too.
 */
export function useHubRow() {
  const size = useThree((s) => s.size);
  const portrait = size.width / size.height < SUB_BRAND_LAYOUT.stackBelowAspect;
  const layout = portrait ? SUB_BRAND_LAYOUT.stack : SUB_BRAND_LAYOUT.arc;
  const fit = portrait ? SUB_BRAND_LAYOUT.fit.stack : SUB_BRAND_LAYOUT.fit.arc;
  const svgs = useLoader(SVGLoader, subBrandUrls);
  const logos = useMemo(() => subBrandUrls.map((url, i) => getLogoGeometry(url, svgs[i])), [svgs]);
  const unit = Math.min(...logos.map((l) => Math.min(fit.width / l.width, fit.height / l.height)));
  const studiosHeight = (logos.reduce((sum, l) => sum + l.height, 0) / logos.length) * unit;
  return { layout, logos, unit, studiosHeight, portrait };
}
