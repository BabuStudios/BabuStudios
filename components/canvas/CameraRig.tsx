"use client";

import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { MathUtils, type PerspectiveCamera, Vector3 } from "three";
import { flight } from "@/lib/flight";
import { cameraPointAt, defaultLookAt } from "@/lib/paths";
import { CAMERA_FOV } from "@/lib/scene";
import { useExperience } from "@/store/useExperience";
import { CONTENT_PLANE_DISTANCE } from "@/worlds/brandMeta";
import { worlds } from "@/worlds/registry";

const target = new Vector3();
const lookAt = new Vector3();

/**
 * The single camera rig.
 *
 * - During a fly transition, it applies the pose computed by the
 *   TransitionDirector (`flight`) exactly, including the FOV push.
 * - In a "depth" world it samples the world's CatmullRom path at the current
 *   scroll progress and damps toward it. Two layers of smoothing: Lenis eases
 *   the scroll value; the 0.18 s damp removes any remaining step from wheel
 *   ticks, so the dolly feels heavy rather than tied to a scroll bar.
 * - In a "vertical" world (a normal page) it slides straight down, 1:1 with
 *   the page: at the content plane (distance d) the view is 2·d·tan(fov/2)
 *   world units tall for `viewportHeight` px, so the camera moves that ratio
 *   × scrollY. No extra damping, so 3D objects stay locked to the DOM text.
 *
 * Every arrival ends exactly where these rules put the camera at the reset
 * scroll, so the hand-back from flight is seamless. Runs at priority -1 and
 * refreshes the matrices at once, so later projections this frame are exact.
 */
export function CameraRig() {
  useFrame((state, delta) => {
    const camera = state.camera as PerspectiveCamera;

    if (flight.active) {
      camera.position.copy(flight.position);
      if (camera.fov !== flight.fov) {
        camera.fov = flight.fov;
        camera.updateProjectionMatrix();
      }
      camera.lookAt(flight.lookAt);
      camera.updateMatrixWorld();
      return;
    }

    if (camera.fov !== CAMERA_FOV) {
      camera.fov = CAMERA_FOV;
      camera.updateProjectionMatrix();
    }
    const { scrollProgress, scrollY, reducedMotion, activeWorld } = useExperience.getState();

    if (worlds[activeWorld].scrollMode === "vertical") {
      const unitsPerPx =
        (2 * CONTENT_PLANE_DISTANCE * Math.tan(MathUtils.degToRad(CAMERA_FOV) / 2)) / state.size.height;
      cameraPointAt(activeWorld, 0, target);
      camera.position.set(target.x, target.y - scrollY * unitsPerPx, target.z);
      camera.lookAt(lookAt.set(camera.position.x, camera.position.y, camera.position.z - 12));
      camera.updateMatrixWorld();
      return;
    }

    cameraPointAt(activeWorld, scrollProgress, target);
    if (reducedMotion) camera.position.copy(target);
    else easing.damp3(camera.position, target, 0.18, delta);
    camera.lookAt(defaultLookAt(camera.position, lookAt));
    camera.updateMatrixWorld();
  }, -1);

  return null;
}
