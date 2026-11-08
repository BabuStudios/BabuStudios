import { brands } from "@/content/brands";
import type { WorldDefinition } from "../types";
import { HubScene } from "./HubScene";
import { hubMeta } from "./meta";

export const hubWorld: WorldDefinition = {
  ...hubMeta,
  palette: brands.studios.palette,
  Scene: HubScene,
};
