import { CONTACT_EMAIL, contactText } from "@/content/contact";
import { BackControl } from "./BackControl";

/**
 * DOM layer of the Contact page: a calm, centred single screen with the
 * mail CTA (the address also as selectable text). The fixed BackControl
 * leads back to Babu.
 */
export function ContactOverlay() {
  const t = contactText();
  return (
    <>
      <main id="main" className="world-page">
        <section className="world-intro world-intro--flow world-intro--centered contact-intro">
          <p className="corridor-eyebrow label-caps">{t.eyebrow}</p>
          <h1 className="world-intro__headline contact-intro__headline">{t.headline}</h1>
          <p className="world-intro__lede">{t.body}</p>
          <a className="outro-link label-caps" href={`mailto:${CONTACT_EMAIL}`}>
            {t.cta}
          </a>
          {/* Mail links do not open everywhere; the address stays selectable. */}
          <p className="corridor-email">{CONTACT_EMAIL}</p>
        </section>
      </main>
      <BackControl />
    </>
  );
}
