#!/usr/bin/env node
/**
 * Extracts the colour palette from each brand logo SVG in public/brand.
 *
 * Usage: npm run palettes
 *
 * For every SVG it collects fill/stroke/stop-color values (attributes,
 * inline `style`, and <style> blocks), normalises them to lowercase 6-digit
 * hex, and ranks them by how often they occur. The output is a report;
 * the curated tokens live in content/brands.ts and must be updated by hand
 * (primary = dominant non-neutral colour, accent = second, etc.).
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const BRAND_DIR = join(process.cwd(), "public", "brand");
const FILES = [
  "babu-studios.svg",
  "babu-life.svg",
  "babu-entertainment.svg",
  "babu-business.svg",
];

const NAMED = { white: "#ffffff", black: "#000000" };

/** Normalise #rgb / #rrggbb / rgb(r,g,b) / named colours to #rrggbb. */
function normalise(raw) {
  const v = raw.trim().toLowerCase();
  if (v === "none" || v === "transparent" || v.startsWith("url(")) return null;
  if (v === "currentcolor") return null;
  if (NAMED[v]) return NAMED[v];
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(v);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  if (/^#[0-9a-f]{6}$/.test(v)) return v;
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(v);
  if (rgb) {
    return (
      "#" +
      rgb
        .slice(1, 4)
        .map((n) => Number(n).toString(16).padStart(2, "0"))
        .join("")
    );
  }
  return null;
}

/** Rough "is this a neutral" test so we can flag greys/whites/blacks. */
function isNeutral(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return Math.max(r, g, b) - Math.min(r, g, b) < 18;
}

const PATTERNS = [
  /(?:fill|stroke|stop-color)\s*=\s*"([^"]+)"/g,
  /(?:fill|stroke|stop-color)\s*:\s*([^;"}]+)/g,
];

for (const file of FILES) {
  const path = join(BRAND_DIR, file);
  if (!existsSync(path)) {
    console.log(`\n${file}: MISSING`);
    continue;
  }
  const svg = readFileSync(path, "utf8");
  const placeholder = svg.includes('data-placeholder="true"');
  const counts = new Map();
  for (const re of PATTERNS) {
    for (const m of svg.matchAll(re)) {
      const hex = normalise(m[1]);
      if (hex) counts.set(hex, (counts.get(hex) ?? 0) + 1);
    }
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`\n${file}${placeholder ? "  (PLACEHOLDER)" : ""}`);
  if (ranked.length === 0) console.log("  no explicit colours found");
  for (const [hex, n] of ranked) {
    console.log(`  ${hex}  x${n}${isNeutral(hex) ? "  (neutral)" : ""}`);
  }
}
