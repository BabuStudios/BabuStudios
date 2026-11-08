import type { Metadata } from "next";
import { type BrandId, brands } from "./brands";
import { defaultLocale, type Locale } from "./locale";
import { SHARE_IMAGE, SITE_NAME } from "./site";

/**
 * Copy for each brand world. Placeholder intros for now; the full sections
 * (work, process, apps…) arrive in Phase 4.
 */
export interface AppCard {
  name: string;
  /** Letter on the placeholder art; defaults to the name's first letter. */
  monogram?: string;
  /** Real artwork (a /public path) replacing the placeholder art, with its alt text. */
  image?: { src: `/${string}`; alt: string; width: number; height: number };
  tagline: string;
  body: string;
  /** Store links (placeholders "#" until the apps are live). Omit for unreleased apps. */
  stores?: { appStore: string; googlePlay: string };
  /** A web app's own site: shown as a link instead of store links. */
  website?: string;
  /** Shown instead of store links, e.g. "In development". */
  status?: string;
}

/** The scrolling page of a vertical world (Life, Entertainment, Business). */
export interface WorldPage {
  appsLabel: string;
  apps: AppCard[];
  teaser: { label: string; title: string; body: string };
  outro: { title: string };
}

export interface WorldCopy {
  headline: string;
  intro: string;
  /** Meta description / Open Graph description. */
  description: string;
  page?: WorldPage;
}

export const worldCopy: Record<Locale, Record<BrandId, WorldCopy>> = {
  en: {
    studios: {
      headline: "Websites that feel like places.",
      intro:
        "Cinematic WebGL experiences and precise WordPress builds, made by a small studio with a long attention span.",
      description: "Babu Studios designs and builds immersive websites and apps.",
    },
    life: {
      headline: "Apps for the everyday.",
      intro: "Calm, useful tools for everyday life, starting with The Promptery and Kallokollen.",
      description: "Babu Life makes calm, useful apps for everyday life.",
      page: {
        appsLabel: "Featured apps",
        apps: [
          {
            name: "The Promptery",
            monogram: "P",
            image: {
              src: "/apps/the-promptery.png",
              alt: "The Promptery: Everything AI. Made for everyone.",
              width: 1200,
              height: 630,
            },
            tagline: "Everything AI. Made for everyone.",
            body: "AI news explained simply, beginner guides, a glossary of AI words, prompts that work and a friendly community. For everyone curious about AI.",
            website: "https://thepromtery.vercel.app",
          },
          {
            name: "Kallokollen",
            tagline: "A calm companion for everyday life.",
            body: "Placeholder copy: what Kallokollen does, who it is for, and why it feels good to use every day.",
            stores: { appStore: "#", googlePlay: "#" },
          },
        ],
        teaser: {
          label: "Next",
          title: "More is on the way.",
          body: "New everyday apps are in the works. Each one small, calm and genuinely useful.",
        },
        outro: { title: "Explore the rest of Babu." },
      },
    },
    entertainment: {
      headline: "Games worth a second round.",
      intro: "Small, polished games and playful apps, starting with Snakey Fruits.",
      description: "Babu Entertainment makes small, polished games and playful apps.",
      page: {
        appsLabel: "Featured game",
        apps: [
          {
            name: "Snakey Fruits",
            tagline: "The classic snake, ripe for a comeback.",
            body: "Placeholder copy: steer, grow and chase the next fruit. Easy to pick up, hard to put down.",
            stores: { appStore: "#", googlePlay: "#" },
          },
        ],
        teaser: {
          label: "Next",
          title: "New games in the making.",
          body: "More small, polished games are on their way. Short sessions, long afterglow.",
        },
        outro: { title: "Explore the rest of Babu." },
      },
    },
    business: {
      headline: "Tools that clear the desk.",
      intro: "Focused apps for small businesses that would rather be doing the work.",
      description: "Babu Business makes focused apps and tools for small businesses.",
      page: {
        appsLabel: "In the workshop",
        apps: [
          {
            name: "First release",
            tagline: "A focused tool for small teams.",
            body: "Placeholder copy: our first business app is in development. It will do one job well and stay out of the way.",
            status: "In development",
          },
        ],
        teaser: {
          label: "Next",
          title: "Built with the people who use it.",
          body: "We are shaping our business tools together with small companies. More to share soon.",
        },
        outro: { title: "Explore the rest of Babu." },
      },
    },
  },
};

export const worldText = (id: BrandId): WorldCopy => worldCopy[defaultLocale][id];

/** Per-route metadata (title, description, Open Graph). */
export function worldMetadata(id: BrandId): Metadata {
  const { name } = brands[id];
  const { description } = worldText(id);
  return {
    title: name,
    description,
    alternates: { canonical: brands[id].href },
    // A page's openGraph replaces the root's, so restate the shared image.
    openGraph: {
      title: name,
      description,
      type: "website",
      url: brands[id].href,
      siteName: SITE_NAME,
      images: [SHARE_IMAGE],
    },
    twitter: { card: "summary_large_image", images: [SHARE_IMAGE] },
  };
}
