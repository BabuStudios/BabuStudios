"use client";

import { useEffect, useRef } from "react";
import { brands, hubBrandIds } from "@/content/brands";
import { copy } from "@/content/site";
import { HUB_TIMELINE } from "@/lib/hubTimeline";
import { type HubBrandId, useExperience } from "@/store/useExperience";
import { FlatLogo } from "./FlatLogo";
import { onWorldLinkClick } from "./worldLink";

/**
 * The DOM side of the three sub-brand logos: one real link per logo, with its
 * label underneath. The 3D scene publishes each logo's screen box every frame
 * (store `anchors`); this component's own rAF loop moves the links onto those
 * boxes, so the hit area, focus ring and label always sit on the 3D logo.
 *
 * Hover and focus are handled here (not by raycasting), so mouse, keyboard
 * and touch share one code path.
 *
 * In the static fallback there is no scene: the links drop the tracking and
 * become a plain grid of flat logos (CSS, `html[data-render="fallback"]`).
 */
export function BrandLinks() {
  const links = useRef<Partial<Record<HubBrandId, HTMLAnchorElement>>>({});
  const lastPointer = useRef("");
  const tracking = useExperience((s) => s.renderMode === "webgl");

  useEffect(() => {
    if (!tracking) {
      // Clear what the loop wrote (the renderer may just have failed).
      for (const el of Object.values(links.current)) el?.removeAttribute("style");
      return;
    }
    let raf = 0;
    const tick = () => {
      const { anchors } = useExperience.getState();
      for (const id of hubBrandIds) {
        const el = links.current[id];
        if (!el) continue;
        const a = anchors[id];
        el.style.transform = `translate3d(${(a.x - a.width / 2).toFixed(1)}px, ${(a.y - a.height / 2).toFixed(1)}px, 0)`;
        el.style.width = `${a.width.toFixed(1)}px`;
        el.style.height = `${a.height.toFixed(1)}px`;
        el.style.setProperty("--reveal", a.opacity.toFixed(3));
        // Clickable only once mostly revealed. It stays focusable throughout:
        // focusing it scrolls the hub to the point where it is revealed.
        el.style.pointerEvents = a.opacity > 0.6 ? "auto" : "none";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [tracking]);

  const hover = (id: HubBrandId | null) => useExperience.getState().setHoveredBrand(id);

  const onFocus = (id: HubBrandId) => {
    hover(id);
    const { scrollProgress, scrollTo, renderMode } = useExperience.getState();
    if (renderMode === "webgl" && scrollProgress < HUB_TIMELINE.rest) scrollTo?.(HUB_TIMELINE.rest);
  };

  return (
    <nav className="brand-links" aria-label={copy.hub.brandNavLabel}>
      <ul>
        {hubBrandIds.map((id) => {
          const brand = brands[id];
          return (
            <li key={id}>
              <a
                ref={(el) => {
                  if (el) links.current[id] = el;
                  else delete links.current[id];
                }}
                href={brand.href}
                aria-label={brand.name}
                className="brand-link"
                onPointerDown={(event) => {
                  lastPointer.current = event.pointerType;
                }}
                onPointerEnter={(event) => event.pointerType !== "touch" && hover(id)}
                onPointerLeave={(event) => event.pointerType !== "touch" && hover(null)}
                onFocus={() => onFocus(id)}
                onBlur={() => hover(null)}
                onClick={(event) => {
                  // Touch has no hover: the first tap previews the logo (lifts
                  // it, mutes the others), the second tap flies in. Mouse
                  // clicks and Enter fly in directly.
                  const isTouch = lastPointer.current === "touch";
                  lastPointer.current = "";
                  if (isTouch && useExperience.getState().hoveredBrand !== id) {
                    event.preventDefault();
                    hover(id);
                    return;
                  }
                  onWorldLinkClick(event, id);
                }}
              >
                <FlatLogo id={id} />
                {/* Real logos spell the brand name, so only placeholder marks get
                    a visible label; the link's aria-label names it either way. */}
                {brand.placeholder && <span className="brand-link__label label-caps">{brand.label}</span>}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
