"use client";

import { worlds } from "@/worlds/registry";
import { useExperience } from "@/store/useExperience";

/**
 * Mounts the active world. In Phase 3 it will also keep the outgoing world
 * mounted while a transition runs.
 */
export function WorldManager() {
  const activeWorld = useExperience((s) => s.activeWorld);
  const world = worlds[activeWorld];
  if (!world) return null;
  const { Scene } = world;
  return <Scene key={world.id} />;
}
