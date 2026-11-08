"use client";

import { copy } from "@/content/site";
import { useExperience } from "@/store/useExperience";

/** Minimal "Scroll" cue: a label over a hairline with a slow travelling segment. */
export function ScrollCue({ className = "" }: { className?: string }) {
  const revealed = useExperience((s) => s.revealed);
  const scrolled = useExperience((s) => s.scrollProgress > 0.02);
  const visible = revealed && !scrolled;

  return (
    <div aria-hidden="true" className={`scroll-cue ${visible ? "scroll-cue--visible" : ""} ${className}`}>
      <span className="label-caps text-[10px] text-fg/70">{copy.hub.scrollCue}</span>
      <span className="scroll-cue__line" />
    </div>
  );
}
