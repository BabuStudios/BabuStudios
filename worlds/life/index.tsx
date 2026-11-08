"use client";

import { BrandWorldScene, createBrandWorld } from "../brandWorld";

function LifeScene() {
  return <BrandWorldScene id="life" />;
}

export const lifeWorld = createBrandWorld("life", LifeScene);
