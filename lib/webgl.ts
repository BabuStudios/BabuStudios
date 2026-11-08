/**
 * WebGL capability check for the static fallback.
 *
 * `probeWebGL` runs as an inline script in <head> (WEBGL_PROBE_SCRIPT), before
 * first paint, and writes `html[data-render]`. The fallback's CSS therefore
 * applies from the first frame, with no layout shift once React hydrates.
 * `?webgl=off` in the URL forces the fallback, so it can be reviewed on any
 * machine (and tested automatically).
 *
 * The function is serialised into the script, so it must stay self-contained
 * (no imports, no outer variables).
 */
export function probeWebGL(): void {
  const root = document.documentElement;
  try {
    const off = new URLSearchParams(window.location.search).get("webgl") === "off";
    const canvas = document.createElement("canvas");
    const gl = off ? null : (canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
    root.dataset.render = gl ? "webgl" : "fallback";
    // Free the probe context right away; browsers cap live contexts.
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    root.dataset.render = "fallback";
  }
}

export const WEBGL_PROBE_SCRIPT = `(${probeWebGL.toString()})();`;

/** The render mode the probe decided; runs it if the head script did not (the preview build). */
export function renderModeFromProbe(): "webgl" | "fallback" {
  if (!document.documentElement.dataset.render) probeWebGL();
  return document.documentElement.dataset.render === "webgl" ? "webgl" : "fallback";
}
