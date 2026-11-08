import { CatmullRomCurve3, Vector3 } from "three";
import type { WorldId } from "@/store/useExperience";
import { worlds } from "@/worlds/registry";

const curves = new Map<WorldId, CatmullRomCurve3>();

/** The camera path of a world (CatmullRom through its control points), cached. */
export function cameraCurve(world: WorldId): CatmullRomCurve3 {
  let curve = curves.get(world);
  if (!curve) {
    curve = new CatmullRomCurve3(worlds[world].cameraPath.map(([x, y, z]) => new Vector3(x, y, z)));
    curves.set(world, curve);
  }
  return curve;
}

/** Camera position at a scroll progress (arc-length parameterised). */
export function cameraPointAt(world: WorldId, progress: number, out: Vector3): Vector3 {
  return cameraCurve(world).getPointAt(Math.min(1, Math.max(0, progress)), out);
}

/**
 * Where the camera looks from a position: 12 units down -Z, nudged 40% toward
 * the path's drift so the frame turns gently with it instead of sliding.
 */
export function defaultLookAt(position: Vector3, out: Vector3): Vector3 {
  return out.set(position.x * 0.4, position.y * 0.4, position.z - 12);
}
