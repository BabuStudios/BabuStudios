/** URL ↔ world mapping. No three.js: shared by Next routing and the preview. */
import { type BrandId, brands } from "@/content/brands";
import { isPageWorld, PAGE_HREFS } from "@/content/pages";
import type { WorldId } from "@/store/useExperience";

export function worldHref(world: WorldId): string {
  if (world === "hub") return "/";
  return isPageWorld(world) ? PAGE_HREFS[world] : brands[world].href;
}

export function worldFromPath(pathname: string): WorldId {
  const segment = pathname.split("/")[1];
  return worldFromName(segment);
}

/** Preview (Artifact) routing: only a plain `#name` is allowed there. */
export function worldFromHash(hash: string): WorldId {
  const name = hash.replace(/^#/, "");
  return worldFromName(name);
}

/** "life" → life, "contact" → contact, anything else → the hub. */
function worldFromName(name: string | undefined): WorldId {
  if (isPageWorld(name)) return name;
  return name && name in brands ? (name as BrandId) : "hub";
}
