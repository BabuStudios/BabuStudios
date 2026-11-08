"use client";

import { useEffect } from "react";
import { worldFromHash } from "@/lib/routes";
import { useExperience } from "@/store/useExperience";

/**
 * Routing for the standalone preview (claude.ai Artifact), where only a plain
 * `#name` may change: `#life`, `#entertainment`… and no hash for the hub.
 * Same contract as RouteSync.
 */
export function HashSync() {
  useEffect(() => {
    const store = useExperience.getState();
    store.setNavigate((world) => {
      window.location.hash = world === "hub" ? "" : world;
    });
    store.enterWorld(worldFromHash(window.location.hash));

    const onHashChange = () => {
      const world = worldFromHash(window.location.hash);
      const s = useExperience.getState();
      s.setUrlWorld(world);
      if (world !== s.activeWorld && world !== s.targetWorld) s.requestWorld(world, { fromHistory: true });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      useExperience.getState().setNavigate(null);
    };
  }, []);

  return null;
}
