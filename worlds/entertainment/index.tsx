"use client";

import { BrandWorldScene, createBrandWorld } from "../brandWorld";

function EntertainmentScene() {
  return <BrandWorldScene id="entertainment" />;
}

export const entertainmentWorld = createBrandWorld("entertainment", EntertainmentScene);
