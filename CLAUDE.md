@AGENTS.md

# Babu Studios website

A cinematic, scroll-driven 3D site for Babu Studios (a boutique studio for immersive websites and apps). The visitor travels along -Z through a calm, luminous beige space. The hub shows the Babu Studios logo, which docks into the header on scroll while three sub-brand logos (Life, Entertainment, Business) emerge. Clicking a logo flies the camera into that brand's world.

Feeling: expensive, quiet, precise, weightless. Restraint over effects.

## Phase status

| Phase | Scope | Status |
|---|---|---|
| 0 | Setup & audit | Done |
| 1 | Hub & alive logo | Done |
| 2 | Dock & reveal (3D→DOM logo handoff) | Done |
| 3 | Fly-in transitions, routing, deep links | Done |
| 4 | Brand worlds | Done |
| 5 | Polish | Done |
| 6 | Quality pass (a11y, fallback, perf, Lighthouse) | **Done**, awaiting review |

Stop and report to the user after every phase: run it in a browser, fix console errors, summarize what was built, what feels off, and what is needed.

## Stack (exact pins, verified Phase 0, 2026-11-08)

next 16.4.5 (App Router, Turbopack, `cacheComponents` + `partialPrefetching` on) · react / react-dom 19.3.1 · typescript 5.9.3 (strict) · three 0.187.0 · @react-three/fiber 9.8.2 · @react-three/drei 10.7.9 · @react-three/postprocessing 3.2.2 · postprocessing 6.39.6 · gsap 3.15.1 · lenis 1.3.27 · zustand 5.1.0 · maath 0.10.8 · tailwindcss 4.3.5.

Version constraints to respect when upgrading:
- R3F 9.8 requires `react >=19 <19.4`.
- postprocessing 6.39 requires `three <0.188`.
- TypeScript stays on 5.x: Next 16.4 scaffolds with `^5`; TS 6/7 are not used.

If an upgrade causes a peer conflict, stop and ask; never use `--force` or `--legacy-peer-deps`.

## Commands

- `npm run dev`: dev server
- `npm run build`: production build (must be free of errors and warnings)
- `npm run typecheck`: `next typegen && tsc --noEmit` (route types such as `LayoutProps` are generated)
- `npm run lint`
- `npm run palettes`: list the colours found in each `public/brand/*.svg`
- `npm run convert:mark`: convert every 3D logo source in `assets/source` (list: `JOBS` in `scripts/convert-mark.mjs`; `.obj` and `.usd/.usdc/.usdz` are supported) into `public/brand/*.glb` (meshes only, creased normals when missing, welded, centred, height 1). With two args it converts one file. Re-run after every new export.
- `npm run preview:build`: build `preview/dist/index.html`, a self-contained page (same components, no Next.js) that is published as a claude.ai Artifact for review. The user reviews progress through this Artifact; there is no git remote yet.

## Architecture rules

1. **One persistent `<Canvas>`** mounted in `app/layout.tsx`. It is never unmounted on route change; routes only change which world is active.
2. **World registry**: `worlds/{hub,studios,life,entertainment,business}` each export a scene component plus metadata (z-length, palette, sections). A `WorldManager` mounts the active world(s); during transitions the outgoing and incoming worlds may both render.
3. **Camera rig**: a single `CameraRig` reads `scrollProgress` and `transition` from Zustand and positions the camera along the active world's CatmullRom path (-Z with slight organic drift). All camera movement is damped (`maath/easing`).
4. **Scroll**: Lenis drives a tall invisible scroll container per world (height derived from z-length) and writes normalized progress into Zustand. Never read DOM scroll inside `useFrame`.
5. **Store** (`store/useExperience.ts`): `activeWorld`, `targetWorld`, `transitionState: 'idle' | 'flyingIn' | 'flyingOut'`, `scrollProgress`, `hoveredBrand`, `quality: 'high' | 'medium' | 'low'`, `logoDocked`. Zustand is the only bridge between the DOM/scroll and the scene.
6. **Logos in 3D**: `SVGLoader` produces flat or very shallowly extruded meshes that keep their per-path colours. Cache the geometries, with a textured-plane fallback.
7. **DOM overlay** holds all text, links, the header and CTAs (crisp, accessible, indexable). Every 3D interactive has a matching focusable `<a>`/`<button>`.
8. **Code quality**: small components, typed config, no `any`, and comments on non-obvious math (camera paths, 3D→DOM handoff).

### Rendering decisions

- **No tone mapping** (`flat` on the Canvas or `NoToneMapping`), with sRGB output. With R3F's default ACES, fogged objects are tone-mapped but the clear colour isn't, so distant objects would not fade into exactly `#F2EFE9`.
- Clear colour, fog colour and HTML background all come from `theme.background` in `content/brands.ts`. `app/layout.tsx` injects it as the `--bg` CSS var.
- DPR clamp `[1, 2]` (`[1, 1.5]` on mobile). drei `PerformanceMonitor` steps quality down. Particles are instanced. Dispose of world assets on unmount.

