"use client";

import { BrandOverlay } from "@/components/overlay/BrandOverlay";
import { ContactOverlay } from "@/components/overlay/ContactOverlay";
import { PoliciesOverlay } from "@/components/overlay/PoliciesOverlay";
import { HubOverlay } from "@/components/overlay/HubOverlay";
import { useExperience } from "@/store/useExperience";

/** Stand-in for the App Router in the preview: renders the page for the URL's world. */
export function PreviewPages() {
  const world = useExperience((s) => s.urlWorld);
  if (world === "hub") return <HubOverlay />;
  if (world === "contact") return <ContactOverlay />;
  if (world === "policies") return <PoliciesOverlay />;
  return <BrandOverlay key={world} id={world} />;
}
