"use client";

import { BrandWorldScene, createBrandWorld } from "../brandWorld";

function StudiosScene() {
  return <BrandWorldScene id="studios" />;
}

export const studiosWorld = createBrandWorld("studios", StudiosScene);
