"use client";

import { useEffect } from "react";
import { useExperience } from "@/store/useExperience";

/** How long the page content fades out before the world swaps (matches `.world-content[data-flying]`). */
const FADE_MS = 260;

/**
 * The fallback's stand-in for the 3D TransitionDirector: the same store
 * contract (requestWorld → navigate → swap → endTransition), but the "flight"
 * is a short fade of the page content, and every page starts at the top.
 * It also resolves `goToSection` by scrolling to the section's DOM element.
 */
export function FallbackDirector() {
  useEffect(() => {
    const timers: number[] = [];
    let running = false;

    const scrollToSection = () => {
      const s = useExperience.getState();
      const pending = s.pendingSection;
      if (!pending || pending.world !== s.activeWorld || !s.scrollTo) return;
      // Hidden routes (Next keeps them alive with display: none) have no offsetParent.
      const el = [...document.querySelectorAll<HTMLElement>(`[data-section="${pending.id}"]`)].find(
        (node) => node.offsetParent !== null,
      );
      s.clearPendingSection();
      if (!el) return;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      // Land the section a little below the fixed header.
      const top = el.getBoundingClientRect().top + window.scrollY - 140;
      s.scrollTo(Math.min(1, Math.max(0, top / max)));
    };

    const run = () => {
      const s = useExperience.getState();
      if (s.transitionState === "idle") {
        // Deep links have no intro without a camera.
        if (s.introPending) useExperience.setState({ introPending: false });
        // Back/forward pressed during a transition: catch up.
        if (s.urlWorld !== s.activeWorld) s.requestWorld(s.urlWorld, { fromHistory: true });
        else scrollToSection();
        return;
      }
      if (running || !s.targetWorld) return;
      running = true;
      const target = s.targetWorld;
      s.setTransitionPhase("departure");
      if (!s.flightFromHistory) s.navigate?.(target);

      timers.push(
        window.setTimeout(
          () => {
            const store = useExperience.getState();
            store.setActiveWorld(target);
            store.setTransitionPhase("arrival");
            // Let the new route lay out before resetting scroll.
            requestAnimationFrame(() => {
              useExperience.getState().scrollTo?.(0, { immediate: true });
              running = false;
              useExperience.getState().endTransition();
            });
          },
          s.reducedMotion ? 0 : FADE_MS,
        ),
      );
    };

    run();
    const unsubscribe = useExperience.subscribe(run);
    return () => {
      unsubscribe();
      timers.forEach(clearTimeout);
    };
  }, []);

  return null;
}
