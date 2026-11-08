import { brands } from "@/content/brands";
import type { PageWorldId } from "@/content/pages";
import { pageWorldMeta } from "../brandMeta";
import type { WorldDefinition } from "../types";

/**
 * Page worlds (Contact, Policies) have no 3D object of their own: the page is
 * all DOM text over the shared beige space and its drifting particles
 * (rendered by Experience).
 */
function EmptyScene() {
  return null;
}

const pageWorld = (id: PageWorldId): WorldDefinition => ({
  ...pageWorldMeta(id),
  palette: brands.studios.palette,
  Scene: EmptyScene,
});

export const pageWorlds: Record<PageWorldId, WorldDefinition> = {
  contact: pageWorld("contact"),
  policies: pageWorld("policies"),
};
