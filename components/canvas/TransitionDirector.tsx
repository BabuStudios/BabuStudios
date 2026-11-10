"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { type PerspectiveCamera, Vector3 } from "three";
import { hubBrandIds } from "@/content/brands";
import { clamp01, easeInCubic, easeOutQuart, smoothstep } from "@/lib/easing";
import { FLIGHT, flight } from "@/lib/flight";
import { HUB_TIMELINE } from "@/lib/hubTimeline";
import { cameraPointAt, defaultLookAt } from "@/lib/paths";
import { CAMERA_FOV } from "@/lib/scene";
import { type HubBrandId, useExperience, type WorldId } from "@/store/useExperience";
import { hubBrandRestPosition } from "@/worlds/hub/meta";

/** Scroll progress a world is entered at: the hub returns to its "choice" rest. */
const arrivalProgress = (world: WorldId) => (world === "hub" ? HUB_TIMELINE.rest : 0);

const isHubBrand = (world: WorldId): world is HubBrandId => (hubBrandIds as readonly string[]).includes(world);

const tmp = new Vector3();
const forward = new Vector3();

interface Leg {
  from: Vector3;
  to: Vector3;
  lookFrom: Vector3;
  lookTo: Vector3;
  duration: number;
}

const makeLeg = (): Leg => ({
  from: new Vector3(),
  to: new Vector3(),
  lookFrom: new Vector3(),
  lookTo: new Vector3(),
  duration: 1,
});

/**
 * Runs fly transitions requested through the store (requestWorld / startIntro)
 * and performs the world swap in the middle. Priority -2: it runs before the
 * CameraRig (-1), which applies `flight` to the camera in the same frame.
 */
export function TransitionDirector() {
  const phase = useRef<"departure" | "arrival" | null>(null);
  const elapsed = useRef(0);
  const leg = useRef<Leg>(makeLeg());

  useFrame((state, delta) => {
    const store = useExperience.getState();
    const camera = state.camera as PerspectiveCamera;
    const aspect = state.size.width / state.size.height;
    const reduced = store.reducedMotion;

    if (store.transitionState === "idle") {
      flight.active = false;
      phase.current = null;
      // Back/forward pressed during a flight: catch up once it has finished.
      if (store.urlWorld !== store.activeWorld && !store.introPending) {
        store.requestWorld(store.urlWorld, { fromHistory: true });
      }
      if (store.introPending && store.revealed) store.startIntro();
      return;
    }

    const target = store.targetWorld;
    if (!target) return;
    const L = leg.current;

    // ---------- Start ----------
    if (phase.current === null) {
      elapsed.current = 0;
      flight.active = true;
      flight.veil = 0;
      const intro = store.activeWorld === target; // deep link: arrival only
      if (intro) {
        planArrival(L, target, store.activeWorld, aspect, reduced);
        phase.current = "arrival";
        store.setTransitionPhase("arrival");
      } else {
        planDeparture(L, camera, store.activeWorld, target, state.size.width, state.size.height, reduced);
        phase.current = "departure";
        store.setTransitionPhase("departure");
        // Change the URL now, so the new route renders behind the veil.
        if (!store.flightFromHistory) store.navigate?.(target);
      }
    }

    elapsed.current += Math.min(delta, 1 / 30);
    const t = clamp01(elapsed.current / L.duration);

    if (phase.current === "departure") {
      const e = reduced ? 0 : easeInCubic(t);
      flight.position.lerpVectors(L.from, L.to, e);
      flight.lookAt.lerpVectors(L.lookFrom, L.lookTo, e);
      flight.fov = CAMERA_FOV + FLIGHT.fovPush * e;
      flight.veil = reduced ? t : smoothstep(0.6, 1, t);

      if (t >= 1) {
        // ---------- Swap (fully veiled) ----------
        const from = store.activeWorld;
        store.setActiveWorld(target);
        store.scrollTo?.(arrivalProgress(target), { immediate: true });
        planArrival(L, target, from, aspect, reduced);
        elapsed.current = 0;
        phase.current = "arrival";
        store.setTransitionPhase("arrival");
      }
      return;
    }

    // ---------- Arrival ----------
    const e = reduced ? 1 : easeOutQuart(t);
    flight.position.lerpVectors(L.from, L.to, e);
    flight.lookAt.lerpVectors(L.lookFrom, L.lookTo, e);
    flight.fov = CAMERA_FOV + FLIGHT.fovPush * (1 - e);
    flight.veil = reduced ? 1 - t : 1 - smoothstep(0, 0.5, t);

    if (t >= 1) {
      flight.active = false;
      flight.veil = 0;
      phase.current = null;
      store.endTransition();
    }
  }, -2);

  return null;
}

/** First half: toward (and through) the chosen logo, or back out of a brand world. */
function planDeparture(
  L: Leg,
  camera: PerspectiveCamera,
  from: WorldId,
  to: WorldId,
  viewportWidth: number,
  viewportHeight: number,
  reduced: boolean,
) {
  L.duration = reduced ? FLIGHT.reducedDeparture : FLIGHT.departure;
  L.from.copy(camera.position);
  camera.getWorldDirection(forward);
  L.lookFrom.copy(camera.position).addScaledVector(forward, 12);

  if (from === "hub" && isHubBrand(to)) {
    // Into a brand logo in the hub (Studios included, whether its wordmark or
    // the header B was clicked): aim at it, end just past it. Looking at a
    // point 20 units beyond the logo keeps the view steady as we pass through.
    const p = hubBrandRestPosition(to, viewportWidth / viewportHeight);
    tmp.set(p.x, p.y, p.z);
    L.to.copy(tmp).add(forward.set(0, 0, -FLIGHT.throughDepth));
    L.lookTo.copy(tmp).add(forward.set(0, 0, -20));
  } else if (from === "hub") {
    // From the hub to a page with no logo in the row (Contact): glide
    // straight ahead into the space, keeping the view.
    L.to.copy(camera.position).add(tmp.copy(forward).multiplyScalar(FLIGHT.pullBack));
    L.lookTo.copy(L.lookFrom).add(tmp.copy(forward).multiplyScalar(FLIGHT.pullBack));
  } else {
    // Out of a brand world: pull straight back, keeping the view.
    L.to.copy(camera.position).add(tmp.set(0, 0, FLIGHT.pullBack));
    L.lookTo.copy(L.lookFrom).add(tmp.set(0, 0, FLIGHT.pullBack));
  }
  if (reduced) {
    L.to.copy(L.from);
    L.lookTo.copy(L.lookFrom);
  }
}

/** Second half: settle into the destination's entry point. */
function planArrival(L: Leg, to: WorldId, from: WorldId, aspect: number, reduced: boolean) {
  L.duration = reduced ? FLIGHT.reducedArrival : FLIGHT.arrival;
  cameraPointAt(to, arrivalProgress(to), L.to);
  defaultLookAt(L.to, L.lookTo);

  if (to === "hub" && isHubBrand(from)) {
    // Reverse portal: start just beyond the logo we entered by, back out of it.
    const p = hubBrandRestPosition(from, aspect);
    L.from.set(p.x, p.y, p.z - FLIGHT.reEntry);
  } else if (to === "hub") {
    L.from.copy(L.to).add(tmp.set(0, 0, -FLIGHT.approach));
  } else {
    // Into a brand world: come in from behind its start and decelerate.
    L.from.copy(L.to).add(tmp.set(0, 0, FLIGHT.approach));
  }
  defaultLookAt(L.from, L.lookFrom);
  if (reduced) {
    L.from.copy(L.to);
    L.lookFrom.copy(L.lookTo);
  }
}
