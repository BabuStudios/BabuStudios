import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { ExperienceShell } from "@/components/canvas/ExperienceShell";
import { DockedLogo } from "@/components/overlay/DockedLogo";
import { FilmGrain } from "@/components/overlay/FilmGrain";
import { HeaderScrim } from "@/components/overlay/HeaderScrim";
import { Loader } from "@/components/overlay/Loader";
import { MenuBar } from "@/components/overlay/MenuBar";
import { SkipLink } from "@/components/overlay/SkipLink";
import { InputBridge } from "@/components/system/InputBridge";
import { RouteSync } from "@/components/system/RouteSync";
import { ScrollManager } from "@/components/system/ScrollManager";
import { theme, themeCssVars } from "@/content/brands";
import { WEBGL_PROBE_SCRIPT } from "@/lib/webgl";
import { SITE_NAME, SITE_URL } from "@/content/site";
import "./globals.css";

// next/font downloads Montserrat at build time and serves it from our own
// origin (self-hosted, no runtime request to Google).
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const description = "A boutique studio for immersive websites and apps.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Brand pages set their own title ("Babu Life"), which already names the family.
  title: { default: SITE_NAME, template: "%s" },
  description,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description,
    url: "/",
    locale: "en",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: theme.background,
  colorScheme: "light",
};

// The colour tokens are injected from content/brands.ts so the HTML
// background, renderer clear colour and fog all come from one token.
const themeVars = themeCssVars() as CSSProperties;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} antialiased`}
      style={themeVars}
      // The head probe sets data-render before hydration.
      suppressHydrationWarning
    >
      <head>
        {/* Decides 3D vs static fallback before first paint (lib/webgl.ts). */}
        <script dangerouslySetInnerHTML={{ __html: WEBGL_PROBE_SCRIPT }} />
      </head>
      <body>
        <InputBridge />
        <RouteSync />
        <ScrollManager />
        {/* Header first in DOM order, so it is the first tab stop. */}
        <SkipLink />
        <HeaderScrim />
        <MenuBar />
        <DockedLogo />
        <ExperienceShell>{children}</ExperienceShell>
        <Loader />
        <FilmGrain />
      </body>
    </html>
  );
}
