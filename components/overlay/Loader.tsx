"use client";

import { useEffect, useRef, useState } from "react";
import { copy } from "@/content/site";
import { useExperience } from "@/store/useExperience";

/** Never show the loader for less than this, so it reads as intentional. */
const MIN_VISIBLE_S = 0.9;
/** If WebGL never becomes ready (no support, crash), reveal the page anyway. */
const SAFETY_TIMEOUT_S = 10;

type Phase = "loading" | "leaving" | "done";

/**
 * Beat 0: a thin progress line on beige. Server-rendered, so it is the very
 * first paint. The line eases toward a target instead of jumping:
 *  - before the 3D chunk is downloaded, nothing is measurable, so the line
 *    creeps asymptotically toward 55% (1 - e^(-t/1.1));
 *  - then it follows the three.js loading manager, capped at 90%;
 *  - it completes only once the scene has rendered its first frame.
 */
export function Loader() {
  const line = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<Phase>("loading");

  useEffect(() => {
    let raf = 0;
    let shown = 0;
    const start = performance.now();
    let last = start;

    const tick = (now: number) => {
      const { loadProgress, sceneReady, markRevealed } = useExperience.getState();
      const elapsed = (now - start) / 1000;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;

      const creep = 0.55 * (1 - Math.exp(-elapsed / 1.1));
      const target = sceneReady ? 1 : Math.max(creep, loadProgress * 0.9);
      // Frame-rate independent exponential approach (k = 7/s).
      shown += (target - shown) * (1 - Math.exp(-dt * 7));
      if (line.current) line.current.style.transform = `scaleX(${shown.toFixed(4)})`;

      const finished = sceneReady && shown > 0.995 && elapsed > MIN_VISIBLE_S;
      if (finished || elapsed > SAFETY_TIMEOUT_S) {
        markRevealed();
        setPhase("leaving");
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className={`loader fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-bg ${
        phase === "leaving" ? "loader--leaving" : ""
      }`}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && phase === "leaving") setPhase("done");
      }}
      role="status"
      aria-live="polite"
      aria-busy={phase === "loading"}
    >
      <span className="sr-only">{copy.loader.status}</span>
      <span aria-hidden="true" className="label-caps text-[11px] text-fg">
        {copy.loader.label}
      </span>
      <span aria-hidden="true" className="loader__track">
        <span ref={line} className="loader__line" />
      </span>
    </div>
  );
}