### Known framework behaviours

- **Cache Components keeps routes alive with React `<Activity>`**: Next preserves up to 3 visited routes hidden (`display: none`) instead of unmounting them. Route `page.tsx` components must therefore not own 3D/scroll lifecycle via mount and unmount effects. Drive the world from the pathname in the persistent layout, or use `useLayoutEffect` cleanup, which runs when a route is hidden. See `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md`.
- R3F 9.8.2 constructs `THREE.Clock` internally, which logs a three r183+ deprecation warning in the console. This is upstream, not our code. Fix it when R3F ships a `Timer`-based release (or filter it).

## Art direction (non-negotiable)

- Background **`#F2EFE9`** everywhere, in every world, never changing. It is a light world: no black backgrounds and no neon bloom.
- Depth comes from beige exponential fog, soft contact shadows, subtle DOF, film grain at 4% opacity or less, a very soft vignette, and at most a high-threshold bloom on gold only.
- Brand colours are accents only (light tint, particles, type highlights, UI details), never background fills.
- Montserrat via `next/font` (`--font-montserrat`): headlines 500; labels and eyebrows 300, uppercase, tracking 0.2–0.35em.
- Motion is expo/quart eased, never linear and never bouncy. Scroll motion is scrubbed and smoothed. Micro-interactions take 200–400 ms.
- Avoid glassmorphism, gradient blobs, the stock "AI" look, emoji, rainbow particles, and gratuitous rotating 3D text.

## Palette tokens (`content/brands.ts`)

All colours are referenced through these tokens and are never hard-coded in components. `ink` is a darker, text-safe variant (4.5:1 or better on beige).

| Brand | primary | accent | secondary | ink | Source |
|---|---|---|---|---|---|
| Global | bg `#F2EFE9` | text `#000000` (black) | | | brief; navy replaced by user |
| Studios | `#C99422` gold (from logo) | `#000000` black (from logo) | `#F2EFE9` cream | `#86610F` | real logo; brief's `#B38532` superseded. `base` `#000000` = logo lettering |
| Life / Entertainment / Business | same as Studios | | | | **user decision**: start-page palette. Their real SVGs are recoloured into these tokens at render time |

Contrast on beige: black 18.3:1, gold `#C99422` 2.4:1 (decorative only; use `ink` for text).

**User decision:** everything the brief made navy (`#0D1B2F`) is now **black `#000000`**, matching the logo. Do not reintroduce navy.

## Brand assets

- `babu-studios.svg`: **real logo** (user upload "OG_LOGO_v2"). It is a tall lockup (aspect about 0.47): a B mark, the "Babu" wordmark, a gold rule and "STUDIOS". One black even-odd path holds the mark and lettering; one gold path holds the rule. Size it with `fitLogoHeight(aspect, maxW, maxH)`, never a fixed height.
- `babu-{life,entertainment,business}.svg`: **real flat SVG wordmarks** (user uploads; they replaced both the placeholder marks and the Entertainment/Business 3D wordmarks: "använd dessa istället för 3d objekt"). Each is "Babu" / gold rule / brand name. The files' own colours differ (Life: navy `#121f33` + `#bf994a`; Entertainment/Business: black + `#B38532`). In WebGL they are **drawn in the palette tokens** via `Logo3D palette` → `brandColorFor` (dark → `base` black, gold → `primary` `#C99422`), so the family matches Studios. **Life's file had a full-canvas `#eee9e3` background path; it was removed** when the file was installed (it would render as a beige slab).
- **Shared scale:** all three files are drawn at the same scale ("Babu" ≈ 125 SVG units tall in each). `SubBrands` therefore uses **one** units→world factor for all three, so "Babu" is the same size everywhere; the factor is the largest at which every logo fits its layout box (the wide Entertainment wordmark sets it). `LogoGeometry` exposes `width`/`height` in SVG units for this.
- The archived 3D sub-brand OBJs live in `assets/source/archive` (not converted, not shipped).
- `placeholder` is now `false` for all brands, so the hub shows no DOM labels under the logos (the names are in the logos; links keep their aria-label).

## Implementation notes (Phase 1)

