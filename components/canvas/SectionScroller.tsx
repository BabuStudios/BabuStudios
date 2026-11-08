"use client";

import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { FOCUS } from "@/lib/focus";
import { cameraPointAt } from "@/lib/paths";
import { useExperience } from "@/store/useExperience";
import { type StudiosSectionId, studiosSection } from "@/worlds/studios/sections";

const point = new Vector3();

/**
 * Finds the scroll progress at which the camera sits FOCUS.focus units in
 * front of a section's z. The path runs monotonically down -Z, so a binary
 * search on progress (arc-length parameterised) converges in a few steps.
 */
function progressForZ(targetZ: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    cameraPointAt("studios", mid, point);
    if (point.z > targetZ) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Performs `goToSection` once its world is active and no flight is running:
 * smooth-scrolls the corridor to the section (Studios → contact from the menu).
 */
export function SectionScroller() {
  useFrame(() => {
    const { pendingSection, transitionState, activeWorld, scrollTo, clearPendingSection } = useExperience.getState();
    if (!pendingSection || transitionState !== "idle" || activeWorld !== pendingSection.world || !scrollTo) return;
    clearPendingSection();
    if (pendingSection.world !== "studios") return;
    const section = studiosSection(pendingSection.id as StudiosSectionId);
    scrollTo(progressForZ(section.z + FOCUS.focus));
  });
  return null;
}
