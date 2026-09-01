import { decodeUrlPath, encodeUrlPath } from './navigation/url';
/**
 * Base path the site is served from, empty when served from the root.
 *
 * Set by the deploy workflow, and read here rather than inferred from CI so
 * that tests, forks, and local builds are unaffected. `next.config.js` reads
 * the same variable to configure Next itself; everything on this side of the
 * build reads it through this module.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

/**
 * Prefixes a path served from `public/` with the deployment base path.
 *
 * Next rewrites the links and assets it generates itself, but not a `href` or
 * a `url()` written by hand — those keep pointing at the domain root and 404
 * once the site moves into a subdirectory. Anything referencing `public/`
 * outside of Next's own output has to go through here.
 *
 * Absolute and protocol-relative URLs are returned untouched, so a favicon or
 * an image hosted elsewhere keeps working.
 *
 * @param path - Root-relative public path, such as `/favicon.svg`
 * @returns The path as the browser should request it
 *
 * @example
 * ```typescript
 * asset('/favicon.svg'); // '/eziwiki/favicon.svg' when deployed to /eziwiki
 * asset('https://cdn.example.com/logo.svg'); // unchanged
 * ```
 */
export function asset(path: string): string {
  if (!BASE_PATH) return path;
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  return `${BASE_PATH}${path}`;
}

/**
 * Origin the site is published under, without a trailing slash.
 *
 * Separate from the payload's `baseUrl`, and overriding it when set, because
 * the origin is a property of the deployment rather than of the project: the
 * same content is published to GitHub Pages, a preview host, and a custom
 * domain, and each needs its own canonical URLs. The deploy workflow sets this
 * alongside the base path.
 */
const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '');

/**
 * Resolves the root that absolute URLs are built from.
 *
 * The base path is part of it only when this deployment declared its own
 * origin, because only then do the two describe the same site. A deployment
 * that leaves the origin unset is publishing a copy of somewhere else — a
 * GitHub Pages mirror of a site hosted elsewhere, say — and its canonical URLs
 * have to name that other site, whose layout its own subdirectory says nothing
 * about. Applying both would produce a URL that exists in neither place.
 *
 * @param payloadBaseUrl - `global.baseUrl` from the payload, used when the
 *   deployment does not declare an origin of its own
 * @returns Root without a trailing slash
 */
function canonicalRoot(payloadBaseUrl?: string): string {
  if (SITE_ORIGIN) return `${SITE_ORIGIN}${BASE_PATH}`;
  return (payloadBaseUrl || 'https://example.com').replace(/\/+$/, '');
}

/**
 * Builds the absolute URL of a file, such as the sitemap or an OG image.
 *
 * Canonical tags, sitemap entries and social-preview metadata are read off the
 * site by other machines, so they have to be absolute and they have to agree
 * with each other. Composing them here is what keeps the origin and the base
 * path from being applied in one place and forgotten in another — a canonical
 * tag that omits the subdirectory points at a URL that does not exist.
 *
 * @param path - Root-relative path, such as `/sitemap.xml`
 * @param payloadBaseUrl - Fallback origin from the payload
 * @returns Absolute URL
 *
 * @example
 * ```typescript
 * fileUrl('/og-image.svg', 'https://example.com');
 * // 'https://example.com/eziwiki/og-image.svg' when deployed to /eziwiki
 * ```
 */
export function fileUrl(path: string, payloadBaseUrl?: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const trimmed = path.replace(/^\/+/, '');
  return `${canonicalRoot(payloadBaseUrl)}/${trimmed}`;
}

/**
 * Builds the absolute URL of a page, with the trailing slash Next emits.
 *
 * `trailingSlash` is on, so every page is served from `…/name/` and a link to
 * `…/name` is a redirect. Sitemap entries and canonical tags that disagree on
 * the slash advertise a URL that is not the one the page answers on, so the
 * form is applied here rather than at each call site.
 *
 * @param urlSegment - Page URL segment, without leading or trailing slash
 * @param payloadBaseUrl - Fallback origin from the payload
 * @returns Absolute URL ending in a slash
 */
export function pageUrl(urlSegment: string, payloadBaseUrl?: string): string {
  const trimmed = urlSegment.replace(/^\/+|\/+$/g, '');
  const base = canonicalRoot(payloadBaseUrl);
  // Encoded here, once, for every canonical and sitemap entry. A segment
  // that already arrived encoded is decoded first so it is not encoded twice.
  return trimmed ? `${base}/${encodeUrlPath(decodeUrlPath(trimmed))}/` : `${base}/`;
}