- Mutate three.js objects in `useFrame` through refs (mesh ref → material, or `useImperativeHandle` like `Logo3D`'s `sheenRef`). The React Compiler lint rules (`react-hooks/immutability`) reject mutating `useMemo` values.
- Use `shapePath.toShapes()`, not the deprecated `SVGLoader.createShapes()` (three r185+).
- Logo materials are unlit `MeshBasicMaterial` (exact brand colour, fog still applies), with a sheen injected via `onBeforeCompile` (`lib/logoMaterial.ts`).
- Particles: one `InstancedBufferGeometry` draw; drift, cursor repel, parallax and fog all run in the vertex shader (`components/canvas/particleShaders.ts`).
- The canvas chunk is lazy (`ExperienceShell`). Hub first-load JS is 135 KB gzipped; the 3D chunk adds 252 KB gzipped, loaded during the loader.

## 3D logo (user requests after Phase 1)

- The hub shows the **3D logo** from `brands.studios.mark3d` instead of the flat SVG lockup; without it, it falls back to the SVG (`worlds/hub/HubScene.tsx`).
- **History:** first the Blender B mark; then the user swapped to the OBJ wordmark; then asked to put the B **above** the wordmark ("lägg B loggan ovanför").
- **Stacking:** `Lockup3D` places the B above the wordmark using the flat SVG's exact proportions (`lib/lockup.ts`: B 670 units tall, gap 82, wordmark 268, shared centre line; lockup aspect 0.513). Both GLBs' aspect ratios match the SVG artwork. Their **front faces are aligned** at z = 0 even though their depths differ. `brands.studios.logo3d = { mark, wordmark }`.
- **Current sources** (both kept, both converted by `npm run convert:mark`):
  - `babu-studios-mark.usdc` → `babu-studios-mark-3d.glb`: the bevelled **B mark** (Blender, 6,580 triangles, depth 12%).
  - `babu-studios-logo-3d.obj` → `babu-studios-wordmark-3d.glb`: a trimesh OBJ, the **wordmark lockup "Babu" / gold rule / "STUDIOS" (no B mark)**. It has two objects, `babu_text_black` (6,740 triangles) and `gold_line` (44 triangles). There are no normals and no UVs, and the `.mtl` was not supplied. Aspect is 1.79, depth 7% of height, and the logo lies in the XY plane with front caps facing +Z (winding verified).
- **Converter:** each mesh becomes a part with a role (`accent` if the name contains "gold", else `base`), written as the GLB material name. **Colours come from brand tokens, never the file:** `base` uses `palette.base` (logo black `#000000`) and `accent` uses `palette.primary` (gold).
- **Materials** (`lib/markMaterial.ts`): `base` is **black lacquer** (dielectric, roughness 0.15, clear coat; black *metal* would render as a dead silhouette). `accent` is **polished gold** (metal, roughness 0.28) with an emissive floor of 0.55 in the same gold, so it stays brand gold in the dark studio.
- **Sizing:** the stacked lockup uses the same hub fit box as the flat SVG lockup (50% of visible height, 52% of width).
- **Lighting** is `StudioEnvironment`: a procedural env map (no HDR) with a **near-black backdrop**. A beige backdrop would lift the black to grey, since there is no tone mapping. It contains a softbox, a key strip, a rim strip, a horizon band behind the camera (the permanent gloss on the upper faces, intensity 0.9, kept faint because the large B mirrored it as a hard grey band) and a **moving sweep strip** (replaces the shader sheen). The env is live on medium/high quality and static on low (no sweep). Constants are in `STUDIO` (`lib/scene.ts`).
- **Testing:** headless software GL is too slow to film the live env. Render static frames instead: low quality plus reduced motion parks the strip, and patching `parkedX:-14` in the built page places it. `preview/main.tsx` exposes `window.__babuStore` for this.
- The Artifact host does not serve `.glb`, so `preview:build` inlines GLBs as base64 (via the esbuild define `__INLINE_ASSETS__`) and `InlineAwareGLTFLoader` (`lib/inlineAssets.ts`) parses them in-page. The Next app fetches the file normally.
- The DOM header logo in Phase 2 still uses the SVG lockup.

## Implementation notes (Phase 2)

- **Scroll:** `ScrollManager` (layout) runs Lenis (`lerp 0.09`, `autoRaf`) and writes `scrollProgress` (0..1). With reduced motion it uses native scroll. It also registers `scrollTo(progress)` in the store. The hub's scroll length is `zLength × SCROLL_VH_PER_UNIT` vh (`worlds/hub/meta.ts`), set as the height of the hub `<main>`.
- **Timeline:** `lib/hubTimeline.ts` holds pure functions of scroll progress. The dock runs over 0 → 0.35 (easeInOutQuart). The three sub-brands reveal from 0.10 with a 0.08 stagger and a 0.40 span (easeOutQuart). The hub is at rest from 0.8. Scrolling up replays everything in reverse.
- **Camera:** `CameraRig` samples the active world's CatmullRom `cameraPath` (from `WorldMeta`) with `getPointAt(progress)`, damps it (0.18 s), looks down -Z nudged 40% toward the drift, and runs at **useFrame priority -1** plus `camera.updateMatrixWorld()`, so later projections in the same frame use the final camera.
- **Dock and hand-off** (`worlds/hub/StudiosLogo.tsx`, `lib/dock.ts`): the whole logo pose is interpolated from rest (world (0,0,-4)) to a camera-relative docked pose that projects exactly onto the DOM header box (`dockMetrics`: the **B alone**, desktop top 96 px, height 84 px; under 640 px wide, top 64 px, height 64 px; distance 1.5). While docking, the float/tilt fade out, the shadow fades over the first third, and the reflections fade to **flat brand colours** over the second half (`setMarkFlatness`). three.js only applies `envMapIntensity` to a material's own `envMap`, so the studio map is assigned per material. At dock ≥ 0.999 the store sets `logoDocked`. `DockedLogo` (crisp SVG, viewBox cropped to the lockup box) fades in over 150 ms, and the 3D logo is hidden 160 ms later. On scroll-up the 3D logo shows again immediately and the DOM logo fades out. Verified pixel-aligned at 1440×900.
- **Sub-brands** (`worlds/hub/SubBrands.tsx`, layout in `SUB_BRAND_LAYOUT`): landscape is an arc at z about -11; portrait (w/h < 0.85) is a vertical stack. Every logo must fit its box (arc 2.1 × 0.95, stack 1.9 × 0.78) at one shared scale (see Brand assets). Muting on hover uses `setMuted` on the flat logos' basic materials. They rise from 18 units back and 1.2 below, and float out of phase. Hover/focus lifts the chosen logo +0.6 toward the camera and recedes the others (-0.35) and mutes them (grey, 45% toward the background; `setMuted`). The particles tint toward the hovered brand's primary.
- **DOM tracking:** each frame the scene writes each sub-brand's screen box into store `anchors` (mutated in place, never subscribed). `BrandLinks` runs its own rAF loop that moves real `<a>` links (with labels underneath) onto those boxes. Hover and focus are handled on the links, not by raycasting. Focusing a link before the reveal scrolls to `HUB_TIMELINE.rest`.
- **MenuBar** (`components/overlay/MenuBar.tsx`, user request): a fixed menu row at the very top, above the docked logo. It holds Studios, Life, Entertainment, Business (labels from `brands`) and Contact (→ `/studios#contact`, copy in `content/site.ts` `menu`). Montserrat 300 caps; the current world gets `aria-current` and a thin gold rule (also on hover/focus). It fades in after the loader. On phones (< 640 px) the Studios item is hidden (the docked logo below is the same link) and the row scrolls sideways if it still overflows. Its links `preventDefault()` until Phase 3. DOM order is MenuBar, then DockedLogo, then content (tab order).
- `DockedLogo` comes first after the MenuBar in DOM order (tab order: menu → header logo → content).
- **Bundle (after Phase 3):** hub first-load JS is 143 KB gzipped. All JS including the lazy 3D chunk is 438 KB gzipped.

## Implementation notes (Phase 3)

- **Request → flight → swap.** Every link calls `requestWorld(world)` through `onWorldLinkClick` (`components/overlay/worldLink.ts`). Modified clicks (new tab) keep browser defaults. The store sets `targetWorld` and `transitionState` (`flyingIn` to a brand world, `flyingOut` to the hub); it ignores requests while flying or for the active world.
- **TransitionDirector** (`components/canvas/TransitionDirector.tsx`, useFrame priority **-2**) runs two time-based legs (`lib/flight.ts`, total 1.6 s):
  - **Departure (0.75 s, ease-in cubic):** toward and 2 units through the chosen sub-brand logo (`subBrandRestPosition`), or toward the docked header logo for Studios (camera-relative `dockedPose`). Leaving a brand world, it pulls back 7 units. FOV goes 45 → 60, particles streak, and the veil fades in over the last 40%.
  - **Swap, fully veiled:** `setActiveWorld`, then `scrollTo(arrivalProgress, { immediate })`. The hub re-enters at `HUB_TIMELINE.rest` (0.8); brand worlds at 0.
  - **Arrival (0.85 s, ease-out quart):** into a brand world from 7 units behind its start, or back into the hub from 1.5 units beyond the logo it was entered by (reverse portal). The FOV returns and the veil fades out over the first half.
  - It writes the mutable `flight` object, which `CameraRig` (priority -1) applies exactly; otherwise the rig follows the world path. `cameraPointAt`/`defaultLookAt` (`lib/paths.ts`) are shared, so every arrival ends exactly on the path. `TransitionVeil` is a clip-space beige quad (renderOrder 1000), drawn under the DOM header.
  - With **reduced motion** the camera does not move: a 0.22 s veil in and a 0.3 s veil out.
- **URL:** user-started flights push the URL at the **start** of the departure (`store.navigate`), so the new route renders behind the veil. `ScrollManager` locks scroll during flights (`lenis.stop()`, or `overflow: hidden` with reduced motion) and **freezes `scrollProgress`**, because the page height changes with the route. The swap resets it explicitly (`lenis.resize()` + immediate `scrollTo`).
- **Routing:** `RouteSync` (Next): `router.push(href, { scroll: false })` is registered as `navigate`. The first route calls `enterWorld` (deep link: show that world directly, with `introPending`, so the director plays an arrival-only intro once the loader is gone). Later pathname changes not caused by a flight (back/forward) call `requestWorld(world, { fromHistory: true })`. A back/forward press during a flight is caught up when the flight ends (`urlWorld` ≠ `activeWorld`). `HashSync` gives the preview the same contract with `#life`, `#entertainment`… (Artifacts only allow a plain hash), and `preview/PreviewPages.tsx` stands in for the router by rendering the page for `urlWorld`.
- **Docked state:** `setActiveWorld(brand)` sets `logoDocked = true` (brand worlds always show the header logo). Only the hub's `StudiosLogo` may write `logoDocked`, and only while `activeWorld === "hub"`; it still runs for one frame after a swap with scroll at 0, which once undocked the header in brand worlds.
- **Header behaviour:** the `DockedLogo` link goes to Studios from the hub and **back to the hub** inside any world (aria-label "Back to Babu"). Flying hub → Studios, it scales up and fades (`docked-logo--portal`). MenuBar items fly to their world; Contact flies to Studios for now (its section arrives in Phase 4). World content (`.world-content[data-flying]`) fades out during flights; the header stays.
- **Touch:** the first tap on a hub logo previews it (hover state); the second tap flies in. Mouse clicks and Enter fly directly.
- **Brand worlds (Phase 3 template):** `worlds/brandWorld.tsx` (scene) + `worlds/brandMeta.ts` (data: zLength 16, a camera path down -Z). There is one folder per brand in `worlds/{studios,life,entertainment,business}` and all five are registered in `worlds/registry.ts`. The hero logo sits 4 units ahead, centred 43% from the top (below the enlarged header logo). Wordmarks use the **shared sub-brand scale** (max 18% of the height; 36% of the width landscape, 70% portrait). **Studios shows its 3D wordmark** ("Babu" / rule / STUDIOS, `StudiosWordmarkHero`) at the **same size as the other worlds' wordmarks**: "Babu" is ~51.5% of the height in every wordmark, so it uses the mean sub-brand wordmark height at the shared scale. DOM: `BrandOverlay` (sr-only brand name, visible h1 headline, lede from `content/worlds.ts`), `BackControl` (bottom-left) and a ScrollCue that is hidden on phones in worlds. Routes are `app/{studios,life,entertainment,business}/page.tsx` with `worldMetadata` (title, description, Open Graph), all static.
- **Next keeps visited pages alive hidden** (Activity): there can be several `.back-control` elements in the DOM, but only the current page's is visible. Use `:visible` in tests.

## Scroll modes (user request after Phase 3)

- **Life, Entertainment and Business scroll as normal pages** once you have flown in ("vill inte ha Z scroll längre utan standard upp och ner scroll"). **Studios and the hub keep depth (Z) scroll.** `WorldMeta.scrollMode` is `"depth" | "vertical"`, set in `worlds/brandMeta.ts` (`VERTICAL_WORLDS`, `isVerticalWorld`).
- **Vertical camera:** `CameraRig` moves the camera straight down 1:1 with the page. One CSS px of scroll equals `2·d·tan(fov/2) / viewportHeight` world units at the content plane `CONTENT_PLANE_DISTANCE` (4, where the hero logo sits), with no extra damping, so the 3D logo stays locked to the DOM text (Lenis still smooths the scroll itself). The store publishes `scrollY` (px) next to `scrollProgress` (`setScroll`).
- **Particles** wrap vertically around the camera in the shader (`uCameraY`, `uHalfHeight`). The volume is now ±12 high, so the wrap seam lies past depth ~29 inside the fog, and the counts were raised to keep the density (1300/760/380).
- **Vertical page (DOM, `BrandOverlay`):** intro (100dvh, 3D logo above the headline), then the app card(s) (`AppCardView`: tinted placeholder media with a monogram, name, tagline, text, App Store / Google Play links as `#`, or a status such as "In development"), a teaser ("Next") and an outro with a "Back to Babu" button (`FlyLink`). All copy is in `content/worlds.ts` (`page`) and `content/site.ts` (`stores`). The page height comes from the content.
- **Compact header:** in vertical worlds, after 24 px of scroll (`useCompactHeader`), the docked logo shrinks (`compactDockMetrics`: desktop top 72, height 52; phones top 50, height 44), a beige `HeaderScrim` fades in behind the header, and the fixed `BackControl` fades out (the header logo and the outro link lead back).
- Arrivals into vertical worlds land at scroll 0 on the entry pose (`cameraPath[0]`). Departures pull back from wherever the camera is on the page.

## Header shows the B (user request: "gör studios loggan i samma storlek som dem andra men lägg B i header")

- The DOM header logo (`DockedLogo`) is the **B mark alone** (`STUDIOS_MARK_VIEWBOX` / `STUDIOS_MARK_ASPECT` in `lib/lockup.ts`, cropped from the SVG lockup), everywhere.
- In the hub the 3D lockup still glides up, but it docks so that **its B lands on the header B**: docked lockup height = `Bheight / markSlot.height`, and the lockup centre is offset by `markSlot.(x, y)·H` from the B centre. The hand-off is verified pixel-aligned (3D B vs DOM B). The wordmark no longer fades; it flies into the brand row (next section).
- The Studios wordmark appears at the size of the other wordmarks in the Studios world (see Phase 3 brand worlds). The flat SVG fallback (`SvgLockup`) has no separate wordmark, so it would dock the whole lockup at B scale.

## Hub choice layout (user request: Studios wordmark above Entertainment)

- The hub's choice composition has **four** brands (`hubBrandIds` in `content/brands.ts`, reading/tab/reveal order): **Life, Studios, Business on one line, Entertainment centred below**. On phones it is a stack: Studios, Life, Entertainment, Business. Placements are keyed by brand in `SUB_BRAND_LAYOUT.arc` / `.stack` (`worlds/hub/meta.ts`, `hubBrandRestPosition`), all at the same depth so every "Babu" renders at the same size.
- **Studios appears as its 3D wordmark without the B** (`babu-studios-wordmark-3d.glb`), drawn **fully flat** (`flatness = 1`, no reflections) so it matches the flat SVG siblings' black, at the mean sub-brand wordmark height on the shared scale. On hover it mutes through emissive (`setMarkMute`). The B stays in the header.
- The store's `anchors`, `BrandLinks` and the `TransitionDirector` all use `HubBrandId` (four brands). **Flying into Studios from the hub now aims at the Studios wordmark in the row** (like the others), also when the header B is clicked, and the return reverse-portals out of it. The old header "portal" effect is gone.

## The hero wordmark flies into the row (user request: "låt texten flyga in som logga till nästa meny")

- In the hub the lockup is split: `Lockup3D showWordmark={false}` draws the B (which docks into the header), and **`StudiosWordmarkTraveler`** (`worlds/hub/`) draws the "Babu Studios" wordmark as its own object. At travel 0 it is identical to the lockup's wordmark: same pivot (the lockup centre), the same entrance computed from the same inputs, the same `AliveGroup` params, and front faces aligned with the B.
- **Travel** `wordmarkTravel(progress)` (`lib/hubTimeline.ts`, 0.02 → 0.50, easeInOutQuart): the pivot moves from the lockup centre to `target − slot·restHeight·s_end` while the scale goes 1 → `s_end = studiosRowHeight / wordHeight`, so the wordmark lands exactly on `layout.studios` at row height. The alive motion fades out (strength 1 − w) and the reflections go flat (flatness w).
- **Hand-off:** at travel ≥ 0.999 the traveller hides and the row's Studios `BrandSlot` (`handoff`) shows at the identical pose (no rise). Its float/tilt then fades in over 1.2 s. Verified identical (traveller-only vs slot-only render). Scroll-up reverses it.
- `useHubRow()` (`worlds/hub/rowScale.ts`) holds the row's layout and shared scale for both the row and the traveller.
- **Portrait:** the traveller crosses the middle of the stack, so the other logos use `HUB_TIMELINE.portraitReveal` (start 0.42, stagger 0.05, span 0.24): they rise after it has passed and settle before `rest`.

## Implementation notes (Phase 4)

- **Studios corridor (depth world).** `worlds/brandMeta.ts` gives Studios its own meta: zLength 40, and a camera path down to z -39.5 with a slow sway. The sections are DOM panels anchored in 3D (`worlds/studios/sections.ts`): intro (under the hero wordmark, z -4), Premium (x -1.3, z -12), Essential (x +1.3, z -20), Selected work (z -28), Process (z -36). (A Contact panel at z -44 was moved out to its own page.) Portrait centres everything (x = 0).
- **Projection → DOM:** `SectionProjector` (mounted in the Studios scene) projects each anchor every frame into the store's `sectionFrames` (mutated in place: screen x/y and view depth). `StudiosCorridor` (`components/overlay/studios/`) runs its own rAF loop and applies `panelLook(depth)` (`lib/focus.ts`): perspective scale (1 at 4 units), opacity (hidden beyond 13 units, full by 6, then fading out between 2.6 and 1.0 while passing; panels are 8 units apart, so the next one never ghosts through the one in focus), and **DOF blur** (sharp within ±1.2 of the 4.5-unit focus, +1.1 px per unit, max 10; none with reduced motion). Panels take pointer events only when opacity > 0.85.
- **Panels are never `visibility: hidden`**, only transparent, so keyboard focus can reach them. `onFocusCapture` on a panel that is not in view calls `goToSection`, and the corridor travels there.
- **goToSection(world, id)** (store, plus `pendingSection`): flies to the world if needed; then `SectionScroller` (canvas) binary-searches the scroll progress that puts the camera 4.5 units in front of the section's z and smooth-scrolls there. (The menu's Contact used it before Contact became its own page; see below.)
- **Content:** `content/studios.ts` (offers with points, three placeholder work cards marked "Case studies coming soon", four process steps, contact). The SSR HTML of `/studios` contains every heading (h1, then h2/h3).
- **Particles** now also wrap in depth around the camera (`uCameraZ`, `uZFar`, `uDepthRange`), so long corridors never run out of dust.
- **Vertical worlds:** each section eases in when it enters the viewport (`Reveal`, IntersectionObserver). It is progressive (the hidden state only applies once JS has mounted) and has a fallback for jumps past a section.
- **Bundle (after Phase 4):** hub first-load JS is 143 KB gzipped; all JS including the lazy 3D chunk is 440 KB gzipped.

