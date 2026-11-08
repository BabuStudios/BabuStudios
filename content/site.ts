import { defaultLocale, type Locale } from "./locale";

/** Site-wide copy (loader, hub). All strings are keyed per locale. */
export interface SiteCopy {
  loader: {
    label: string;
    /** Announced to screen readers while loading. */
    status: string;
  };
  hub: {
    heading: string;
    intro: string;
    scrollCue: string;
    /** Accessible name of the sub-brand navigation. */
    brandNavLabel: string;
  };
  menu: {
    /** Accessible name of the main menu. */
    label: string;
    contact: string;
    policies: string;
  };
  nav: {
    backToHub: string;
    /** The skip link, the first tab stop. */
    skipToContent: string;
  };
  stores: {
    appStore: string;
    googlePlay: string;
    /** Link to a web app's own site. */
    website: string;
    /** Screen-reader note on links that open a new tab. */
    newTab: string;
  };
}

export const siteCopy: Record<Locale, SiteCopy> = {
  en: {
    loader: {
      label: "Babu Studios",
      status: "Loading the experience",
    },
    hub: {
      heading: "Babu Studios",
      intro:
        "A boutique studio for immersive websites and apps. Meet the family: Babu Life, Babu Studios, Babu Business and Babu Entertainment.",
      scrollCue: "Scroll",
      brandNavLabel: "Babu brands",
    },
    menu: {
      label: "Main",
      contact: "Contact",
      policies: "Policies",
    },
    nav: {
      backToHub: "Back to Babu",
      skipToContent: "Skip to content",
    },
    stores: {
      appStore: "App Store",
      googlePlay: "Google Play",
      website: "Visit the site",
      newTab: "(opens in a new tab)",
    },
  },
};

export const copy: SiteCopy = siteCopy[defaultLocale];

/**
 * The site's public origin, used for canonical URLs, Open Graph and the
 * sitemap. PLACEHOLDER until the domain is confirmed; override per deploy
 * with NEXT_PUBLIC_SITE_URL.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://babustudios.se";
export const SITE_NAME = "Babu Studios";

/** The shared social image (app/opengraph-image.png, 1200×630). */
export const SHARE_IMAGE = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: "Babu Studios logo on warm beige",
};
