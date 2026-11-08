import { type Inline, type Paragraph, policiesText } from "@/content/policies";
import { copy } from "@/content/site";
import { worldHref } from "@/lib/routes";
import { FlyLink } from "./FlyLink";

/** External links open in a new tab; mail links open the mail app. */
function InlineRun({ run }: { run: Inline }) {
  if (typeof run === "string") return run;
  if ("strong" in run) return <strong>{run.strong}</strong>;
  const external = run.href.startsWith("http");
  return (
    <a href={run.href} {...(external ? { target: "_blank", rel: "noopener" } : {})}>
      {run.text}
      {external && <span className="sr-only"> {copy.stores.newTab}</span>}
    </a>
  );
}

function PolicyParagraph({ paragraph }: { paragraph: Paragraph }) {
  return (
    <p className="policy__text">
      {typeof paragraph === "string" ? paragraph : paragraph.map((run, i) => <InlineRun key={i} run={run} />)}
    </p>
  );
}

/**
 * DOM layer of the Policies page: Babu's privacy policy as a readable single
 * column (one h2 per section, the covered apps as a table), closing with a
 * "Back to Babu" button like the brand pages. There is no fixed BackControl:
 * the text column reaches the bottom of the first screen on phones, where it
 * would sit on top of it (the header logo leads back too).
 */
export function PoliciesOverlay() {
  const t = policiesText();
  return (
    <main id="main" className="world-page">
      <section className="world-intro world-intro--flow page-intro">
        <p className="corridor-eyebrow label-caps">{t.eyebrow}</p>
        <h1 className="world-intro__headline">{t.headline}</h1>
        <p className="world-intro__lede">
          {t.updatedLabel}: {t.updated}
        </p>
      </section>
      <div className="policies">
        {t.sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className={`policy ${section.title ? "" : "policy--lead"}`}
            aria-labelledby={section.title ? `${section.id}-title` : undefined}
          >
            {section.title && (
              <h2 id={`${section.id}-title`} className="policy__title">
                {section.title}
              </h2>
            )}
            {section.paragraphs.map((paragraph, i) => (
              <PolicyParagraph key={i} paragraph={paragraph} />
            ))}
            {section.table && (
              <div className="policy__table-wrap">
                <table className="policy__table">
                  <thead>
                    <tr>
                      {section.table.columns.map((column) => (
                        <th key={column} scope="col">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.table.rows.map(([name, ...cells]) => (
                      <tr key={name}>
                        <th scope="row">{name}</th>
                        {cells.map((cell, i) => (
                          <td key={i}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
        <p className="policies__updated label-caps">
          {t.source.label}{" "}
          <a href={t.source.href} target="_blank" rel="noopener">
            {t.source.text}
            <span className="sr-only"> {copy.stores.newTab}</span>
          </a>
        </p>
        <FlyLink world="hub" href={worldHref("hub")} className="outro-link label-caps policies__back">
          {copy.nav.backToHub}
        </FlyLink>
      </div>
    </main>
  );
}
