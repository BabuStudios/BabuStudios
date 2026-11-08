"use client";

import { useSyncExternalStore } from "react";
import { brands } from "@/content/brands";
import { assetUrl } from "@/lib/assets";
import { compactDockMetrics, dockMetrics } from "@/lib/dock";
import { STUDIOS_MARK_ASPECT, STUDIOS_MARK_VIEWBOX } from "@/lib/lockup";
import { copy } from "@/content/site";
import { worldHref } from "@/lib/routes";
import { useExperience } from "@/store/useExperience";
import { useCompactHeader } from "./HeaderScrim";
import { onWorldLinkClick } from "./worldLink";

const subscribeResize = (onChange: () => void) => {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
};
/** Viewport width; 1440 during SSR (desktop metrics), corrected on hydration. */
const useViewportWidth = () =>
  useSyncExternalStore(
    subscribeResize,
    () => window.innerWidth,
    () => 1440,
  );

/**
 * The persistent header logo: the crisp SVG lockup, at exactly the screen box
 * the 3D logo docks into (both read lib/dock.ts). It fades in over 150 ms when
 * the 3D logo arrives and fades out when it leaves, so the swap is invisible.
 *
 * It is always a real link, keyboard-focusable even before docking (it becomes
 * visible when focused): in the hub it flies into the Studios world, inside a
 * brand world it flies back to the hub.
 */
export function DockedLogo() {
  const docked = useExperience((s) => s.logoDocked);
  const activeWorld = useExperience((s) => s.activeWorld);
  const compact = useCompactHeader();
  const viewportWidth = useViewportWidth();
  const { top, height } = compact ? compactDockMetrics(viewportWidth) : dockMetrics(viewportWidth);
  const studios = brands.studios;
  // In the hub the logo leads into the Studios world; inside any world it
  // leads back to the hub.
  const destination = activeWorld === "hub" ? "studios" : "hub";

  return (
    <a
      href={worldHref(destination)}
      aria-label={destination === "hub" ? copy.nav.backToHub : studios.name}
      className={`docked-logo ${docked ? "docked-logo--docked" : ""}`}
      style={{ top, height, width: height * STUDIOS_MARK_ASPECT }}
      onClick={(event) => onWorldLinkClick(event, destination)}
    >
      {/* The header shows the B alone: the viewBox crops the logo's 1254²
          canvas to the B, so the element's box is exactly the box the 3D B
          docks into. */}
      <svg viewBox={STUDIOS_MARK_VIEWBOX} width="100%" height="100%" aria-hidden="true">
        <image href={assetUrl(studios.logo)} x="0" y="0" width="1254" height="1254" />
      </svg>
    </a>
  );
}
