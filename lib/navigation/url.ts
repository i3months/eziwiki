/**
 * URL strategy determining how content paths appear in the address bar.
 *
 * - `path` — readable, SEO-friendly URLs mirroring the content tree
 *   (`/guides/quick-start`)
 * - `hash` — opaque, deterministic hashes that conceal the content structure
 *   (`/a3f2e9d1-4b8c7e6f-9d2a1b3c`)
 */
export type UrlStrategy = 'path' | 'hash';

/** Strategy applied when the payload does not specify one. */
export const DEFAULT_URL_STRATEGY: UrlStrategy = 'path';

/**
 * A precomputed, bidirectional mapping between content paths and URL segments.
 *
 * The map is built once on the server and handed to client components as plain
 * data. Keeping it serialisable is deliberate: it means the browser never needs
 * the hashing implementation, only the results.
 */
export interface UrlMap {
  /** Strategy this map was built with */
  strategy: UrlStrategy;
  /** Content path to URL segment (e.g. 'guides/quick-start' -> 'a3f2e9d1-...') */
  toUrl: Record<string, string>;
  /** URL segment back to content path */
  toPath: Record<string, string>;
}

/** An empty map, used as a safe default before hydration. */
export const EMPTY_URL_MAP: UrlMap = {
  strategy: DEFAULT_URL_STRATEGY,
  toUrl: {},
  toPath: {},
};

/**
 * Strips leading and trailing slashes from a URL fragment.
 *
 * Route params arrive in several shapes depending on `trailingSlash` and on
 * whether the value came from `usePathname` or from a slug array; normalising
 * here keeps every caller from repeating the same trimming.
 *
 * @param value - Raw path or slug fragment
 * @returns The fragment without surrounding slashes
 *
 * @example
 * ```typescript
 * normalizeSlug('/guides/quick-start/'); // 'guides/quick-start'
 * normalizeSlug('guides/quick-start'); // 'guides/quick-start'
 * ```
 */
export function normalizeSlug(value: string): string {
  return value.normalize('NFC').replace(/^\/+/, '').replace(/\/+$/, '');
}

/**
 * Resolves a content path to its URL segment.
 *
 * @param map - Precomputed URL mapping
 * @param docPath - Content-relative path without extension
 * @returns The URL segment, or null when the path is not part of the site
 *
 * @example
 * ```typescript
 * docPathToUrl(map, 'guides/quick-start');
 * // 'guides/quick-start' with the path strategy
 * // 'a3f2e9d1-4b8c7e6f-9d2a1b3c' with the hash strategy
 * ```
 */
export function docPathToUrl(map: UrlMap, docPath: string): string | null {
  const normalized = normalizeSlug(docPath);
  return map.toUrl[normalized] ?? null;
}

/**
 * Resolves a URL segment back to its content path.
 *
 * @param map - Precomputed URL mapping
 * @param slug - URL segment, with or without surrounding slashes
 * @returns The content path, or null when the segment matches no document
 */
export function urlToDocPath(map: UrlMap, slug: string): string | null {
  const normalized = normalizeSlug(slug);
  return map.toPath[normalized] ?? null;
}

/**
 * Whether a tab-store path is a route rather than a content path.
 *
 * Tabs record the pages they visit as content paths, but the graph and tag
 * views have none, so those are recorded as the route itself. A leading slash
 * tells the two apart: content paths never carry one.
 *
 * @param path - Value stored as a tab's `path`
 * @returns true when the value is already an href
 */
export function isRoutePath(path: string): boolean {
  return path.startsWith('/');
}

/**
 * Builds an `href` for a content path, ready to hand to a link or router.
 *
 * Falls back to the root path when the document is unknown, which keeps
 * navigation from emitting `/null` for a stale or mistyped reference. A value
 * that is already a route (see `isRoutePath`) is returned untouched.
 *
 * @param map - Precomputed URL mapping
 * @param docPath - Content-relative path without extension, or a route
 * @returns A root-relative href
 *
 * @example
 * ```typescript
 * hrefFor(map, 'guides/quick-start'); // '/guides/quick-start'
 * hrefFor(map, 'does-not-exist'); // '/'
 * hrefFor(map, '/graph/'); // '/graph/'
 * ```
 */
export function hrefFor(map: UrlMap, docPath: string | undefined): string {
  if (!docPath) return '/';
  if (isRoutePath(docPath)) return docPath;
  const url = docPathToUrl(map, docPath);
  return url ? `/${url}` : '/';
}

/**
 * The map as it travels to the browser.
 *
 * Under the `path` strategy both halves of the map are the identity, and
 * shipping them cost every page two copies of every content path — ninety
 * bytes per page of the site, on every page of the site. The list of paths
 * carries the same information, and `unpackUrlMap` rebuilds the map from it.
 * Under `hash` the digests cannot be derived, so the map travels whole.
 */
export type UrlMapWire = UrlMap | { strategy: 'path'; paths: string[] };

/**
 * Packs a map for the browser.
 *
 * @param map - The build-time map
 * @returns The compact form when the strategy allows it
 */
export function packUrlMap(map: UrlMap): UrlMapWire {
  return map.strategy === 'path' ? { strategy: 'path', paths: Object.keys(map.toUrl) } : map;
}

/**
 * Rebuilds a map from its wire form.
 *
 * @param wire - What `packUrlMap` produced
 * @returns A map the helpers can read
 */
export function unpackUrlMap(wire: UrlMapWire): UrlMap {
  if (!('paths' in wire)) return wire;

  const identity: Record<string, string> = {};
  for (const path of wire.paths) identity[path] = path;

  return { strategy: 'path', toUrl: identity, toPath: identity };
}
