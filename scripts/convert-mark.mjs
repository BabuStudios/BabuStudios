#!/usr/bin/env node
/**
 * Converts the 3D logo source (OBJ or USD) into a compact GLB the browser
 * loads with GLTFLoader.
 *
 * Usage: node scripts/convert-mark.mjs [<in.obj|in.usdc> <out.glb>]
 * With no arguments it converts every logo in JOBS (assets/source → public/brand).
 *
 * What it does
 *  - Parses with three's own OBJLoader / USDLoader.
 *  - Keeps mesh geometry only (lights, materials, curves are ignored). Each
 *    mesh becomes one part with a *role*: "accent" if its name contains "gold",
 *    otherwise "base". Colours are NOT taken from the file; the runtime colours
 *    each role from the brand tokens (content/brands.ts).
 *  - Keeps the source orientation: the logo lies in the XY plane with depth
 *    along +Z (front caps face +Z, i.e. the camera). USD's Z-up → Y-up stage
 *    rotation is deliberately ignored for the same reason.
 *  - Computes creased normals when the file has none (OBJ from trimesh): faces
 *    meeting at more than 30° get a hard edge (cap/side), curved sides stay
 *    smooth. Then welds vertices, centres the whole logo on the origin and
 *    scales it to a height of 1.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";

const root = process.cwd();
const three = join(root, "node_modules", "three");
const { Box3, Vector3 } = await import(join(three, "build", "three.module.js"));
const { OBJLoader } = await import(join(three, "examples", "jsm", "loaders", "OBJLoader.js"));
const { USDLoader } = await import(join(three, "examples", "jsm", "loaders", "USDLoader.js"));
const { mergeVertices, toCreasedNormals } = await import(
  join(three, "examples", "jsm", "utils", "BufferGeometryUtils.js")
);

/** Every 3D logo in the project. `npm run convert:mark` (no args) converts all of them. */
const JOBS = [
  ["babu-studios-mark.usdc", "babu-studios-mark-3d.glb"], // the B
  ["babu-studios-logo-3d.obj", "babu-studios-wordmark-3d.glb"], // Babu / rule / STUDIOS
  // Sub-brand 3D wordmarks were replaced by flat SVGs (user decision);
  // their sources are kept in assets/source/archive.
];

