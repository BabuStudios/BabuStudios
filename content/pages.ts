/**
 * "Page worlds": pages with no 3D logo of their own (Contact, Policies). Each
 * is a vertical world in the shared beige space, with its own route and menu
 * item. Plain data, safe for the store, routing and DOM.
 */
export const pageWorldIds = ["contact", "policies"] as const;
export type PageWorldId = (typeof pageWorldIds)[number];

/** The route of each page world. */
export const PAGE_HREFS: Record<PageWorldId, `/${string}`> = {
  contact: "/contact",
  policies: "/policies",
};

export function isPageWorld(name: string | null | undefined): name is PageWorldId {
  return (pageWorldIds as readonly string[]).includes(name ?? "");
}
