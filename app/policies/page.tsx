import type { Metadata } from "next";
import { PoliciesOverlay } from "@/components/overlay/PoliciesOverlay";
import { policiesMetadata } from "@/content/policies";

export const metadata: Metadata = policiesMetadata();

/** The Policies page. It is its own world in the persistent canvas (no 3D object). */
export default function Page() {
  return <PoliciesOverlay />;
}
