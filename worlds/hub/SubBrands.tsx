"use client";

import { useCallback, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { type Group, MathUtils, type MeshBasicMaterial, type PerspectiveCamera, Vector3 } from "three";
import { AliveGroup } from "@/components/canvas/AliveGroup";
import { LogoAssembly } from "@/components/canvas/LogoAssembly";
import { Logo3D, useLogoGeometry } from "@/components/canvas/Logo3D";
import { Mark3D, useMarkGeometry } from "@/components/canvas/Mark3D";
import { brands, hubBrandIds, subBrandIds } from "@/content/brands";
import { defaultAlive } from "@/lib/alive";
import { assetUrl } from "@/lib/assets";
import { clamp01, smoothstep } from "@/lib/easing";
import { revealAmount, wordmarkTravel } from "@/lib/hubTimeline";
import { brandColorFor, setMuted } from "@/lib/logoMaterial";
import { isCoarsePointer, type Quality } from "@/lib/quality";
import { type HubBrandId, useExperience } from "@/store/useExperience";
import { type Placement, SUB_BRAND_LAYOUT } from "./meta";
import { subBrandUrls, useHubRow } from "./rowScale";

const viewPosition = new Vector3();
const screenPosition = new Vector3();

interface SlotProps {
  id: HubBrandId;
  index: number;
  rest: Placement;
  /** Logo size in world units. */
  height: number;
  aspect: number;
  /** A flat SVG wordmark, or a 3D wordmark (GLB). */
  logo: { kind: "flat" | "3d"; url: string };
  /**
   * Studios: instead of rising out of the fog, the slot takes over from the
   * hero's travelling wordmark the moment it lands (wordmarkTravel = 1), at
   * the identical pose; its own float/tilt then fades in over 1.2 s.
   */
  handoff?: boolean;
  /** Stacked (portrait) layout: uses the portrait reveal timing. */
  portrait: boolean;
  /** Dust motes for the entrance (0: none, e.g. with reduced motion). */
  dust: number;
}

/** Dust motes per logo for the entrance, by quality. */
const DUST: Record<Quality, number> = { high: 1600, medium: 1000, low: 500 };
/**
 * With the dust entrance the logos only drift in from a little behind and
 * below (this fraction of the old rise): the dust carries the motion.
 */
const DUST_RISE = 0.3;
/** Magnetic tilt: max turn toward the pointer (radians) and the hovered logo's pull (world units per NDC). */
const MAGNET = { yaw: 0.22, pitch: 0.14, pull: 1.1, maxPull: 0.18 };

/** Touch-first devices have no hovering pointer to follow (checked once). */
const coarsePointer = typeof window !== "undefined" && isCoarsePointer();

/** The flat logo's parts in the brand colours, for the dust sampler. */
function useDustSources(id: HubBrandId, url: string) {
  const logo = useLogoGeometry(url);
  return useMemo(
    () => logo.parts.map((part) => ({ geometry: part.geometry, color: brandColorFor(part.color, brands[id].palette) })),
    [logo, id],
  );
}

/** The entrance dust for a flat logo (a component, so the SVG hook runs only for flat logos). */
function FlatLogoDust(props: {
  id: HubBrandId;
  url: string;
  aspect: number;
  height: number;
  progress: () => number;
  count: number;
  seed: number;
}) {
  const sources = useDustSources(props.id, props.url);
  return (
    <LogoAssembly
      sources={sources}
      aspect={props.aspect}
      height={props.height}
      progress={props.progress}
      count={props.count}
      seed={props.seed}
    />
  );
}

/** Flat SVG wordmark in the palette tokens; muted and faded through its basic materials. */
function FlatWordmark({
  id,
  url,
  height,
  mute,
  opacity,
}: {
  id: HubBrandId;
  url: string;
  height: number;
  mute: () => number;
  opacity: () => number;
}) {
  const materials = useRef<MeshBasicMaterial[]>(null);
  useFrame(() => {
    const amount = mute();
    const alpha = opacity();
    materials.current?.forEach((material) => {
      setMuted(material, amount);
      // Transparent only while fading, so the opaque pass is used at rest.
      const fading = alpha < 0.999;
      if (material.transparent !== fading) {
        material.transparent = fading;
        material.needsUpdate = true;
      }
      material.opacity = alpha;
    });
  });
  return <Logo3D url={url} height={height} materialsRef={materials} palette={brands[id].palette} />;
}

/**
 * One brand logo in the hub: rises out of the fog, floats, reacts to
 * hover/focus, and publishes its screen box for the DOM link tracking it.
 */
function BrandSlot({ id, index, rest, height, aspect, logo, handoff = false, portrait, dust }: SlotProps) {
  const group = useRef<Group>(null);
  // Inner group for the magnetic tilt and pull, so the link's hit box (which
  // follows the outer group) never moves under the pointer.
  const tilt = useRef<Group>(null);
  const magnet = useRef({ yaw: 0, pitch: 0, x: 0, y: 0 });
  // 0..1 entrance: drives the dust and, near its end, the solid logo's fade.
  const entrance = useRef(0);
  const assembly = useCallback(() => entrance.current, []);
  const meshOpacity = useCallback(() => (dust > 0 ? smoothstep(0.62, 0.92, entrance.current) : 1), [dust]);
  const hover = useRef({ lift: 0, mute: 0 });
  const mute = useCallback(() => hover.current.mute * 0.85, []);
  const landedAt = useRef<number | null>(null);
  const aliveAmount = useRef(handoff ? 0 : 1);
  const aliveStrength = useCallback(() => aliveAmount.current, []);
  // Each logo floats on its own phase (1.9 s apart) so they never bob in sync.
  const alive = { ...defaultAlive, phase: 1.3 + index * 1.9 };

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const { scrollProgress, hoveredBrand, anchors, pointer, reducedMotion } = useExperience.getState();
    let reveal = revealAmount(scrollProgress, index, portrait);
    if (handoff) {
      const travel = wordmarkTravel(scrollProgress);
      const landed = travel >= 0.999;
      if (landed) landedAt.current ??= state.clock.elapsedTime;
      else landedAt.current = null;
      aliveAmount.current = landedAt.current === null ? 0 : clamp01((state.clock.elapsedTime - landedAt.current) / 1.2);
      // Already in place (no rise); visible only once the traveller has landed.
      reveal = landed ? 1 : travel;
    }

    // Hover/focus: the chosen logo drifts toward the camera; the others recede
    // and mute. 0.3 s smoothing ≈ the 200–400 ms micro-interaction range.
    const isHovered = hoveredBrand === id;
    const isOther = hoveredBrand !== null && !isHovered;
    const { lift, recede } = SUB_BRAND_LAYOUT.hover;
    easing.damp(hover.current, "lift", isHovered ? lift : isOther ? recede : 0, 0.3, delta);
    easing.damp(hover.current, "mute", isOther ? 1 : 0, 0.3, delta);

    // Entrance: rise out of the fog toward the rest placement. With the dust,
    // only a short drift: the dust gathers into the logo instead.
    entrance.current = reveal;
    const { rise } = SUB_BRAND_LAYOUT;
    const riseScale = dust > 0 ? DUST_RISE : 1;
    g.position.set(
      rest.x,
      rest.y + (1 - reveal) * rise.y * riseScale,
      rest.z + (1 - reveal) * rise.z * riseScale + hover.current.lift,
    );
    g.visible = handoff ? reveal >= 0.999 : reveal > 0.001;

    // Publish where the logo is on screen, for the DOM link tracking it.
    const camera = state.camera as PerspectiveCamera;
    screenPosition.copy(g.position).project(camera);
    viewPosition.copy(g.position).applyMatrix4(camera.matrixWorldInverse);
    const depth = Math.max(0.1, -viewPosition.z);
    // World height → px: the view at depth d is 2·d·tan(fov/2) units tall.
    const heightPx = (height / (2 * depth * Math.tan(MathUtils.degToRad(camera.fov) / 2))) * state.size.height;
    const anchor = anchors[id];
    anchor.x = (screenPosition.x * 0.5 + 0.5) * state.size.width;
    anchor.y = (-screenPosition.y * 0.5 + 0.5) * state.size.height;
    anchor.height = heightPx;
    anchor.width = heightPx * aspect;
    // Clickable (and its hover reveal shown) once the solid logo is in.
    anchor.opacity = handoff ? reveal : reveal * meshOpacity();

    // Magnetic tilt: every logo turns a little toward the pointer, as a real
    // object would; the hovered one is also pulled gently toward it. Offsets
    // are in NDC between pointer and logo centre, clamped, and damped (0.35 s).
    const t = tilt.current;
    if (t) {
      const m = magnet.current;
      // Only with a real pointer: touch has none (it would pull toward the centre).
      const active = !reducedMotion && !coarsePointer && reveal > 0.5;
      const dx = active ? MathUtils.clamp(pointer.x - screenPosition.x, -1, 1) : 0;
      const dy = active ? MathUtils.clamp(pointer.y - screenPosition.y, -1, 1) : 0;
      const pull = isHovered ? MAGNET.pull : 0;
      easing.damp(m, "yaw", dx * MAGNET.yaw, 0.35, delta);
      easing.damp(m, "pitch", -dy * MAGNET.pitch, 0.35, delta);
      easing.damp(m, "x", MathUtils.clamp(dx * pull, -MAGNET.maxPull, MAGNET.maxPull), 0.35, delta);
      easing.damp(m, "y", MathUtils.clamp(dy * pull, -MAGNET.maxPull, MAGNET.maxPull), 0.35, delta);
      t.rotation.set(m.pitch, m.yaw, 0);
      t.position.set(m.x, m.y, 0);
    }
  });

  return (
    <group ref={group}>
      <group ref={tilt}>
        <AliveGroup params={alive} strength={aliveStrength}>
          {logo.kind === "3d" ? (
            // Flat brand colours (no reflections), so the Studios wordmark is the
            // same black as its flat siblings in the row.
            <Mark3D url={logo.url} height={height} palette={brands[id].palette} mute={mute} flatness={fullyFlat} />
          ) : (
            <>
              <FlatWordmark id={id} url={logo.url} height={height} mute={mute} opacity={meshOpacity} />
              {dust > 0 && (
                <FlatLogoDust
                  id={id}
                  url={logo.url}
                  aspect={aspect}
                  height={height}
                  progress={assembly}
                  count={dust}
                  seed={index + 1}
                />
              )}
            </>
          )}
        </AliveGroup>
      </group>
    </group>
  );
}

