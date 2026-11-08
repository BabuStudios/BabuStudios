import { defaultLocale, type Locale } from "./locale";

/**
 * Copy for the Studios world's corridor (Phase 4). Placeholder copy: confident,
 * short, easy to replace. Section ids match worlds/studios/sections.ts.
 */
export interface StudiosOffer {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
}

export interface StudiosWork {
  title: string;
  kind: string;
}

export interface StudiosStep {
  title: string;
  body: string;
}

export interface StudiosCopy {
  premium: StudiosOffer;
  essential: StudiosOffer;
  work: { eyebrow: string; title: string; items: StudiosWork[]; placeholderNote: string };
  process: { eyebrow: string; title: string; steps: StudiosStep[] };
}

export const studiosCopy: Record<Locale, StudiosCopy> = {
  en: {
    premium: {
      eyebrow: "Premium",
      title: "Cinematic WebGL websites",
      body: "Real-time 3D, scroll-driven storytelling and motion that feels expensive. For launches, flagships and brands that want to be remembered.",
      points: ["Custom 3D scenes and interactions", "Scroll-driven storytelling", "Fast, accessible and indexable"],
    },
    essential: {
      eyebrow: "Essential",
      title: "WordPress websites, done properly",
      body: "Well-crafted WordPress sites your team can edit themselves. Thoughtful design, clean builds, no bloat.",
      points: [
        "Custom theme, no page-builder clutter",
        "Simple editing for your team",
        "Search-ready and quick to load",
      ],
    },
    work: {
      eyebrow: "Selected work",
      title: "Recent projects",
      placeholderNote: "Case studies coming soon",
      items: [
        { title: "Product launch", kind: "Premium · WebGL" },
        { title: "Studio portfolio", kind: "Premium · WebGL" },
        { title: "Restaurant website", kind: "Essential · WordPress" },
      ],
    },
    process: {
      eyebrow: "Process",
      title: "How we work",
      steps: [
        { title: "Discover", body: "What the site must do, for whom, and how it should feel." },
        { title: "Design", body: "Art direction, motion and structure, shown early and refined together." },
        { title: "Build", body: "Precise code with a performance budget, tested on real devices." },
        { title: "Launch", body: "Go live with care, then measure, tune and keep it healthy." },
      ],
    },
  },
};

export const studiosText = (): StudiosCopy => studiosCopy[defaultLocale];
