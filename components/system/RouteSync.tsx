"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { worldFromPath, worldHref } from "@/lib/routes";
import { useExperience } from "@/store/useExperience";

/**
 * Bridges the App Router and the experience (Next only; the preview uses
 * HashSync). Lives in the persistent layout, not in route pages, which Next
 * keeps alive in hidden <Activity> trees.
 *
 * - First route on load: enter that world directly (a deep link gets a short
 *   intro flight once the loader is gone).
 * - Later route changes that the experience did not cause (browser back /
 *   forward): fly there. Flights started in the UI push the URL themselves,
 *   so their route change finds the world already targeted and is ignored.
 */
export function RouteSync() {
  const pathname = usePathname();
  const router = useRouter();
  const first = useRef(true);

  useEffect(() => {
    const { setNavigate } = useExperience.getState();
    // scroll: false — the experience owns scroll (reset at the world swap).
    setNavigate((world) => router.push(worldHref(world), { scroll: false }));
    return () => setNavigate(null);
  }, [router]);

  useEffect(() => {
    const world = worldFromPath(pathname);
    const store = useExperience.getState();
    if (first.current) {
      first.current = false;
      store.enterWorld(world);
      return;
    }
    store.setUrlWorld(world);
    if (world !== store.activeWorld && world !== store.targetWorld) {
      store.requestWorld(world, { fromHistory: true });
    }
  }, [pathname]);

  return null;
}
