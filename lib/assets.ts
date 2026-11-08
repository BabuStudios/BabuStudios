/**
 * Resolves a /public asset path. Next.js serves from the site root (base "");
 * the standalone preview bundle sets NEXT_PUBLIC_ASSET_BASE="." so assets load
 * relative to the page.
 */
const base = process.env.NEXT_PUBLIC_ASSET_BASE ?? "";

export function assetUrl(path: `/${string}`): string {
  return `${base}${path}`;
}
