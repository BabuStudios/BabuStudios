import { type BrandId, brands } from "@/content/brands";
import { assetUrl } from "@/lib/assets";
import { FLAT_LOGO_CROPS } from "@/lib/flatLogos";

/**
 * A brand's flat SVG wordmark, cropped to its artwork (lib/flatLogos.ts).
 * It stands in for the 3D logo in the static fallback and is hidden otherwise
 * (CSS keyed on `html[data-render]`, so it is laid out from the first paint);
 * decorative, since the surrounding link or heading carries the name.
 */
export function FlatLogo({ id, className }: { id: BrandId; className?: string }) {
  const { canvas, box } = FLAT_LOGO_CROPS[id];
  return (
    <svg
      className={`flat-logo ${className ?? ""}`}
      viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
      style={{ aspectRatio: `${box.width} / ${box.height}` }}
      aria-hidden="true"
      focusable="false"
    >
      <image href={assetUrl(brands[id].logo)} width={canvas.width} height={canvas.height} />
    </svg>
  );
}