## Implementation notes (Phase 5)

- **Post FX as one DOM layer** (`FilmGrain`, `.film` in `globals.css`): film grain at 3.5% opacity (a tiled SVG `feTurbulence` noise image that jitters by `transform` in 6 steps per 0.9 s, so it is compositor-only; static with reduced motion) plus an extremely soft vignette (≤ 4.5% black at the corners). It sits **over canvas and DOM alike**: a WebGL-only vignette would darken the canvas edges but not the beige DOM surfaces (header scrim, panels), leaving seams, and it would cost a full-screen pass. **No bloom:** the gold is darker than the beige background, so a luminance threshold cannot isolate it.
- **Native mouse pointer** (user decision: "vanlig muspekare"): the custom ring cursor built in Phase 5 was removed. Do not reintroduce a custom cursor.
- **Motion tokens** (`:root` in `globals.css`): `--ease-out-expo` (entrances/reveals), `--ease-out-quart` (micro-interactions), `--ease-in-out-quart` (loops), `--dur-micro` 300 ms, `--dur-ui` 400 ms, `--dur-enter` 900 ms, `--dur-reveal` 1000 ms. Every CSS transition uses them; nothing is linear. 3D timings stay in `lib/flight.ts`, `lib/hubTimeline.ts` and `lib/alive.ts`.
- **Micro-interactions:** the app card lifts its border and shadow, with a slow monogram zoom; work cards rise 4 px with a gold edge; store/outro buttons fill softly on hover and press to 0.98.
- **Typography:** kerning and ligatures on, `optimizeLegibility`, balanced headings, and a gold-tinted text selection.

