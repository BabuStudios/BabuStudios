import { type BufferGeometry, type Color, Triangle, Vector3 } from "three";
import { createRandom } from "./random";

/** A logo part to sample: its geometry (normalised, height 1) and its colour. */
export interface SampleSource {
  geometry: BufferGeometry;
  color: Color;
}

export interface SurfaceSamples {
  /** xyz per point, in the logo's normalised space (height 1). */
  positions: Float32Array;
  /** Linear RGB per point (the colour of the part it lies on). */
  colors: Float32Array;
  count: number;
}

const a = new Vector3();
const b = new Vector3();
const c = new Vector3();
const n = new Vector3();
const triangle = new Triangle();

/**
 * Scatters `count` points over the front faces of a logo (triangles whose
 * normal faces +Z, i.e. the visible caps of the extrusion), area-weighted so
 * the density is even across thin and thick strokes. Deterministic per seed.
 */
export function sampleFrontSurface(sources: SampleSource[], count: number, seed = 1): SurfaceSamples {
  // 1. Collect each part's front caps: triangles facing ±Z (SVG logos are
  // mirrored, so either sign) at that part's front-most depth. Side walls and
  // back caps are not visible. Parts sit at slightly different depths (paint
  // order), so the front is found per part.
  type Tri = { a: Vector3; b: Vector3; c: Vector3; color: Color; area: number; z: number };
  const caps: Tri[] = [];
  for (const { geometry, color } of sources) {
    const pos = geometry.getAttribute("position");
    const index = geometry.getIndex();
    const triCount = index ? index.count / 3 : pos.count / 3;
    const facing: Tri[] = [];
    for (let t = 0; t < triCount; t++) {
      const i0 = index ? index.getX(t * 3) : t * 3;
      const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
      const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
      a.fromBufferAttribute(pos, i0);
      b.fromBufferAttribute(pos, i1);
      c.fromBufferAttribute(pos, i2);
      triangle.set(a, b, c);
      triangle.getNormal(n);
      if (Math.abs(n.z) < 0.9) continue;
      const area = triangle.getArea();
      if (area <= 0) continue;
      facing.push({ a: a.clone(), b: b.clone(), c: c.clone(), color, area, z: Math.max(a.z, b.z, c.z) });
    }
    const front = Math.max(...facing.map((t) => t.z));
    // Within 1% of the logo height of the front: the caps, not the back.
    caps.push(...facing.filter((t) => front - t.z < 0.01));
  }
  const total = caps.reduce((sum, t) => sum + t.area, 0);

  // 2. Cumulative areas for weighted picks.
  const cumulative = new Float64Array(caps.length);
  let running = 0;
  caps.forEach((t, i) => {
    running += t.area;
    cumulative[i] = running;
  });

  const random = createRandom(seed);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count && caps.length; i++) {
    // Binary search the triangle whose cumulative area covers r.
    const r = random() * total;
    let lo = 0;
    let hi = caps.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    const t = caps[lo];
    // Uniform point in a triangle (square-root trick).
    const r1 = Math.sqrt(random());
    const r2 = random();
    const wa = 1 - r1;
    const wb = r1 * (1 - r2);
    const wc = r1 * r2;
    positions[i * 3] = t.a.x * wa + t.b.x * wb + t.c.x * wc;
    positions[i * 3 + 1] = t.a.y * wa + t.b.y * wb + t.c.y * wc;
    positions[i * 3 + 2] = t.a.z * wa + t.b.z * wb + t.c.z * wc;
    colors[i * 3] = t.color.r;
    colors[i * 3 + 1] = t.color.g;
    colors[i * 3 + 2] = t.color.b;
  }
  return { positions, colors, count };
}
