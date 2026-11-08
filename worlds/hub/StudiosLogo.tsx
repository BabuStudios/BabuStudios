"use client";

import { useCallback, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { type Group, MathUtils, type PerspectiveCamera, Quaternion, Vector3 } from "three";
import { AliveGroup } from "@/components/canvas/AliveGroup";
import { FloatShadow } from "@/components/canvas/FloatShadow";
import { Lockup3D } from "@/components/canvas/Lockup3D";
import { fitLogoHeight, Logo3D } from "@/components/canvas/Logo3D";
import { brands } from "@/content/brands";
import { defaultAlive } from "@/lib/alive";
import { assetUrl } from "@/lib/assets";
import { dockedPose } from "@/lib/dock";
import { clamp01, easeInOutQuart, easeOutExpo, lerp } from "@/lib/easing";
import { dockAmount } from "@/lib/hubTimeline";
import { SHEEN_PARKED, type SheenUniforms } from "@/lib/logoMaterial";
import { STUDIOS_LOCKUP } from "@/lib/lockup";
import { CAMERA_FOV, HUB } from "@/lib/scene";
import { useExperience } from "@/store/useExperience";
import { StudiosWordmarkTraveler } from "./StudiosWordmarkTraveler";

/** Entrance: the logo glides forward out of the fog after the loader fades. */
const ENTRANCE_DURATION = 2.4;
/**
 * Hand-off: once the 3D logo reaches the dock, the DOM header logo fades in on
 * top of it (CSS, 150 ms); after this long the 3D logo is hidden.
 */
const HANDOFF_S = 0.16;
// SVG fallback only (the 3D lockup gets its sweep from StudioEnvironment).
const SHEEN = { delay: 1.6, duration: 1.9, cycle: 6.5, from: -0.8, to: 0.8 };

const REST_POSITION = new Vector3(0, 0, HUB.logoZ);
const IDENTITY = new Quaternion();
const dockPosition = new Vector3();

/** Flat SVG lockup with the shader sheen, used when no 3D logo is configured. */
function SvgLockup({ height }: { height: number }) {
  const sheen = useRef<SheenUniforms>(null);
  const revealedAt = useRef<number | null>(null);
  useFrame((state) => {
    if (!sheen.current || !useExperience.getState().revealed) return;
    const now = state.clock.elapsedTime;
    revealedAt.current ??= now;
    const local = now - revealedAt.current - SHEEN.delay;
    const progress = local < 0 ? 1 : (local % SHEEN.cycle) / SHEEN.duration;
    sheen.current.uSweep.value =
      progress < 1 ? lerp(SHEEN.from, SHEEN.to, easeInOutQuart(progress)) : SHEEN_PARKED;
  });
  return <Logo3D url={assetUrl(brands.studios.logo)} height={height} sheenRef={sheen} />;
}

/**
 * Beats 1–2: the Babu Studios logo hanging in the void, then gliding up into
 * the header as the visitor scrolls, where it hands off to the DOM logo.
 */
export function StudiosLogo() {
  const size = useThree((s) => s.size);
  const dockRoot = useRef<Group>(null);
  const entrance = useRef<Group>(null);
  const revealedAt = useRef<number | null>(null);
  const dockedAt = useRef<number | null>(null);
  const dock = useRef(0);

  // Rest size: fit box at the logo's rest distance from the camera's start
  // (|logoZ|): 50% of the visible height (max 1.7 units), 52% of the width.
  const visibleHeight = 2 * Math.abs(HUB.logoZ) * Math.tan(MathUtils.degToRad(CAMERA_FOV) / 2);
  const visibleWidth = visibleHeight * (size.width / size.height);
  const restHeight = fitLogoHeight(
    STUDIOS_LOCKUP.aspect,
    visibleWidth * 0.52,
    Math.min(1.7, visibleHeight * 0.5),
  );

  // The float/tilt and the shadow fade out as the logo docks.
  const aliveStrength = useCallback(() => 1 - dock.current, []);
  const shadowStrength = useCallback(() => clamp01(1 - dock.current * 3), []);
  // Reflections fade out over the second half of the dock, so the docked 3D
  // logo has the SVG's flat colours at the hand-off.
  const flatness = useCallback(() => clamp01((dock.current - 0.5) * 2), []);

  useFrame((state) => {
    const root = dockRoot.current;
    const inner = entrance.current;
    if (!root || !inner) return;
    const { scrollProgress, revealed, reducedMotion, logoDocked, setLogoDocked, activeWorld } =
      useExperience.getState();
    const now = state.clock.elapsedTime;
    const d = dockAmount(scrollProgress);
    dock.current = d;

    // Entrance (time-based), cancelled by docking so it can never offset the hand-off.
    if (revealed) revealedAt.current ??= now;
    const k =
      reducedMotion || revealedAt.current === null
        ? Number(revealed || reducedMotion)
        : easeOutExpo(clamp01((now - revealedAt.current) / ENTRANCE_DURATION));
    inner.position.z = (1 - k) * -HUB.entranceDepth * (1 - d);

    // Dock (scroll-scrubbed). Interpolate the whole pose from rest (fixed in
    // the world) to the docked pose (fixed relative to the camera, which keeps
    // moving): position, orientation (face the camera) and scale.
    //
    // The header shows the B alone, so the lockup docks such that its B lands
    // on the header box: the docked lockup height is H = Bheight / markSlot.height,
    // and the lockup centre sits markSlot.(x, y)·H below/left of the B's centre
    // (lockup units, y up). The wordmark is a separate object that flies into
    // the brand row (StudiosWordmarkTraveler).
    const camera = state.camera as PerspectiveCamera;
    const pose = dockedPose(camera.fov, state.size.width, state.size.height);
    const { mark: markSlot } = STUDIOS_LOCKUP;
    const dockedHeight = pose.height / markSlot.height;
    dockPosition
      .set(pose.x - markSlot.x * dockedHeight, pose.y - markSlot.y * dockedHeight, pose.z)
      .applyQuaternion(camera.quaternion)
      .add(camera.position);
    root.position.lerpVectors(REST_POSITION, dockPosition, d);
    root.quaternion.slerpQuaternions(IDENTITY, camera.quaternion, d);
    root.scale.setScalar(lerp(1, dockedHeight / restHeight, d));

    // Hand-off to the DOM header logo, in both directions.
    const docked = d >= 0.999;
    // Only the hub owns the docked state. Right after a swap to a brand world
    // this component still runs for a frame (scroll already reset to 0) and
    // must not undock the header logo there.
    if (activeWorld === "hub" && docked !== logoDocked) setLogoDocked(docked);
    if (!docked) dockedAt.current = null;
    else dockedAt.current ??= now;
    root.visible = !(docked && now - (dockedAt.current ?? now) > HANDOFF_S);
  });

  // The stacked 3D lockup needs both the B and the wordmark; else flat SVG.
  const mark = brands.studios.logo3d?.mark;
  const wordmark = brands.studios.logo3d?.wordmark;
  return (
    <>
      {mark && wordmark && <StudiosWordmarkTraveler url={assetUrl(wordmark)} restHeight={restHeight} />}
      <group ref={dockRoot} position={REST_POSITION}>
        <group ref={entrance} position-z={-HUB.entranceDepth}>
          <AliveGroup params={defaultAlive} strength={aliveStrength}>
            {mark && wordmark ? (
              <Lockup3D
                markUrl={assetUrl(mark)}
                wordmarkUrl={assetUrl(wordmark)}
                height={restHeight}
                palette={brands.studios.palette}
                flatness={flatness}
                showWordmark={false}
              />
            ) : (
              <SvgLockup height={restHeight} />
            )}
          </AliveGroup>
          <FloatShadow
            y={-restHeight * 0.66}
            width={restHeight * STUDIOS_LOCKUP.aspect * 1.35}
            params={defaultAlive}
            strength={shadowStrength}
          />
        </group>
      </group>
    </>
  );
}
