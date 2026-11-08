"use client";

import { BrandWorldScene, createBrandWorld } from "../brandWorld";

function BusinessScene() {
  return <BrandWorldScene id="business" />;
}

export const businessWorld = createBrandWorld("business", BusinessScene);
