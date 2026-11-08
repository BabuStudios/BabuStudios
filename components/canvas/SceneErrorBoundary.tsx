"use client";

import { Component, type ReactNode } from "react";

/**
 * Catches a crash anywhere in the 3D tree (shader compile failure, asset
 * error, driver issue) and hands the page to the static fallback instead of
 * leaving a blank canvas.
 */
export class SceneErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
