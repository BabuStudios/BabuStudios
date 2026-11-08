"use client";

import { StudiosLogo } from "./StudiosLogo";
import { SubBrands } from "./SubBrands";

/** The hub world: the Studios logo (rest → dock) and the three sub-brands. */
export function HubScene() {
  return (
    <>
      <StudiosLogo />
      <SubBrands />
    </>
  );
}
