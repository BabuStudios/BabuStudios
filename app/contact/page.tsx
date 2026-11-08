import type { Metadata } from "next";
import { ContactOverlay } from "@/components/overlay/ContactOverlay";
import { contactMetadata } from "@/content/contact";

export const metadata: Metadata = contactMetadata();

/** The Contact page. It is its own world in the persistent canvas (no 3D object). */
export default function Page() {
  return <ContactOverlay />;
}
