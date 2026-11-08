#!/usr/bin/env node
/**
 * Builds preview/dist/index.html: the current phase as one self-contained page
 * (inline JS + CSS, logos as sibling files) for sharing as a claude.ai Artifact.
 *
 * Usage: npm run preview:build
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { build } from "esbuild";

const root = process.cwd();
const outDir = join(root, "preview", "dist");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(join(outDir, "brand"), { recursive: true });

// Binary assets the Artifact host will not serve (.glb) are embedded as base64
// and parsed in-page by lib/inlineAssets.ts. Keys match assetUrl() here (base ".").
const brandDir = join(root, "public", "brand");
const inlineAssets = {};
for (const file of readdirSync(brandDir).filter((f) => f.endsWith(".glb"))) {
  inlineAssets[`./brand/${file}`] = readFileSync(join(brandDir, file)).toString("base64");
}

// 1. JS: one IIFE bundle (the lazy 3D chunk is inlined; fine for a preview).
const result = await build({
  entryPoints: [join(root, "preview", "main.tsx")],
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  jsx: "automatic",
  write: false,
  legalComments: "none",
  logLevel: "warning",
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.NEXT_PUBLIC_ASSET_BASE": '"."',
    // The preview has no deploy-specific origin; content/site.ts falls back to its default.
    "process.env.NEXT_PUBLIC_SITE_URL": "undefined",
    __INLINE_ASSETS__: JSON.stringify(inlineAssets),
  },
});
// Inline scripts must not contain a literal closing script tag.
const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

// 2. CSS: Tailwind v4 CLI over the same globals.css the app uses.
const cssPath = join(outDir, "styles.css");
execFileSync(
  join(root, "node_modules", ".bin", "tailwindcss"),
  ["-i", join(root, "preview", "preview.css"), "-o", cssPath, "--minify"],
  { stdio: "inherit" },
);
const css = readFileSync(cssPath, "utf8");
rmSync(cssPath);

// 3. SVG logos are fetched at runtime by SVGLoader, so they ship as files.
for (const file of readdirSync(brandDir).filter((f) => !(`./brand/${f}` in inlineAssets))) {
  copyFileSync(join(brandDir, file), join(outDir, "brand", file));
}

// App artwork (public/apps) ships as files too.
const appsDir = join(root, "public", "apps");
mkdirSync(join(outDir, "apps"), { recursive: true });
for (const file of readdirSync(appsDir)) copyFileSync(join(appsDir, file), join(outDir, "apps", file));

// 4. Page. The loader markup is static so it is the first paint, before the
// bundle has parsed; React then renders the identical Loader over it.
const html = `<title>Babu Studios</title>
<meta name="description" content="Babu Studios: a boutique studio for immersive websites and apps.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500&display=swap">
<style>${css}</style>
<div id="root"><div class="loader fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-bg"><span aria-hidden="true" class="label-caps text-[11px] text-fg">Babu Studios</span><span aria-hidden="true" class="loader__track"><span class="loader__line"></span></span></div></div>
<script>${js}</script>
`;
writeFileSync(join(outDir, "index.html"), html);
console.log(`preview/dist/index.html  ${(html.length / 1024).toFixed(0)} KB`);
