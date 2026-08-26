import { getContentRegistry } from './registry';
import { cached, contentGeneration, stamp } from '../cache';
import { normalizeSlug, type UrlStrategy } from '../navigation/url';
import { generatePathHash } from '../navigation/hash';

/**
 * Former locations of documents, and where they now live.
 *
 * URLs are derived from content paths, so moving `guides/setup.md` to
 * `getting-started/setup.md` changes the published URL and every link, bookmark
 * and search result pointing at the old one stops working. Wiki links survive
 * the move — they resolve by name — but nothing arriving from outside does.
 * Declaring the old path in frontmatter keeps it answering.
 *
 * Server-only: reads the content registry.
 */

/** Alias content path mapped to the document that superseded it. */
export type AliasMap = Map<string, string>;

let memo: AliasMap | null = null;
const memoStamp = stamp();

/**
 * Builds the alias index.
 *
 * Two kinds of clash are refused rather than resolved. An alias naming a real
 * page would shadow it, making a live document unreachable; an alias claimed by
 * two documents has no answer, and picking either would send readers somewhere
 * arbitrary. Both are mistakes in the content, and both are cheaper to find at
 * build time than as a wrong page in production.
 *
 * @returns Old path to current path
 * @throws Error when an alias shadows a page or is claimed twice
 *
 * @example
 * ```typescript
 * getAliasMap().get('guides/setup'); // 'getting-started/setup'
 * ```
 */
export function getAliasMap(): AliasMap {
  const hit = cached(memo, memoStamp);
  if (hit) return hit;

  const { docs } = getContentRegistry();
  const map: AliasMap = new Map();

  // Compared case-insensitively: on macOS and Windows `out/Guides/Setup/` and
  // `out/guides/setup/` are the same directory, and whichever the export
  // writes second replaces the first — the live page becoming a redirect to
  // itself, or the alias vanishing, depending on the order.
  const pagesByFold = new Map(docs.map((doc) => [doc.path.toLowerCase(), doc.path]));
  const claimedFold = new Map<string, string>();

  for (const doc of docs) {
    for (const alias of doc.aliases) {
      const page = pagesByFold.get(alias.toLowerCase());
      if (page) {
        throw new Error(
          `Alias collision: '${alias}' in content/${doc.path}.md is also a page ` +
            `(content/${page}.md). An alias may only name a path no page occupies.`,
        );
      }

      const claimed = map.get(alias) ?? claimedFold.get(alias.toLowerCase());
      if (claimed && claimed !== doc.path) {
        throw new Error(
          `Alias collision: '${alias}' is claimed by both content/${claimed}.md ` +
            `and content/${doc.path}.md. Remove it from one of them.`,
        );
      }

      map.set(alias, doc.path);
      claimedFold.set(alias.toLowerCase(), doc.path);
    }
  }

  memo = map;

  memoStamp.at = contentGeneration();
  return memo;
}

/**
 * Finds the document an old path now points to.
 *
 * @param path - Content path as it used to be written
 * @returns The current content path, or null when nothing claims it
 */
export function resolveAlias(path: string): string | null {
  return getAliasMap().get(path) ?? null;
}

/**
 * The URL segment an alias answers on.
 *
 * Built with the same rule the live map uses, so the address a reader has
 * really is the one that is served: under `path` the old content path, under
 * `hash` the digest of it, which is exactly what the old URL was before the
 * page moved.
 *
 * @param alias - Alias content path
 * @param strategy - URL strategy in force
 * @returns The segment, without leading or trailing slashes
 */
export function aliasUrl(alias: string, strategy: UrlStrategy): string {
  const normalized = normalizeSlug(alias);
  return strategy === 'hash' ? generatePathHash(normalized) : normalized;
}

/**
 * Resolves a URL segment to the document that superseded it.
 *
 * @param url - URL segment as requested
 * @param strategy - URL strategy in force
 * @returns The current content path, or null when the segment is not an alias
 */
export function resolveAliasUrl(url: string, strategy: UrlStrategy): string | null {
  const wanted = normalizeSlug(url);

  for (const [alias, target] of getAliasMap()) {
    if (aliasUrl(alias, strategy) === wanted) return target;
  }

  return null;
}
