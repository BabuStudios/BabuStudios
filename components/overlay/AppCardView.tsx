import { copy } from "@/content/site";
import { assetUrl } from "@/lib/assets";
import type { AppCard } from "@/content/worlds";

/** One app as an editorial card: tinted placeholder media, text, store links. */
export function AppCardView({ app }: { app: AppCard }) {
  return (
    <article className="app-card">
      {app.image ? (
        <div className="app-card__media app-card__media--image">
          {/* Shown whole (contain): the artwork is wider than the card's media slot. */}
          {/* A plain <img>: the standalone preview bundle has no next/image. Width/height prevent layout shift. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="app-card__image"
            src={assetUrl(app.image.src)}
            alt={app.image.alt}
            width={app.image.width}
            height={app.image.height}
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : (
        // Neutral placeholder art in the brand colours; replace with screenshots.
        <div className="app-card__media" aria-hidden="true">
          <span className="app-card__monogram">{app.monogram ?? app.name.charAt(0)}</span>
        </div>
      )}
      <div className="app-card__body">
        <h3 className="app-card__name">{app.name}</h3>
        <p className="app-card__tagline">{app.tagline}</p>
        <p className="app-card__text">{app.body}</p>
        {app.stores ? (
          <div className="app-card__stores">
            <a className="store-link label-caps" href={app.stores.appStore}>
              {copy.stores.appStore}
            </a>
            <a className="store-link label-caps" href={app.stores.googlePlay}>
              {copy.stores.googlePlay}
            </a>
          </div>
        ) : app.website ? (
          <div className="app-card__stores">
            <a className="store-link label-caps" href={app.website} target="_blank" rel="noopener">
              {copy.stores.website}
              <span className="sr-only"> {copy.stores.newTab}</span>
            </a>
          </div>
        ) : (
          app.status && <p className="app-card__status label-caps">{app.status}</p>
        )}
      </div>
    </article>
  );
}
