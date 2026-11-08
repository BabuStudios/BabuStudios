"use client";

import { lazy, type ReactNode, Suspense, useEffect, useRef } from "react";
import { renderModeFromProbe } from "@/lib/webgl";
import { useExperience } from "@/store/useExperience";
import { FallbackDirector } from "@/components/system/FallbackDirector";
import { SceneErrorBoundary } from "./SceneErrorBoundary";

// Lazy so three.js and R3F load in their own chunk, after the HTML and the
// loader have painted. Keeps the hub's first-load JS lean. The static fallback
// never downloads it.
const Experience = lazy(() => import("./Experience"));

const switchToFallback = () => useExperience.getState().setRenderMode("fallback");

/**
 * Persistent layout shell: a fixed full-screen canvas behind the DOM overlay.
 * Pointer events are captured on the shell root (the canvas's eventSource), so
 * overlay elements never block hover/click on 3D objects.
 *
 * The head probe (lib/webgl.ts) has already checked for WebGL. Without it (or if the renderer
 * crashes or loses its context) the site switches to the static fallback:
 * `html[data-render="fallback"]` turns every page into a plain document with
 * flat SVG logos, and FallbackDirector handles navigation.
 */
export function ExperienceShell({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const renderMode = useExperience((s) => s.renderMode);
  const flying = useExperience((s) => s.transitionState !== "idle");

  useEffect(() => {
    useExperience.getState().setRenderMode(renderModeFromProbe());
  }, []);

  useEffect(() => {
    // Mirrors later switches (a renderer crash or lost context) onto <html>.
    if (renderMode !== "pending") document.documentElement.dataset.render = renderMode;
  }, [renderMode]);

  return (
    <div ref={root} className="relative min-h-dvh">
      <div className="fixed inset-0 z-0" aria-hidden="true">
        {renderMode === "webgl" && (
          <SceneErrorBoundary onError={switchToFallback}>
            <Suspense fallback={null}>
              <Experience eventSource={root} onContextLost={switchToFallback} />
            </Suspense>
          </SceneErrorBoundary>
        )}
      </div>
      {renderMode === "fallback" && <FallbackDirector />}
      {/* World content (not the header) is hidden while a flight runs. */}
      <div className="world-content relative z-10" data-flying={flying ? "" : undefined}>
        {children}
      </div>
    </div>
  );
}
