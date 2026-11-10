import type { Metadata } from "next";
import { defaultLocale, type Locale } from "./locale";
import { PAGE_HREFS } from "./pages";
import { SHARE_IMAGE, SITE_NAME } from "./site";

/**
 * The Policies page: a menu with one button per policy document (user
 * request: "skapa en meny och lägg privacy policy som egen knapp"). Today it
 * holds Babu Studios' privacy policy, copied verbatim from
 * https://babupolicy.vercel.app/privacy/ (the page the App Store and Google
 * Play listings link to). Keep the two in sync when either changes. To add a
 * policy (terms of use, cookies…), add a document to `documents`.
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

/** One policy: a button in the menu, and the full text it opens. */
export interface PolicyDocument {
  /** Stable id. */
  id: string;
  /** The button's title in the menu. */
  title: string;
  /** The open policy's h1, when it differs from the button title. */
  headline?: string;
  /** Not yet reviewed and approved: shown with a visible "Draft" tag. */
  draft?: boolean;
  /** One line under the title in the menu. */
  summary: string;
  updated: string;
  sections: PolicySection[];
  /** Where the canonical copy lives, as a closing note. */
  source?: { label: string; text: string; href: string };
}

export interface PoliciesCopy {
  /** Page title and menu label. */
  title: string;
  description: string;
  eyebrow: string;
  headline: string;
  intro: string;
  /** Accessible name of the list of policies. */
  menuLabel: string;
  /** Visible label of each policy button's call to action. */
  open: string;
  /** Back from a policy to the menu. */
  back: string;
  updatedLabel: string;
  /** Tag on a policy that is still a draft. */
  draftLabel: string;
  documents: PolicyDocument[];
}

const EMAIL = "lejonsoder@gmail.com";

export const policiesCopy: Record<Locale, PoliciesCopy> = {
  en: {
    title: "Policies",
    description:
      "Babu Studios' policies, including the Privacy Policy for all our apps on the App Store and Google Play.",
    eyebrow: "Babu Studios",
    headline: "Policies",
    intro: "How we handle your data and what applies when you use our websites and apps.",
    menuLabel: "Policies",
    open: "Read",
    back: "All policies",
    updatedLabel: "Last updated",
    draftLabel: "Draft",
    documents: [
      {
        id: "privacy",
        title: "Privacy Policy",
        summary: "What our apps collect, how your data is used and your rights.",
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
      {
        // DRAFT written from what The Promptery's code and its setup notes
        // (supabase/SETUP.md, ATT-GORA-FORE-PUBLICERING.md in BabuStudios/ThePromptery)
        // say it stores. It must be reviewed and approved by Babu before it is
        // treated as final; then remove `draft` and set `updated`.
        id: "the-promptery",
        title: "The Promptery",
        headline: "The Promptery Privacy Policy",
        draft: true,
        summary: "What The Promptery stores when you read, sign in, post and send messages.",
        updated: "Draft, not yet published",
        sections: [
          {
            id: "promptery-scope",
            title: "",
            paragraphs: [
              [
                "This Privacy Policy applies to The Promptery, the website at ",
                { text: "thepromtery.vercel.app", href: "https://thepromtery.vercel.app" },
                ". The Promptery is run by Babu Studios, a sole proprietorship (enskild firma) owned by Fredrik Lejon Söder, who is responsible for how your data is handled.",
              ],
            ],
          },
          {
            id: "promptery-visiting",
            title: "1. Reading without an account",
            paragraphs: [
              "You can read the news, guides, glossary and prompts without an account. We do not ask for any personal information to do so.",
              "Your progress in the guides is saved in your own browser, on your device. It is not sent to us.",
              "We count visits with Vercel Web Analytics. It does not use cookies and does not build a profile of you.",
            ],
          },
          {
            id: "promptery-account",
            title: "2. Your account",
            paragraphs: [
              "You can sign in with Google or with a link sent to your email address. With Google we receive your name, email address and profile picture. With an email link we receive your email address.",
              "When you join you choose a username, whether you are a private person or a business (with a company name), and a profile picture (a photo you upload, your Google photo or an emoji). You can also add a headline, bio, location, website, links to LinkedIn, X and GitHub, the AI tools you use and your interests. Your profile, username and what you add to it are shown to other visitors.",
            ],
          },
          {
            id: "promptery-posts",
            title: "3. What you post",
            paragraphs: [
              "Posts, comments, prompts, polls, reactions, ratings and the people you follow are stored in our database. Posts, comments, prompts and reactions are public on the site.",
              "Pictures you add to a post are made smaller in your browser and stored with the post. They are public, like the post. You can delete your own pictures, and they are removed when the post is removed or when you delete your account.",
              "Items you save are kept in a private list that only you can see.",
            ],
          },
          {
            id: "promptery-messages",
            title: "4. Direct messages",
            paragraphs: [
              "Direct messages and any pictures in them are stored in our database. Only the two members of a conversation can read them, not even moderators. Pictures in direct messages are kept in private storage and shown through links that expire after an hour.",
              "You can block a member, after which they cannot send you more messages. Messages and the pictures you have sent are removed when you delete your account.",
            ],
          },
          {
            id: "promptery-newsletter",
            title: "5. Newsletter",
            paragraphs: [
              "If you subscribe to the weekly newsletter, we store your email address to send it to you. We use it for nothing else. You can unsubscribe at any time, and your signup is removed when you delete your account.",
            ],
          },
          {
            id: "promptery-moderation",
            title: "6. Moderation and safety",
            paragraphs: [
              "To keep the community safe, there are limits on how much can be posted, and members can report content. Moderators can remove content and suspend members for a period. The reason for a suspension is only visible to moderators.",
            ],
          },
          {
            id: "promptery-providers",
            title: "7. Who processes your data",
            paragraphs: [
              "We use Supabase for the database, sign-in and stored pictures, and Vercel to host the site and count visits. If you sign in with Google, Google handles that sign-in. An email service sends sign-in links and, once it starts, the newsletter. These providers only process data as needed to provide their services. We do not sell personal information.",
            ],
          },
          {
            id: "promptery-retention",
            title: "8. How long we keep it and how to delete it",
            paragraphs: [
              "We keep your data for as long as you have an account. You can delete your account at the bottom of your own profile. That removes your sign-in, your profile and everything you have written: posts, replies, prompts, comments, reactions, your newsletter signup, and the pictures you have uploaded or sent.",
            ],
          },
          {
            id: "promptery-rights",
            title: "9. Your rights",
            paragraphs: [
              [
                "You can ask to see, correct or delete personal data we hold about you by emailing us. You can also complain to the Swedish Authority for Privacy Protection, ",
                { text: "IMY", href: "https://www.imy.se" },
                ".",
              ],
            ],
          },
          {
            id: "promptery-children",
            title: "10. Children",
            paragraphs: [
              "The Promptery is not directed at children under 13, and we do not knowingly collect personal information from children.",
            ],
          },
          {
            id: "promptery-changes",
            title: "11. Changes",
            paragraphs: ["This policy may be updated from time to time. Changes will be posted on this page."],
          },
          {
            id: "promptery-contact",
            title: "12. Contact",
            paragraphs: ["Fredrik Lejon Söder (Babu Studios)", ["Email: ", { text: EMAIL, href: `mailto:${EMAIL}` }]],
          },
        ],
      },
    ],
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
