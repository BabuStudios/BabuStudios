"use client";

import { useEffect, useRef } from "react";
import { brands, type BrandId } from "@/content/brands";
import type { PageWorldId } from "@/content/pages";
import { copy } from "@/content/site";
import { worldHref } from "@/lib/routes";
import { useExperience } from "@/store/useExperience";
import { onWorldLinkClick } from "./worldLink";

/** Menu order: the studio first, then the three brands as in the hub. */
const MENU_BRANDS: readonly BrandId[] = ["studios", "life", "entertainment", "business"];
/** Then the page worlds (labels from content/site.ts `menu`). */
const MENU_PAGES: readonly PageWorldId[] = ["contact", "policies"];

/**
 * The menu row at the very top, above the docked Studios logo. Real links to
 * every world plus the Contact and Policies pages; the current world is marked with aria-current and
 * a thin gold rule. On phones the Studios item is hidden (the Studios logo
 * right below it is the same link) so the row fits; it scrolls if it still
 * does not, and the current item is scrolled into view.
 */
export function MenuBar() {
  const revealed = useExperience((s) => s.revealed);
  const activeWorld = useExperience((s) => s.activeWorld);
  const list = useRef<HTMLUListElement>(null);

  // Narrow screens: keep the current item visible in the sideways-scrolling row
  // (scrolls only the row, never the page).
  useEffect(() => {
    const row = list.current;
    const current = row?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!row || !current || row.scrollWidth <= row.clientWidth) return;
    const target = current.offsetLeft - (row.clientWidth - current.offsetWidth) / 2;
    row.scrollTo({
      left: Math.max(0, target),
      behavior: useExperience.getState().reducedMotion ? "instant" : "smooth",
    });
  }, [activeWorld]);

  return (
    <nav aria-label={copy.menu.label} className={`menu-bar ${revealed ? "menu-bar--visible" : ""}`}>
      <ul ref={list} className="menu-bar__list">
        {MENU_BRANDS.map((id) => (
          <li key={id} className={`menu-bar__item menu-bar__item--${id}`}>
            <a
              href={brands[id].href}
              className="menu-bar__link label-caps"
              aria-current={activeWorld === id ? "page" : undefined}
              onClick={(event) => onWorldLinkClick(event, id)}
            >
              {brands[id].label}
            </a>
          </li>
        ))}
        {MENU_PAGES.map((id) => (
          <li key={id} className={`menu-bar__item menu-bar__item--${id}`}>
            <a
              href={worldHref(id)}
              className="menu-bar__link label-caps"
              aria-current={activeWorld === id ? "page" : undefined}
              onClick={(event) => onWorldLinkClick(event, id)}
            >
              {copy.menu[id]}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
