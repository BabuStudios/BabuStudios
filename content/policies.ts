import type { Metadata } from "next";
import { defaultLocale, type Locale } from "./locale";
import { PAGE_HREFS } from "./pages";
import { SHARE_IMAGE, SITE_NAME } from "./site";

/**
 * The Policies page. Its text is Babu Studios' privacy policy, copied
 * verbatim from https://babupolicy.vercel.app/privacy/ (the page the App Store
 * and Google Play listings link to). Keep the two in sync when either changes.
 */

/** A run of text in a paragraph: plain, bold, or a link. */
export type Inline = string | { strong: string } | { text: string; href: string };
/** A paragraph: plain text, or runs of inline text. */
export type Paragraph = string | Inline[];

export interface PolicySection {
  /** Stable id (also the section's DOM id). */
  id: string;
  title: string;
  paragraphs: Paragraph[];
  table?: { columns: string[]; rows: string[][] };
}

export interface PoliciesCopy {
  title: string;
  description: string;
  eyebrow: string;
  headline: string;
  updatedLabel: string;
  updated: string;
  sections: PolicySection[];
  /** Where the canonical copy lives, as a closing note. */
  source: { label: string; text: string; href: string };
}

const EMAIL = "lejonsoder@gmail.com";

export const policiesCopy: Record<Locale, PoliciesCopy> = {
  en: {
    title: "Policies",
    description: "Privacy Policy for all apps published by Babu Studios on the App Store and Google Play.",
    eyebrow: "Policies",
    headline: "Privacy Policy",
    updatedLabel: "Last updated",
    updated: "27 October 2026",
    sections: [
      {
        id: "scope",
        title: "",
        paragraphs: [
          "This Privacy Policy applies to all apps published by Babu Studios on the App Store and Google Play. Babu Studios is a sole proprietorship (enskild firma) owned by Fredrik Lejon Söder, who is responsible for how your data is handled.",
        ],
      },
      {
        id: "information",
        title: "1. Information we collect",
        paragraphs: [
          "Our apps are built to collect as little as possible. Most of them do not require an account or login and do not collect personal information such as your name, email address or phone number.",
          "If an app offers an account, we only collect what the account needs, such as your email address. You can delete your account at any time from within the app or by emailing us.",
          "Some apps, such as Kallokollen, use Sign in with Apple. We then receive a unique user ID from Apple and, if you choose to share them, your name and email address. You can use Apple's Hide My Email so that your real address is never shared with us.",
        ],
      },
      {
        id: "device",
        title: "2. Data stored on your device",
        paragraphs: [
          "Settings, sound preferences, scores and other content you create are stored locally on your device, or in your own iCloud or Google account. This data is used only to make the app work and is not sent to us.",
          [
            { strong: "Apple Health." },
            " Some apps, such as Kallokollen, can read from and write to Apple Health if you allow it, for example meals, calories and weight. Health data stays on your device and is never sent to us or to third parties. It is never used for advertising or marketing. You can turn off access at any time in the Health app or in your iPhone settings.",
          ],
        ],
      },
      {
        id: "advertising",
        title: "3. Advertising",
        paragraphs: [
          "Some apps show ads using Google AdMob. AdMob may collect data such as device identifiers, IP address and diagnostics to show and measure ads. Our apps currently show only non-personalised ads, which means your activity is not tracked across other apps and websites.",
          [
            "Where required by law, we use Google's User Messaging Platform (UMP) to ask for your consent, and you can change your choices in the app. Read more in ",
            { text: "Google's Privacy Policy", href: "https://policies.google.com/privacy" },
            ".",
          ],
        ],
      },
      {
        id: "purchases",
        title: "4. In-app purchases",
        paragraphs: [
          "Purchases and subscriptions are handled by Apple or Google. We never see your payment details. Subscriptions are managed and cancelled in your App Store or Google Play account.",
        ],
      },
      {
        id: "diagnostics",
        title: "5. Diagnostics",
        paragraphs: [
          "Third-party services used in our apps, including Google AdMob, may collect crash logs and performance data to keep the apps working reliably.",
        ],
      },
      {
        id: "sharing",
        title: "6. Data sharing",
        paragraphs: [
          "We do not sell personal information. Data is processed by third-party providers, such as Google, only as needed to provide their services.",
        ],
      },
      {
        id: "rights",
        title: "7. Your rights",
        paragraphs: [
          [
            "You can ask to see, correct or delete personal data we hold about you by emailing us. You can also complain to the Swedish Authority for Privacy Protection, ",
            { text: "IMY", href: "https://www.imy.se" },
            ".",
          ],
        ],
      },
      {
        id: "children",
        title: "8. Children",
        paragraphs: [
          "Our apps are not directed at children under 13, and we do not knowingly collect personal information from children.",
        ],
      },
      {
        id: "website",
        title: "9. Support website",
        paragraphs: [
          "Our support and privacy pages are static web pages and do not use analytics, advertising scripts or tracking cookies.",
        ],
      },
      {
        id: "changes",
        title: "10. Changes",
        paragraphs: ["This policy may be updated from time to time. Changes will be posted on this page."],
      },
      {
        id: "contact",
        title: "11. Contact",
        paragraphs: ["Fredrik Lejon Söder (Babu Studios)", ["Email: ", { text: EMAIL, href: `mailto:${EMAIL}` }]],
      },
      {
        id: "apps",
        title: "Apps covered",
        paragraphs: [],
        table: {
          columns: ["App", "Account", "Ads"],
          rows: [
            ["Snakey Fruits", "No", "Yes, non-personalised (Google AdMob)"],
            [
              "Kallokollen",
              "Yes, Sign in with Apple",
              "Yes, non-personalised, free version only (Google AdMob). No ads in the paid version.",
            ],
          ],
        },
      },
    ],
    source: {
      label: "Also published at",
      text: "babupolicy.vercel.app/privacy",
      href: "https://babupolicy.vercel.app/privacy/",
    },
  },
};

export const policiesText = (): PoliciesCopy => policiesCopy[defaultLocale];

export function policiesMetadata(): Metadata {
  const { title, description } = policiesText();
  const url = PAGE_HREFS.policies;
  return {
    title: `${title} · ${SITE_NAME}`,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: "website", url, siteName: SITE_NAME, images: [SHARE_IMAGE] },
    twitter: { card: "summary_large_image", images: [SHARE_IMAGE] },
  };
}
