"use client";

import { useEffect, useRef, useState } from "react";
import { type Inline, type Paragraph, type PolicyDocument, policiesText } from "@/content/policies";
import { copy } from "@/content/site";
import { worldHref } from "@/lib/routes";
import { useExperience } from "@/store/useExperience";
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

/** One policy's full text: sections (h2), paragraphs, an optional table. */
function PolicyBody({ doc }: { doc: PolicyDocument }) {
  return (
    <>
      {doc.sections.map((section) => (
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
      {doc.source && (
        <p className="policies__updated label-caps">
          {doc.source.label}{" "}
          <a href={doc.source.href} target="_blank" rel="noopener">
            {doc.source.text}
            <span className="sr-only"> {copy.stores.newTab}</span>
          </a>
        </p>
      )}
    </>
  );
}

/**
 * DOM layer of the Policies page: a menu with one button per policy (user
 * request), and the chosen policy as a readable single column with a button
 * back to the menu. The choice is page state, not a route: the page resets to
 * the menu whenever you leave it (Next keeps visited pages alive, hidden).
 * Switching jumps to the top and moves focus to the new heading.
 *
 * There is no fixed BackControl: the text column reaches the bottom of the
 * first screen on phones, where it would sit on top of it. The closing
 * "Back to Babu" button and the header logo lead back.
 */
export function PoliciesOverlay() {
  const t = policiesText();
  const [openId, setOpenId] = useState<string | null>(null);
  const doc = t.documents.find((d) => d.id === openId) ?? null;
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  // Leaving the page hides it (Next keeps it alive in an Activity), which runs
  // effect cleanups: reset to the menu so the next visit starts there.
  useEffect(() => () => setOpenId(null), []);

  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    heading.current?.focus({ preventScroll: true });
  }, [openId]);

  const show = (id: string | null) => {
    moved.current = true;
    setOpenId(id);
    useExperience.getState().scrollTo?.(0, { immediate: true });
  };

  return (
    <main id="main" className="world-page">
      <section className="world-intro world-intro--flow page-intro">
        {doc && (
          <button type="button" className="policy-back label-caps" onClick={() => show(null)}>
            <span aria-hidden="true">←</span> {t.back}
          </button>
        )}
        <p className="corridor-eyebrow label-caps">{doc ? t.title : t.eyebrow}</p>
        <h1 ref={heading} tabIndex={-1} className="world-intro__headline policy-heading">
          {doc ? doc.title : t.headline}
        </h1>
        <p className="world-intro__lede">{doc ? `${t.updatedLabel}: ${doc.updated}` : t.intro}</p>
      </section>
      <div className="policies">
        {doc ? (
          <PolicyBody doc={doc} />
        ) : (
          <nav aria-label={t.menuLabel}>
            <ul className="policy-menu">
              {t.documents.map((d) => (
                <li key={d.id}>
                  <button type="button" className="policy-menu__item" onClick={() => show(d.id)}>
                    <span className="policy-menu__title">{d.title}</span>
                    <span className="policy-menu__summary">{d.summary}</span>
                    <span className="policy-menu__meta label-caps">
                      {t.updatedLabel}: {d.updated}
                    </span>
                    <span className="policy-menu__cta label-caps" aria-hidden="true">
                      {t.open} <span className="policy-menu__arrow">→</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <FlyLink world="hub" href={worldHref("hub")} className="outro-link label-caps policies__back">
          {copy.nav.backToHub}
        </FlyLink>
      </div>
    </main>
  );
}
