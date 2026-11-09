import { type BrandId, brands } from "@/content/brands";
import { copy } from "@/content/site";
import { worldText } from "@/content/worlds";
import { worldHref } from "@/lib/routes";
import { brandWorldMeta } from "@/worlds/brandMeta";
import { SCROLL_VH_PER_UNIT } from "@/worlds/hub/meta";
import { AppCardView } from "./AppCardView";
import { BackControl } from "./BackControl";
import { ScrollCue } from "./ScrollCue";
import { FlatLogo } from "./FlatLogo";
import { FlyLink } from "./FlyLink";
import { Reveal } from "./Reveal";
import { LifeCorridor } from "./life/LifeCorridor";
import { StudiosCorridor } from "./studios/StudiosCorridor";

function Intro({ id, flow }: { id: BrandId; flow: boolean }) {
  const text = worldText(id);
  return (
    <section className={`world-intro ${flow ? "world-intro--flow" : ""}`}>
      {/* The 3D logo above already shows the name; keep it for screen readers and search. */}
      <p className="sr-only">{brands[id].name}</p>
      {/* Static fallback only: the flat logo takes the 3D logo's place. */}
      <FlatLogo id={id} className="flat-logo--hero" />
      <h1 className="world-intro__headline">{text.headline}</h1>
      <p className="world-intro__lede">{text.intro}</p>
    </section>
  );
}

/**
 * DOM layer of a brand world. The brand's logo floats in WebGL on the content
 * plane, just above the intro.
 *
 * - Vertical worlds (Entertainment, Business): a normal scrolling page,
 *   whose content defines the height; the camera follows the page 1:1.
 * - Depth worlds (Studios): the main element's height is the corridor's
 *   scroll length; the sections float along Z (StudiosCorridor, LifeCorridor).
 */
export function BrandOverlay({ id }: { id: BrandId }) {
  const meta = brandWorldMeta(id);
  const page = worldText(id).page;
  const vertical = meta.scrollMode === "vertical" && page;

  return (
    <>
      {vertical ? (
        <main id="main" className="world-page">
          <Intro id={id} flow />
          <section className="world-section">
            <Reveal className="world-section__inner">
              {/* A heading (styled as an eyebrow), so the app names (h3) sit under an h2. */}
              <h2 className="world-section__eyebrow label-caps">{page.appsLabel}</h2>
              <div className="world-section__apps">
                {page.apps.map((app) => (
                  <AppCardView key={app.name} app={app} />
                ))}
              </div>
            </Reveal>
          </section>
          <section className="world-section world-section--teaser">
            <Reveal className="world-section__inner">
              <p className="world-section__eyebrow label-caps">{page.teaser.label}</p>
              <h2 className="world-section__title">{page.teaser.title}</h2>
              <p className="world-section__text">{page.teaser.body}</p>
            </Reveal>
          </section>
          <section className="world-section world-section--outro">
            <Reveal className="world-section__inner">
              <h2 className="world-section__title">{page.outro.title}</h2>
              <FlyLink world="hub" href={worldHref("hub")} className="outro-link label-caps">
                {copy.nav.backToHub}
              </FlyLink>
            </Reveal>
          </section>
        </main>
      ) : (
        // `depth-main`: the static fallback drops the scroll length (the page flows).
        <main id="main" className="depth-main" style={{ height: `${meta.zLength * SCROLL_VH_PER_UNIT}vh` }}>
          {id === "studios" ? <StudiosCorridor /> : id === "life" ? <LifeCorridor /> : <Intro id={id} flow={false} />}
        </main>
      )}
      <BackControl />
      <ScrollCue className="scroll-cue--world" />
    </>
  );
}
