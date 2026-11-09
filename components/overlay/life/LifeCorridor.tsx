"use client";

import { brands } from "@/content/brands";
import { copy } from "@/content/site";
import { worldText } from "@/content/worlds";
import { worldHref } from "@/lib/routes";
import { lifeAppSectionId } from "@/worlds/corridors";
import { AppCardView } from "../AppCardView";
import { useCorridorPanels } from "../corridor/useCorridorPanels";
import { FlatLogo } from "../FlatLogo";
import { FlyLink } from "../FlyLink";

/**
 * The Life world as a depth corridor, like Studios (user request): the intro
 * under the hero logo, one panel per app, the "Next" teaser and the outro,
 * every 8 units down -Z (worlds/corridors.ts). Same copy as before
 * (content/worlds.ts `life.page`).
 */
export function LifeCorridor() {
  const panel = useCorridorPanels("life");
  const text = worldText("life");
  const page = text.page;

  return (
    <div className="corridor">
      {panel(
        "intro",
        "corridor-panel--intro",
        <>
          <p className="sr-only">{brands.life.name}</p>
          <FlatLogo id="life" className="flat-logo--hero" />
          <h1 className="world-intro__headline">{text.headline}</h1>
          <p className="world-intro__lede">{text.intro}</p>
        </>,
      )}
      {page?.apps.map((app, i) =>
        panel(
          lifeAppSectionId(i),
          "corridor-panel--app",
          <>
            {/* The first app panel carries the section heading, so the app names (h3) sit under an h2. */}
            {i === 0 ? (
              <h2 className="corridor-eyebrow label-caps">{page.appsLabel}</h2>
            ) : (
              <p className="corridor-eyebrow label-caps" aria-hidden="true">
                {page.appsLabel}
              </p>
            )}
            <AppCardView app={app} />
          </>,
        ),
      )}
      {page &&
        panel(
          "next",
          "corridor-panel--contact",
          <>
            <p className="corridor-eyebrow label-caps">{page.teaser.label}</p>
            <h2 className="corridor-title">{page.teaser.title}</h2>
            <p className="corridor-text">{page.teaser.body}</p>
          </>,
        )}
      {page &&
        panel(
          "outro",
          "corridor-panel--contact",
          <>
            <h2 className="corridor-title corridor-title--large">{page.outro.title}</h2>
            <FlyLink world="hub" href={worldHref("hub")} className="outro-link label-caps">
              {copy.nav.backToHub}
            </FlyLink>
          </>,
        )}
    </div>
  );
}
