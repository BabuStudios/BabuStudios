"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import { useExperience } from "@/store/useExperience";

/** Mirrors the three.js loading manager's progress into the store for the DOM loader. */
export function LoadProgressSignal() {
  const progress = useProgress((s) => s.progress);
  const setLoadProgress = useExperience((s) => s.setLoadProgress);
  useEffect(() => setLoadProgress(progress / 100), [progress, setLoadProgress]);
  return null;
}

/**
 * Placed inside the same Suspense boundary as the world, so it only mounts once
 * the world's assets have resolved. It reports ready after the first rendered
 * frame (shaders compiled), not merely after mount.
 */
export function ReadySignal() {
  const reported = useRef(false);
  useFrame(() => {
    if (reported.current) return;
    reported.current = true;
    requestAnimationFrame(() => useExperience.getState().markSceneReady());
  });
  return null;
}