const fullyFlat = () => 1;
const studiosWordmark = brands.studios.logo3d?.wordmark;

/**
 * Beats 2–3: the brand logos emerge and wait to be chosen. User layout: Life,
 * Studios, Business on one line, Entertainment below. Studios is the hero's
 * "Babu Studios" wordmark, which flies here from the lockup on scroll (see
 * StudiosWordmarkTraveler); the B is in the header. Scale: see useHubRow.
 */
export function SubBrands() {
  const { layout, logos, unit, studiosHeight, portrait } = useHubRow();
  const quality = useExperience((s) => s.quality);
  const reducedMotion = useExperience((s) => s.reducedMotion);
  // Reduced motion: no swirling dust; the logos simply rise and settle.
  const dust = reducedMotion ? 0 : DUST[quality];
  const studiosAspect = useMarkGeometry(assetUrl(studiosWordmark ?? "/brand/babu-studios-wordmark-3d.glb")).aspect;

  return (
    <>
      {hubBrandIds.map((id, index) => {
        if (id === "studios") {
          if (!studiosWordmark) return null;
          return (
            <BrandSlot
              key={id}
              id={id}
              index={index}
              portrait={portrait}
              rest={layout[id]}
              height={studiosHeight}
              aspect={studiosAspect}
              logo={{ kind: "3d", url: assetUrl(studiosWordmark) }}
              handoff
              dust={0}
            />
          );
        }
        const i = subBrandIds.indexOf(id);
        return (
          <BrandSlot
            key={id}
            id={id}
            index={index}
            portrait={portrait}
            rest={layout[id]}
            height={logos[i].height * unit}
            aspect={logos[i].aspect}
            logo={{ kind: "flat", url: subBrandUrls[i] }}
            dust={dust}
          />
        );
      })}
    </>
  );
}
