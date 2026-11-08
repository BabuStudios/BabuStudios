import type { Metadata } from "next";
import { defaultLocale, type Locale } from "./locale";
import { PAGE_HREFS } from "./pages";
import { SHARE_IMAGE, SITE_NAME } from "./site";

/**
 * The Contact page (its own world and route, separate from Babu Studios: user
 * decision "separera contact och babu studios"). Placeholder copy.
 */
export interface ContactCopy {
  /** Page title and menu label. */
  title: string;
  description: string;
  eyebrow: string;
  headline: string;
  body: string;
  cta: string;
}

/** The Contact route. */
export const CONTACT_HREF = PAGE_HREFS.contact;

/**
 * The studio's address (confirmed by the user). Shown as selectable text next
 * to the button too, since mail links do not open everywhere.
 */
export const CONTACT_EMAIL = "info.babustudios@gmail.com";

export const contactCopy: Record<Locale, ContactCopy> = {
  en: {
    title: "Contact",
    description: "Get in touch with Babu: tell us what you are making and where you want it to go.",
    eyebrow: "Contact",
    headline: "Let's build something worth visiting.",
    body: "Tell us what you are making and where you want it to go.",
    cta: "Start a project",
  },
};

export const contactText = (): ContactCopy => contactCopy[defaultLocale];

export function contactMetadata(): Metadata {
  const { title, description } = contactText();
  return {
    title: `${title} · ${SITE_NAME}`,
    description,
    alternates: { canonical: CONTACT_HREF },
    openGraph: { title, description, type: "website", url: CONTACT_HREF, siteName: SITE_NAME, images: [SHARE_IMAGE] },
    twitter: { card: "summary_large_image", images: [SHARE_IMAGE] },
  };
}