function convert(input, output) {
  const CREASE_ANGLE = (30 * Math.PI) / 180;

  // ---- Parse ----
  const bytes = readFileSync(input);
  const ext = extname(input).toLowerCase();
  let scene;
  if (ext === ".obj") {
    scene = new OBJLoader().parse(bytes.toString("utf8"));
  } else if ([".usd", ".usda", ".usdc", ".usdz"].includes(ext)) {
    scene = new USDLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  } else {
    throw new Error(`Unsupported format: ${ext}`);
  }

  const meshes = [];
  scene.traverse((object) => object.isMesh && meshes.push(object));
  if (meshes.length === 0) throw new Error(`No meshes in ${input}`);

  // ---- Geometry per part ----
  const parts = meshes.map((mesh) => {
    let geometry = mesh.geometry.clone();
    for (const name of Object.keys(geometry.attributes)) {
      if (name !== "position" && name !== "normal") geometry.deleteAttribute(name);
    }
    if (!geometry.getAttribute("normal")) geometry = toCreasedNormals(geometry, CREASE_ANGLE);
    geometry = mergeVertices(geometry, 1e-5);
    const name = mesh.name || "part";
    return { name, role: /gold/i.test(name) ? "accent" : "base", geometry };
  });

  // Normalise all parts together: centre the whole logo, height 1.
  const bounds = new Box3();
  for (const { geometry } of parts) {
    geometry.computeBoundingBox();
    bounds.union(geometry.boundingBox);
  }
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  for (const { geometry } of parts) {
    geometry.translate(-center.x, -center.y, -center.z);
    geometry.scale(1 / size.y, 1 / size.y, 1 / size.y);
    geometry.computeBoundingBox();
  }

  // ---- Minimal GLB writer (glTF 2.0): one node + mesh + material per part ----
  const pad4 = (n) => (n + 3) & ~3;
  const chunks = [];
  let byteLength = 0;
  const bufferViews = [];
  const accessors = [];
  const addView = (array, target) => {
    chunks.push({ array, offset: byteLength });
    bufferViews.push({ buffer: 0, byteOffset: byteLength, byteLength: array.byteLength, target });
    byteLength = pad4(byteLength + array.byteLength);
    return bufferViews.length - 1;
  };

  const gltfParts = parts.map(({ name, role, geometry }) => {
    const positions = geometry.getAttribute("position").array;
    const normals = geometry.getAttribute("normal").array;
    const count = positions.length / 3;
    const indices = count < 65536 ? Uint16Array.from(geometry.index.array) : Uint32Array.from(geometry.index.array);
    const { min, max } = geometry.boundingBox;
    accessors.push({ bufferView: addView(positions, 34962), componentType: 5126, count, type: "VEC3", min: min.toArray(), max: max.toArray() });
    const position = accessors.length - 1;
    accessors.push({ bufferView: addView(normals, 34962), componentType: 5126, count, type: "VEC3" });
    const normal = accessors.length - 1;
    accessors.push({
      bufferView: addView(indices, 34963),
      componentType: indices instanceof Uint16Array ? 5123 : 5125,
      count: indices.length,
      type: "SCALAR",
    });
    return { name, role, position, normal, index: accessors.length - 1, count, triangles: indices.length / 3 };
  });

  const roles = [...new Set(gltfParts.map((p) => p.role))];
  const gltf = {
    asset: { version: "2.0", generator: "babu-studios convert-mark" },
    scene: 0,
    scenes: [{ nodes: gltfParts.map((_, i) => i) }],
    // The role travels as the material name; the runtime maps it to brand colours.
    materials: roles.map((role) => ({ name: role })),
    nodes: gltfParts.map((p, i) => ({ name: p.name, mesh: i })),
    meshes: gltfParts.map((p) => ({
      name: p.name,
      primitives: [
        { attributes: { POSITION: p.position, NORMAL: p.normal }, indices: p.index, material: roles.indexOf(p.role) },
      ],
    })),
    buffers: [{ byteLength }],
    bufferViews,
    accessors,
  };

  const bin = new Uint8Array(byteLength);
  for (const { array, offset } of chunks) bin.set(new Uint8Array(array.buffer, array.byteOffset, array.byteLength), offset);
  const json = new TextEncoder().encode(JSON.stringify(gltf));
  const jsonChunk = new Uint8Array(pad4(json.length)).fill(0x20);
  jsonChunk.set(json);
  const total = 12 + 8 + jsonChunk.length + 8 + bin.length;
  const glb = new DataView(new ArrayBuffer(total));
  let o = 0;
  const u32 = (v) => {
    glb.setUint32(o, v, true);
    o += 4;
  };
  u32(0x46546c67); // "glTF"
  u32(2);
  u32(total);
  u32(jsonChunk.length);
  u32(0x4e4f534a); // "JSON"
  new Uint8Array(glb.buffer, o, jsonChunk.length).set(jsonChunk);
  o += jsonChunk.length;
  u32(bin.length);
  u32(0x004e4942); // "BIN\0"
  new Uint8Array(glb.buffer, o, bin.length).set(bin);
  writeFileSync(output, new Uint8Array(glb.buffer));

  console.log(output);
  for (const p of gltfParts) console.log(`  ${p.name} [${p.role}]: ${p.count} vertices, ${p.triangles} triangles`);
  console.log(
    `  aspect ${(size.x / size.y).toFixed(3)}, depth ${(size.z / size.y).toFixed(3)} of height, ${(total / 1024).toFixed(0)} KB`,
  );
}

const args = process.argv.slice(2);
if (args.length === 2) convert(args[0], args[1]);
else if (args.length === 0) {
  for (const [source, target] of JOBS) {
    convert(join(root, "assets", "source", source), join(root, "public", "brand", target));
  }
} else throw new Error("Usage: node scripts/convert-mark.mjs [<in.obj|in.usdc> <out.glb>]");