## Implementation notes (Phase 6)

- **Render mode** (store `renderMode`: `pending | webgl | fallback`). An inline `<head>` script (`WEBGL_PROBE_SCRIPT`, a serialised `probeWebGL` in `lib/webgl.ts`, so it must stay self-contained) writes `html[data-render]` **before first paint**. `ExperienceShell` reads it (the preview build has no head probe and runs the same function). `?webgl=off` forces the fallback for review and tests. A crash in the 3D tree (`SceneErrorBoundary`) or `webglcontextlost` also switches to the fallback mid-session.
- **Static fallback** (`html[data-render="fallback"]`, all CSS at the end of `globals.css`): no canvas, and the 3D chunk is never downloaded. Every page is a normal scrolling document. The hub shows the intro and a grid of flat wordmarks (Life · Studios · Business, Entertainment below; a Studios-first stack on phones); brand worlds show the flat logo above the headline; the Studios corridor panels flow as a page. `FlatLogo` (always rendered, hidden by CSS unless fallback, so CLS is 0) crops each SVG to its artwork (`lib/flatLogos.ts`; all wordmarks ≈ 242 units tall, so one CSS height keeps "Babu" equal). The flat SVGs keep their **file colours** (Life is navy there); recolouring them needs inline SVG. `FallbackDirector` keeps the store contract: navigate → 260 ms content fade → swap → scroll to top, plus `goToSection` via `[data-section]`. The header logo is docked from the start, and the compact header applies on every page.
- **A11y:** a skip link is the first tab stop (it focuses the *visible* `main`, since hidden Activity routes keep their own). Menu links have ≥ 24 px hit areas (padding cancelled by negative margins, so the layout is unchanged). Vertical worlds' apps label is an h2 (heading order).
- **Metadata:** `SITE_URL` (**placeholder** `https://babustudios.se`, override with `NEXT_PUBLIC_SITE_URL`) drives `metadataBase`, canonical URLs, Open Graph and Twitter. `app/opengraph-image.png` (1200×630 lockup on beige) is restated in `worldMetadata`, because a page's `openGraph` replaces the root's. `app/icon.png` / `apple-icon.png` show the B (the Next default favicon was removed). `app/sitemap.ts` and `app/robots.ts` exist.
- **Lighthouse (local prod build, headless Chromium):** accessibility, best practices and SEO are 100 on every route; the fallback scores performance 95 with CLS 0. Performance for the 3D routes cannot be measured meaningfully here: the container only has software GL (SwiftShader), so GPU work lands on the main thread (TBT in the tens of seconds). Measure on real devices before launch.
- **Formatting:** the files follow Prettier at `--print-width 120` (there is no config file; pass the flag).

