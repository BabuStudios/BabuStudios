import { create } from "zustand";
import { type BrandId, hubBrandIds } from "@/content/brands";
import type { PageWorldId } from "@/content/pages";
import { initialQuality, type Quality } from "@/lib/quality";

/**
 * The single bridge between the DOM (scroll, pointer, routing, overlay) and
 * the 3D scene.
 *
 * Inside `useFrame`, read with `useExperience.getState()`. Never subscribe to
 * fast-changing fields (pointer, scrollProgress) from React components that
 * render every frame.
 */

/** Every world: the hub, the four brands and the page worlds (Contact, Policies). */
export type WorldId = "hub" | BrandId | PageWorldId;
export type TransitionState = "idle" | "flyingIn" | "flyingOut";
/** The two halves of every fly transition (see TransitionDirector). */
export type TransitionPhase = "departure" | "arrival";
/**
 * How the site renders: `pending` until the client has checked for WebGL,
 * `webgl` for the full 3D experience, `fallback` for the static DOM version
 * (no WebGL, a crashed renderer or a lost context).
 */
export type RenderMode = "pending" | "webgl" | "fallback";

export interface ScrollToOptions {
  /** Jump without animation (used for the reset at a world swap). */
  immediate?: boolean;
}

/** A brand shown in the hub's choice composition. */
export type HubBrandId = (typeof hubBrandIds)[number];

/** Where a 3D object currently is on screen (CSS px), for DOM elements that track it. */
export interface ScreenAnchor {
  /** Centre of the object's box. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** 0..1 how revealed the object is. */
  opacity: number;
}

/** Where a corridor panel's 3D anchor currently projects (CSS px) and how deep it is. */
export interface SectionFrame {
  x: number;
  y: number;
  /** View-space depth in world units (in front of the camera). */
  depth: number;
}

/** A section to scroll to once its world is active (e.g. Studios → contact). */
export interface PendingSection {
  world: WorldId;
  id: string;
}

/** Pointer in normalized device coordinates: x and y in [-1, 1], y up. */
export interface PointerState {
  x: number;
  y: number;
}

interface ExperienceState {
  activeWorld: WorldId;
  targetWorld: WorldId | null;
  transitionState: TransitionState;
  /** 0..1 scroll progress through the active world. */
  scrollProgress: number;
  /** Page scroll in CSS px (vertical worlds map it 1:1 onto the camera). */
  scrollY: number;
  hoveredBrand: BrandId | null;
  quality: Quality;
  logoDocked: boolean;
  pointer: PointerState;
  reducedMotion: boolean;
  /** 0..1 progress of the three.js loading manager. */
  loadProgress: number;
  /** True once the first world has rendered a frame. */
  sceneReady: boolean;
  /** True once the loader starts fading out (entrance animations start). */
  revealed: boolean;
  /**
   * Smooth-scrolls to a progress (0..1) of the active world. Registered by
   * ScrollManager (Lenis, or native scroll with reduced motion).
   */
  scrollTo: ((progress: number, options?: ScrollToOptions) => void) | null;
  /** Current half of the running transition, or null when idle. */
  transitionPhase: TransitionPhase | null;
  /** True when the running transition was started by browser back/forward (URL already updated). */
  flightFromHistory: boolean;
  /** Set by a deep link: play the short arrival-only intro once the loader is gone. */
  introPending: boolean;
  /** The world the URL currently points at (mirrors the route). */
  urlWorld: WorldId;
  /** Changes the URL to a world. Registered by RouteSync (Next) or HashSync (preview). */
  navigate: ((world: WorldId) => void) | null;
  /**
   * Per-frame screen anchors of the hub's brand logos. Written IN PLACE by
   * the scene every frame and read by the DOM overlay's own rAF loop. Never
   * subscribe to this; it does not trigger updates.
   */
  anchors: Record<HubBrandId, ScreenAnchor>;
  /**
   * Per-frame projections of the active depth world's section panels, keyed
   * by section id. Mutated in place by the scene, read by the DOM's own rAF
   * loop; never subscribe.
   */
  sectionFrames: Record<string, SectionFrame>;
  pendingSection: PendingSection | null;
  renderMode: RenderMode;
}

