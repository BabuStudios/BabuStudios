"use client";

import { brands } from "@/content/brands";
import { studiosText } from "@/content/studios";
import { worldText } from "@/content/worlds";
import { useCorridorPanels } from "../corridor/useCorridorPanels";
import { FlatLogo } from "../FlatLogo";

/** The Studios world's sections as panels along its Z corridor (see useCorridorPanels). */
export function StudiosCorridor() {
  const panel = useCorridorPanels("studios");

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