## Contact is its own page (user request: "separera contact och babu studios till olika")

- **`/contact` is a sixth world**: `WorldId = "hub" | BrandId | "contact"`. It is a vertical world with **no 3D object** (a *page world*, see below; only the shared particles, untinted), registered in `worlds/registry.ts`, and it scrolls as a normal page. DOM: `ContactOverlay` (eyebrow, h1, lede, mailto CTA, selectable address, fixed BackControl). Copy, `CONTACT_HREF`, `CONTACT_EMAIL` (`info.babustudios@gmail.com`, confirmed by the user) and `contactMetadata()` live in `content/contact.ts`. The route is `app/contact/page.tsx`, the preview hash is `#contact`, and it is in the sitemap.
- The **menu's Contact** flies there like any world (`aria-current` when active). From the hub (no logo to aim at) the departure **glides straight ahead** 7 units (`TransitionDirector`, `from === "hub"` branch); the arrival comes in from behind like a brand world.
- **The Studios corridor lost its contact panel**: it now ends on Process (z -36). Studios `zLength` is 32 and its camera path ends at z -31.5 (4.5 in front of Process). `goToSection` / `pendingSection` remain for keyboard focus inside the corridor.

## Page worlds: Contact and Policies (user request: "Lägg till ett menyval som heter Policies")

