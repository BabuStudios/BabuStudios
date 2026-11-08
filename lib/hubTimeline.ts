import { clamp01, easeInOutQuart, easeOutQuart } from "./easing";

/**
 * The hub's scroll choreography, as fractions of hub scroll progress (0..1).
 * Everything is a pure function of the (Lenis-smoothed) progress, so scrolling
 * back up plays every beat exactly in reverse.
 *
 *   0.00 ─ 0.35  the B glides up and docks in the header (Beat 2)
 *   0.02 ─ 0.50  the "Babu Studios" wordmark travels into the brand row
 *   0.10 ─ 0.66  sub-brand logos rise out of the fog, staggered (Beat 2)
 *   0.75 ─ 1.00  hub at rest: the choice (Beat 3)
 */
export const HUB_TIMELINE = {
  dockEnd: 0.35,
  revealStart: 0.1,
  revealSpan: 0.4,
  revealStagger: 0.08,
  /** Where keyboard focus on a brand link scrolls to: everything settled. */
  rest: 0.8,
  /**
   * The hero's "Babu Studios" wordmark travels from the lockup to its place
   * in the brand row over this window (the B docks into the header meanwhile).
   */
  wordmarkStart: 0.02,
  wordmarkEnd: 0.5,
  /**
   * Portrait (stacked) layout: the travelling wordmark crosses the middle of
   * the stack on its way to the top, so the other logos rise only once it has
   * passed, a little faster, and still settle before `rest`.
   */
  portraitReveal: { start: 0.42, stagger: 0.05, span: 0.24 },
} as const;

/** 0 in the hero lockup, 1 arrived at the Studios slot in the brand row. */
export function wordmarkTravel(progress: number): number {
  const { wordmarkStart, wordmarkEnd } = HUB_TIMELINE;
  return easeInOutQuart(clamp01((progress - wordmarkStart) / (wordmarkEnd - wordmarkStart)));
}

/** 0 at rest in the void, 1 docked in the header. */
export function dockAmount(progress: number): number {
  return easeInOutQuart(clamp01(progress / HUB_TIMELINE.dockEnd));
}

/** 0 hidden deep in the fog, 1 settled. `index` staggers the logos. */
export function revealAmount(progress: number, index: number, portrait = false): number {
  const { start, stagger, span } = portrait
    ? HUB_TIMELINE.portraitReveal
    : { start: HUB_TIMELINE.revealStart, stagger: HUB_TIMELINE.revealStagger, span: HUB_TIMELINE.revealSpan };
  return easeOutQuart(clamp01((progress - start - index * stagger) / span));
}
