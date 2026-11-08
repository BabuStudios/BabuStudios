"use client";

import { copy } from "@/content/site";

/**
 * The first tab stop: jumps past the menu and header logo to the page's main
 * content. Next keeps visited routes alive but hidden, so there can be several
 * `main` elements; focus the one that is rendered.
 */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="skip-link label-caps"
      onClick={(event) => {
        const main = [...document.querySelectorAll<HTMLElement>("main")].find((m) => m.getClientRects().length > 0);
        if (!main) return;
        event.preventDefault();
        main.tabIndex = -1;
        main.focus({ preventScroll: true });
      }}
    >
      {copy.nav.skipToContent}
    </a>
  );
}