interface ExperienceActions {
  setActiveWorld: (world: WorldId) => void;
  setQuality: (quality: Quality) => void;
  setPointer: (x: number, y: number) => void;
  setReducedMotion: (reduced: boolean) => void;
  setLoadProgress: (progress: number) => void;
  markSceneReady: () => void;
  markRevealed: () => void;
  setScroll: (progress: number, y: number) => void;
  setHoveredBrand: (brand: BrandId | null) => void;
  setLogoDocked: (docked: boolean) => void;
  setScrollTo: (scrollTo: ((progress: number, options?: ScrollToOptions) => void) | null) => void;
  /**
   * Asks to fly to a world. Ignored while another transition runs or when it
   * is already the active world. `fromHistory`: the URL has already changed.
   */
  requestWorld: (world: WorldId, options?: { fromHistory?: boolean }) => void;
  /** First route on load: show this world directly (deep links get an intro). */
  enterWorld: (world: WorldId) => void;
  setUrlWorld: (world: WorldId) => void;
  setNavigate: (navigate: ((world: WorldId) => void) | null) => void;
  setTransitionPhase: (phase: TransitionPhase | null) => void;
  /** Starts the deep-link intro (arrival only). */
  startIntro: () => void;
  endTransition: () => void;
  /** Scroll to a section of a world, flying there first if needed. */
  goToSection: (world: WorldId, id: string) => void;
  clearPendingSection: () => void;
  setRenderMode: (mode: "webgl" | "fallback") => void;
}

const emptyAnchor = (): ScreenAnchor => ({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  opacity: 0,
});

export const useExperience = create<ExperienceState & ExperienceActions>()((set, get) => ({
  activeWorld: "hub",
  targetWorld: null,
  transitionState: "idle",
  scrollProgress: 0,
  scrollY: 0,
  hoveredBrand: null,
  quality: initialQuality(),
  logoDocked: false,
  pointer: { x: 0, y: 0 },
  reducedMotion: false,
  loadProgress: 0,
  sceneReady: false,
  revealed: false,
  scrollTo: null,
  transitionPhase: null,
  flightFromHistory: false,
  introPending: false,
  urlWorld: "hub",
  navigate: null,
  sectionFrames: {},
  pendingSection: null,
  renderMode: "pending",
  anchors: Object.fromEntries(hubBrandIds.map((id) => [id, emptyAnchor()])) as Record<HubBrandId, ScreenAnchor>,

  // Brand worlds always show the docked header logo (only the hub animates it).
  setActiveWorld: (activeWorld) => set(activeWorld === "hub" ? { activeWorld } : { activeWorld, logoDocked: true }),
  setQuality: (quality) => set({ quality }),
  setPointer: (x, y) => set({ pointer: { x, y } }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setLoadProgress: (loadProgress) => set({ loadProgress }),
  markSceneReady: () => set({ sceneReady: true }),
  markRevealed: () => set({ revealed: true }),
  setScroll: (scrollProgress, scrollY) => set({ scrollProgress, scrollY }),
  setHoveredBrand: (hoveredBrand) => set({ hoveredBrand }),
  setLogoDocked: (logoDocked) => set({ logoDocked }),
  setScrollTo: (scrollTo) => set({ scrollTo }),
  requestWorld: (world, options) => {
    const { transitionState, activeWorld } = get();
    if (transitionState !== "idle" || world === activeWorld) return;
    set({
      targetWorld: world,
      transitionState: world === "hub" ? "flyingOut" : "flyingIn",
      flightFromHistory: options?.fromHistory ?? false,
      hoveredBrand: null,
    });
  },
  enterWorld: (world) => {
    get().setActiveWorld(world);
    set({ urlWorld: world, introPending: world !== "hub" });
  },
  setUrlWorld: (urlWorld) => set({ urlWorld }),
  setNavigate: (navigate) => set({ navigate }),
  setTransitionPhase: (transitionPhase) => set({ transitionPhase }),
  startIntro: () =>
    set({
      introPending: false,
      targetWorld: get().activeWorld,
      transitionState: "flyingIn",
      flightFromHistory: true,
    }),
  goToSection: (world, id) => {
    set({ pendingSection: { world, id } });
    if (get().activeWorld !== world) get().requestWorld(world);
  },
  clearPendingSection: () => set({ pendingSection: null }),
  // The static fallback has no 3D logo to dock and nothing to load: the header
  // B shows from the start and the loader may leave at once.
  setRenderMode: (renderMode) =>
    set(renderMode === "fallback" ? { renderMode, logoDocked: true, sceneReady: true } : { renderMode }),
  endTransition: () =>
    set({
      transitionState: "idle",
      transitionPhase: null,
      targetWorld: null,
      flightFromHistory: false,
    }),
}));
