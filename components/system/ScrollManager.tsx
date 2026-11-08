"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { clamp01, easeInOutQuart } from "@/lib/easing";
import { type ScrollToOptions, useExperience } from "@/store/useExperience";

/**
 * Drives page scroll and publishes normalised progress (0..1) to the store.
 * Lenis smooths wheel/trackpad scrolling; with prefers-reduced-motion the page
 * scrolls natively. The scene never reads the DOM scroll position itself.
 *
 * During fly transitions scroll is locked, and progress is frozen: the route
 * (and so the page height) changes at the start of the flight, which would
 * otherwise rescale progress under the outgoing world. The director resets
 * scroll explicitly at the world swap (`scrollTo(..., { immediate: true })`).
 */
export function ScrollManager() {
  const reducedMotion = useExperience((s) => s.reducedMotion);

  useEffect(() => {
    const { setScroll, setScrollTo } = useExperience.getState();
    const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const flying = () => useExperience.getState().transitionState !== "idle";

    if (reducedMotion) {
      const onScroll = () => {
        if (!flying()) setScroll(clamp01(window.scrollY / maxScroll()), window.scrollY);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      setScrollTo((progress: number) => {
        window.scrollTo({ top: progress * maxScroll(), behavior: "instant" });
        setScroll(progress, progress * maxScroll());
      });
      const unsubscribe = useExperience.subscribe((s, prev) => {
        if (s.transitionState === prev.transitionState) return;
        document.documentElement.style.overflow = s.transitionState === "idle" ? "" : "hidden";
      });
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        unsubscribe();
        document.documentElement.style.overflow = "";
        setScrollTo(null);
      };
    }

    // lerp 0.09: a touch heavier than Lenis' default (0.1), for the weightless feel.
    const lenis = new Lenis({ autoRaf: true, lerp: 0.09 });
    const onScroll = () => {
      if (!flying()) setScroll(clamp01(lenis.progress), lenis.scroll);
    };
    lenis.on("scroll", onScroll);
    onScroll();
    setScrollTo((progress: number, options?: ScrollToOptions) => {
      if (options?.immediate) {
        lenis.resize(); // the route may just have changed the page height
        lenis.scrollTo(progress * maxScroll(), { immediate: true, force: true });
        setScroll(progress, progress * maxScroll());
      } else {
        lenis.scrollTo(progress * maxScroll(), { duration: 1.6, easing: easeInOutQuart });
      }
    });
    const unsubscribe = useExperience.subscribe((s, prev) => {
      if (s.transitionState === prev.transitionState) return;
      if (s.transitionState === "idle") lenis.start();
      else lenis.stop();
    });
    return () => {
      unsubscribe();
      lenis.destroy();
      setScrollTo(null);
    };
  }, [reducedMotion]);

  return null;
}
