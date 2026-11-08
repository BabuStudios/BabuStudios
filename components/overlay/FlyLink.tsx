"use client";

import type { ReactNode } from "react";
import type { WorldId } from "@/store/useExperience";
import { onWorldLinkClick } from "./worldLink";

/** A link that flies to a world (usable from server components). */
export function FlyLink({
  world,
  href,
  className,
  children,
}: {
  world: WorldId;
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className={className} onClick={(event) => onWorldLinkClick(event, world)}>
      {children}
    </a>
  );
}
