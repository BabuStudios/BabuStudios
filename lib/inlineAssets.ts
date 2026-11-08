import { type GLTF, GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/**
 * Binary assets embedded into the standalone preview page (base64, keyed by
 * the URL assetUrl() produces there). The claude.ai Artifact host does not
 * serve .glb files, so `npm run preview:build` injects them via esbuild
 * `define`. In the Next.js app this global does not exist and every asset is
 * fetched normally.
 */
declare const __INLINE_ASSETS__: Record<string, string> | undefined;

function inlineAsset(url: string): ArrayBuffer | null {
  const assets = typeof __INLINE_ASSETS__ === "undefined" ? undefined : __INLINE_ASSETS__;
  const base64 = assets?.[url];
  if (!base64) return null;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/** GLTFLoader that parses an inlined asset when one exists, else fetches. */
export class InlineAwareGLTFLoader extends GLTFLoader {
  override load(
    url: string,
    onLoad: (gltf: GLTF) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (err: unknown) => void,
  ): void {
    const buffer = inlineAsset(url);
    if (!buffer) {
      super.load(url, onLoad, onProgress, onError);
      return;
    }
    // Report through the loading manager so the DOM loader's progress still counts it.
    this.manager.itemStart(url);
    this.parse(
      buffer,
      "",
      (gltf) => {
        onLoad(gltf);
        this.manager.itemEnd(url);
      },
      (error) => {
        onError?.(error);
        this.manager.itemError(url);
        this.manager.itemEnd(url);
      },
    );
  }
}
