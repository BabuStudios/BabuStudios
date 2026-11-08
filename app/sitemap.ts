import type { MetadataRoute } from "next";
import { SITE_URL } from "@/content/site";
import { worldHref } from "@/lib/routes";
import type { WorldId } from "@/store/useExperience";

const worlds: WorldId[] = ["hub", "studios", "life", "entertainment", "business", "contact", "policies"];

export default function sitemap(): MetadataRoute.Sitemap {
  return worlds.map((world) => ({
    url: new URL(worldHref(world), SITE_URL).toString(),
    changeFrequency: "monthly",
    priority: world === "hub" ? 1 : 0.8,
  }));
}
