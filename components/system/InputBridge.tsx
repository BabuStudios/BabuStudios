"use client";

import { useEffect } from "react";
import { useExperience } from "@/store/useExperience";

/**
 * Writes pointer position (NDC) and the reduced-motion preference into the
 * store. The scene reads them in useFrame; nothing re-renders per move.
 */
export function InputBridge() {
  useEffect(() => {
    const { setPointer, setReducedMotion } = useExperience.getState();

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return; // touch has no hover: no cursor parallax
      setPointer((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
    };
    // Recentre when the cursor leaves the window; consumers damp toward it.
    const onLeave = () => setPointer(0, 0);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => setReducedMotion(motionQuery.matches);
    onMotionChange();

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    motionQuery.addEventListener("change", onMotionChange);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, []);

  return null;
}
