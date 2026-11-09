"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { panelLook } from "@/lib/focus";
import { useExperience } from "@/store/useExperience";
import { CORRIDORS, type CorridorWorld } from "@/worlds/corridors";

/**
 * A world's corridor sections as DOM panels floating along Z.
 *
 * The scene projects each panel's 3D anchor every frame (SectionProjector →
 * store `sectionFrames`); this hook's own rAF loop places each panel on its
 * projection and applies depth of field from its depth (lib/focus.ts):
 * perspective scale, fog-like fade in the distance, a fade-out as the camera
 * passes through, and blur away from the focus distance. All text stays real
 * DOM: crisp, selectable, accessible, indexable. Hidden panels are only
 * transparent (never `visibility: hidden`), so keyboard focus can still reach
 * them, and focusing one travels the corridor to it.
 *
 * In the static fallback there is no corridor: the panels flow as a normal
 * page (CSS, `html[data-render="fallback"]`) and the loop is off.
 *
 * Returns `panel(id, className, children)`, which renders one section.
 */
export function useCorridorPanels(world: CorridorWorld) {
  const panels = useRef<Partial<Record<string, HTMLElement>>>({});
  const tracking = useExperience((s) => s.renderMode === "webgl");

  useEffect(() => {
    if (!tracking) {
      for (const el of Object.values(panels.current)) el?.removeAttribute("style");
      return;
    }
    let raf = 0;
    const tick = () => {
      const { sectionFrames, reducedMotion, activeWorld } = useExperience.getState();
      if (activeWorld === world) {
        for (const { id } of CORRIDORS[world]) {
          const el = panels.current[id];
          const frame = sectionFrames[id];
          if (!el || !frame) continue;
          const look = panelLook(frame.depth, reducedMotion);
          el.style.transform = `translate3d(${frame.x.toFixed(1)}px, ${frame.y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${look.scale.toFixed(4)})`;
          el.style.opacity = look.opacity.toFixed(3);
          el.style.filter = look.blur > 0.4 ? `blur(${look.blur.toFixed(1)}px)` : "";
          // Interactive only when nearly in focus.
          el.style.pointerEvents = look.opacity > 0.85 ? "auto" : "none";
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [tracking, world]);

  const register = (id: string) => (el: HTMLElement | null) => {
    if (el) panels.current[id] = el;
    else delete panels.current[id];
  };

  // Keyboard: focusing something inside a panel that is not in view scrolls
  // the corridor to that panel.
  const onFocus = (id: string) => () => {
    const el = panels.current[id];
    if (tracking && el && Number(el.style.opacity || 0) < 0.85) useExperience.getState().goToSection(world, id);
  };

  // A render helper, not a component (it renders one panel element).
  function renderPanel(id: string, className: string, children: ReactNode) {
    return (
      <section
        key={id}
        ref={register(id)}
        data-section={id}
        className={`corridor-panel ${className}`}
        onFocusCapture={onFocus(id)}
      >
        {children}
      </section>
    );
  }
  return renderPanel;
}
