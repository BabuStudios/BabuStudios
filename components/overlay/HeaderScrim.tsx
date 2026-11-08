"use client";

import { useExperience } from "@/store/useExperience";
import { isVerticalWorld } from "@/worlds/brandMeta";

/** Threshold (CSS px) after which a vertical world's header compacts. */
export const COMPACT_AFTER_PX = 24;

/** True when the header should be compact (a normally scrolling page, scrolled). */
export const useCompactHeader = () =>
  useExperience(
    (s) =>
      (isVerticalWorld(s.activeWorld) || s.renderMode === "fallback") &&
      s.transitionState === "idle" &&
      s.scrollY > COMPACT_AFTER_PX,
  );

/**
 * A soft beige band behind the fixed header in vertically scrolling worlds
 * (every page in the static fallback),
 * so page content passing underneath never collides with the menu or logo.
 */
export function HeaderScrim() {
  const compact = useCompactHeader();
  return <div aria-hidden="true" className={`header-scrim ${compact ? "header-scrim--visible" : ""}`} />;
}
