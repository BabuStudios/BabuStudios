"use client";

import { copy } from "@/content/site";
import { worldHref } from "@/lib/routes";
import { useCompactHeader } from "./HeaderScrim";
import { onWorldLinkClick } from "./worldLink";

/**
 * The "Back to Babu" control inside brand worlds: flies back to the hub. In
 * vertically scrolling worlds it steps aside once the page scrolls (it would
 * sit on top of the content); the header logo and the page's closing link
 * lead back to Babu from there.
 */
export function BackControl() {
  const compact = useCompactHeader();
  return (
    <a
      href={worldHref("hub")}
      className={`back-control label-caps ${compact ? "back-control--hidden" : ""}`}
      onClick={(event) => onWorldLinkClick(event, "hub")}
    >
      <span className="back-control__line" aria-hidden="true" />
      {copy.nav.backToHub}
    </a>
  );
}