- **Page worlds** are pages with no 3D logo: `pageWorldIds = ["contact", "policies"]` and `PAGE_HREFS` in `content/pages.ts`; `WorldId = "hub" | BrandId | PageWorldId`. They share `pageWorldMeta(id)` (vertical) and `worlds/pages` (empty scene, Studios palette), and routing (`worldHref`, `worldFromPath`/`Hash`), the particle tint (brands only) and the menu (`MENU_PAGES`, labels from `copy.menu`) treat them generically. To add another: extend `pageWorldIds`/`PAGE_HREFS`, `copy.menu`, add the overlay + `app/<id>/page.tsx`, `PreviewPages` and the sitemap.
- **Policies** (`/policies`, `#policies` in the preview) shows **Babu Studios' real Privacy Policy**, copied verbatim from https://babupolicy.vercel.app/privacy/ (the page the store listings link to; last updated 27 October 2026; sections 1–11 plus an "Apps covered" table for Snakey Fruits and Kallokollen). **Keep the two in sync.** `content/policies.ts` holds it as typed rich text (`Paragraph` = string or runs of plain / `{ strong }` / `{ text, href }`, plus an optional `table`); `PoliciesOverlay` renders it in a 680 px column (external links open in a new tab), then "Also published at …" and a closing "Back to Babu" button. Its short intro is `.page-intro` (also short in the fallback). It has **no fixed BackControl**, because the column reaches the bottom of the first screen on phones. The policy's contact address is **lejonsoder@gmail.com** (as in the source), not the site's `CONTACT_EMAIL`.
- **Menu on phones:** six items no longer fit at 390 px, so the row scrolls sideways and `MenuBar` scrolls the current item into view (the row only, never the page).

## Content

Life has two cards, **The Promptery first** (user request), then Kallokollen (placeholder copy). **The Promptery** is (a website, not a store app: `website` link to https://thepromtery.vercel.app, opens in a new tab; copy taken from the site; its artwork is the site's own share image, `public/apps/the-promptery.png`, shown whole via `AppCard.image`). `public/apps/` ships as files in the preview build (add them to the Artifact `files` map).

All copy lives in `content/*.ts`, typed and keyed, so a Swedish locale can be added later. No copy inside components. Images are neutral tinted placeholders; no stock photos.

## Routes

`/` (hub), `/studios`, `/life`, `/entertainment`, `/business`, `/contact`, `/policies`. Each has per-route metadata, and all content exists in the DOM. Deep links fly straight into the world with a short intro.
