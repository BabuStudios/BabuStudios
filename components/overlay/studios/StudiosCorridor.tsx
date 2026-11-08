"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { brands } from "@/content/brands";
import { studiosText } from "@/content/studios";
import { worldText } from "@/content/worlds";
import { panelLook } from "@/lib/focus";
import { useExperience } from "@/store/useExperience";
import { STUDIOS_SECTIONS, type StudiosSectionId } from "@/worlds/studios/sections";
import { FlatLogo } from "../FlatLogo";

/**
 * The Studios world's sections as DOM panels floating along the Z corridor.
 *
 * The scene projects each panel's 3D anchor every frame (SectionProjector →
 * store `sectionFrames`); this component's own rAF loop places each panel on
 * its projection and applies depth of field from its depth (lib/focus.ts):
 * perspective scale, fog-like fade in the distance, a fade-out as the camera
 * passes through, and blur away from the focus distance. All text stays real
 * DOM: crisp, selectable, accessible, indexable. Hidden panels are only
 * transparent (never `visibility: hidden`), so keyboard focus can still reach
 * them, and focusing one travels the corridor to it.
 *
 * In the static fallback there is no corridor: the panels flow as a normal
 * page (CSS, `html[data-render="fallback"]`) and the loop is off.
 */
export function StudiosCorridor() {
  const panels = useRef<Partial<Record<StudiosSectionId, HTMLElement>>>({});
  const tracking = useExperience((s) => s.renderMode === "webgl");

  useEffect(() => {
    if (!tracking) {
      for (const el of Object.values(panels.current)) el?.removeAttribute("style");
      return;
    }
    let raf = 0;
    const tick = () => {
      const { sectionFrames, reducedMotion, activeWorld } = useExperience.getState();
      if (activeWorld === "studios") {
        for (const { id } of STUDIOS_SECTIONS) {
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
  }, [tracking]);

  const register = (id: StudiosSectionId) => (el: HTMLElement | null) => {
    if (el) panels.current[id] = el;
    else delete panels.current[id];
  };

  // Keyboard: focusing something inside a panel that is not in view scrolls
  // the corridor to that panel.
  const onFocus = (id: StudiosSectionId) => () => {
    const el = panels.current[id];
    if (tracking && el && Number(el.style.opacity || 0) < 0.85) useExperience.getState().goToSection("studios", id);
  };

  const panel = (id: StudiosSectionId, className: string, children: ReactNode) => (
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

  const intro = worldText("studios");
  const t = studiosText();

  return (
    <div className="corridor">
      {panel(
        "intro",
        "corridor-panel--intro",
        <>
          <p className="sr-only">{brands.studios.name}</p>
          <FlatLogo id="studios" className="flat-logo--hero" />
          <h1 className="world-intro__headline">{intro.headline}</h1>
          <p className="world-intro__lede">{intro.intro}</p>
        </>,
      )}
      {(["premium", "essential"] as const).map((id) =>
        panel(
          id,
          "corridor-panel--offer",
          <>
            <p className="corridor-eyebrow label-caps">{t[id].eyebrow}</p>
            <h2 className="corridor-title">{t[id].title}</h2>
            <p className="corridor-text">{t[id].body}</p>
            <ul className="corridor-points">
              {t[id].points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </>,
        ),
      )}
      {panel(
        "work",
        "corridor-panel--work",
        <>
          <p className="corridor-eyebrow label-caps">{t.work.eyebrow}</p>
          <h2 className="corridor-title">{t.work.title}</h2>
          <ul className="work-grid">
            {t.work.items.map((item) => (
              <li key={item.title} className="work-card">
                {/* Neutral placeholder art in the brand colours; replace with project imagery. */}
                <div className="work-card__media" aria-hidden="true" />
                <p className="work-card__kind label-caps">{item.kind}</p>
                <h3 className="work-card__title">{item.title}</h3>
              </li>
            ))}
          </ul>
          <p className="corridor-note label-caps">{t.work.placeholderNote}</p>
        </>,
      )}
      {panel(
        "process",
        "corridor-panel--process",
        <>
          <p className="corridor-eyebrow label-caps">{t.process.eyebrow}</p>
          <h2 className="corridor-title">{t.process.title}</h2>
          <ol className="process-steps">
            {t.process.steps.map((step, i) => (
              <li key={step.title} className="process-step">
                {/* A real sequence, so the numbers carry meaning. */}
                <span className="process-step__index" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="process-step__title">{step.title}</h3>
                <p className="process-step__body">{step.body}</p>
              </li>
            ))}
          </ol>
        </>,
      )}
    </div>
  );
}
