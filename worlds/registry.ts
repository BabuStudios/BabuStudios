import type { WorldId } from "@/store/useExperience";
import { businessWorld } from "./business";
import { entertainmentWorld } from "./entertainment";
import { hubWorld } from "./hub";
import { lifeWorld } from "./life";
import { pageWorlds } from "./pages";
import { studiosWorld } from "./studios";
import type { WorldDefinition } from "./types";

/** Every world the WorldManager can mount. */
export const worlds: Record<WorldId, WorldDefinition> = {
  hub: hubWorld,
  studios: studiosWorld,
  life: lifeWorld,
  entertainment: entertainmentWorld,
  business: businessWorld,
  ...pageWorlds,
};
