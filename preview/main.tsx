/**
 * Standalone preview entry (no Next.js). Mounts exactly the same components as
 * app/layout.tsx + app/page.tsx so the current phase can be shared as a single
 * self-contained page. Built by `npm run preview:build`.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ExperienceShell } from "@/components/canvas/ExperienceShell";
import { DockedLogo } from "@/components/overlay/DockedLogo";
import { FilmGrain } from "@/components/overlay/FilmGrain";
import { HeaderScrim } from "@/components/overlay/HeaderScrim";
import { Loader } from "@/components/overlay/Loader";
import { MenuBar } from "@/components/overlay/MenuBar";
import { SkipLink } from "@/components/overlay/SkipLink";
import { HashSync } from "@/components/system/HashSync";
import { InputBridge } from "@/components/system/InputBridge";
import { ScrollManager } from "@/components/system/ScrollManager";
import { themeCssVars } from "@/content/brands";
import { useExperience } from "@/store/useExperience";
import { PreviewPages } from "./PreviewPages";

// Test hook for the preview build only (lets automated checks force quality).
(window as unknown as { __babuStore?: typeof useExperience }).__babuStore = useExperience;

for (const [name, value] of Object.entries(themeCssVars())) {
  document.documentElement.style.setProperty(name, value);
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(
    <StrictMode>
      <InputBridge />
      <HashSync />
      <ScrollManager />
      <SkipLink />
      <HeaderScrim />
      <MenuBar />
      <DockedLogo />
      <ExperienceShell>
        <PreviewPages />
      </ExperienceShell>
      <Loader />
      <FilmGrain />
    </StrictMode>,
  );
}
