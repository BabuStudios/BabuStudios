import type { Metadata } from "next";
import { BrandOverlay } from "@/components/overlay/BrandOverlay";
import { worldMetadata } from "@/content/worlds";

export const metadata: Metadata = worldMetadata("life");

/** The life world. Its 3D scene lives in the persistent canvas in the root layout. */
export default function Page() {
  return <BrandOverlay id="life" />;
}
