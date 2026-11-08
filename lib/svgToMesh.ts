import { Box2, type BufferGeometry, type Color, ExtrudeGeometry, Vector2 } from "three";
import type { SVGResult } from "three/addons/loaders/SVGLoader.js";

export interface LogoPart {
  geometry: BufferGeometry;
  /** Original fill colour of the SVG path (linear working colour space). */
  color: Color;
}

export interface LogoGeometry {
  parts: LogoPart[];
  /** width / height of the artwork. */
  aspect: number;
  /** Size of the artwork in its own SVG user units (before normalising). */
  width: number;
  height: number;
}

/**
 * Geometries are cached per URL for the lifetime of the page: the same logo is
 * reused by the hub, the header handoff and the brand worlds, so they are
 * deliberately never disposed. Materials are per-instance and are disposed.
 */
const cache = new Map<string, LogoGeometry>();

/**
 * Converts parsed SVG paths into shallow extrusions, one per path so each keeps
 * its own colour.
 *
 * Normalisation: the artwork is centred on the origin and scaled to a height of
 * 1, so callers size the logo with a single `scale = heightInWorldUnits`.
 * SVG space is y-down and three.js is y-up, so we scale y by -1. That mirror
 * flips triangle winding, so logo materials render DoubleSide.
 */
export function getLogoGeometry(key: string, svg: SVGResult, depthRatio = 0.03): LogoGeometry {
  const cached = cache.get(key);
  if (cached) return cached;

  const filled = svg.paths
    .filter((path) => (path.userData?.style as { fill?: string } | undefined)?.fill !== "none")
    .map((path) => ({ path, shapes: path.toShapes() }))
    .filter(({ shapes }) => shapes.length > 0);

  const bounds = new Box2();
  for (const { shapes } of filled) {
    for (const shape of shapes) {
      for (const point of shape.getPoints()) bounds.expandByPoint(point);
    }
  }
  const size = bounds.getSize(new Vector2());
  const center = bounds.getCenter(new Vector2());
  const scale = 1 / size.y;
  // Depth is given relative to the logo height, so convert to SVG units first.
  const depth = depthRatio * size.y;

  const parts = filled.map(({ path, shapes }, index) => {
    const geometry = new ExtrudeGeometry(shapes, { depth, bevelEnabled: false, curveSegments: 32 });
    // Later paths sit a hair in front of earlier ones (2% of the depth per
    // path) so overlapping paths keep SVG paint order without z-fighting.
    geometry.translate(-center.x, -center.y, -depth / 2 + index * depth * 0.02);
    geometry.scale(scale, -scale, scale);
    geometry.computeBoundingSphere();
    return { geometry, color: path.color.clone() };
  });

  const result: LogoGeometry = { parts, aspect: size.x / size.y, width: size.x, height: size.y };
  cache.set(key, result);
  return result;
}
