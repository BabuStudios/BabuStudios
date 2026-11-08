import { copy } from "@/content/site";
import { hubMeta, SCROLL_VH_PER_UNIT } from "@/worlds/hub/meta";
import { BrandLinks } from "./BrandLinks";
import { ScrollCue } from "./ScrollCue";

/**
 * DOM layer of the hub. The logos themselves are in WebGL; the heading, intro
 * and brand links live here (crisp, accessible, indexable). The main element's
 * height is the hub's scroll length, derived from the world's z-length.
 */
export function HubOverlay() {
  return (
    <>
      {/* `hub-main`: the static fallback drops the scroll length and shows the intro. */}
      <main id="main" className="hub-main" style={{ height: `${hubMeta.zLength * SCROLL_VH_PER_UNIT}vh` }}>
        <h1 className="sr-only">{copy.hub.heading}</h1>
        <p className="sr-only hub-intro">{copy.hub.intro}</p>
        <BrandLinks />
      </main>
      <ScrollCue />
    </>
  );
}
