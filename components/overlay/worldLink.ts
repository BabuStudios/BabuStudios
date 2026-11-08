import type { MouseEvent } from "react";
import { useExperience, type WorldId } from "@/store/useExperience";

/**
 * Click handler for links into a world. A plain click starts the fly
 * transition (which updates the URL itself); modified clicks (new tab/window,
 * middle button) keep the browser's default behaviour.
 */
export function onWorldLinkClick(event: MouseEvent<HTMLAnchorElement>, world: WorldId): void {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  useExperience.getState().requestWorld(world);
}
