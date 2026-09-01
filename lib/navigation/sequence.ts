import { getSite } from '../site';
import { extractAllPaths, filterHiddenItems } from './builder';
import { docPathToUrl, encodeUrlPath } from './url';
import { getDoc } from '../content/registry';
import { cached, contentGeneration, stamp } from '../cache';

/**
 * The order pages are meant to be read in.
 *
 * The sidebar already answers this: sections come from the content tree, order
 * from `_meta.json` and frontmatter, and reading it top to bottom is how a
 * reader works through a guide. Flattening that same tree gives the sequence,
 * so the two can never disagree — a separate ordering would be one more thing
 * to keep in step.
 *
 * Server-only.
 */

/** A page next to another in reading order. */
export interface AdjacentPage {
  /** Display title */
  title: string;
  /** Href, in the site's configured URL form */
  url: string;
}

/** What comes before and after a page. */
export interface Adjacent {
  previous: AdjacentPage | null;
  next: AdjacentPage | null;
}

let memo: string[] | null = null;
const memoStamp = stamp();

/**
 * Every page in reading order, hidden ones excluded.
 *
 * Hidden pages are reachable by direct link but are not part of the sequence:
 * stepping through a guide should not land on something deliberately unlisted.
 *
 * @returns Content paths, in the order the sidebar shows them
 *
 * @example
 * ```typescript
 * getReadingOrder()[0]; // the page a reader starts at
 * ```
 */
export function getReadingOrder(): string[] {
  const hit = cached(memo, memoStamp);
  if (hit) return hit;

  const { navigation } = getSite();

  // Sections that only group pages carry no path of their own and drop out
  // here, leaving just the readable pages.
  memo = extractAllPaths(filterHiddenItems(navigation));
  memoStamp.at = contentGeneration();
  return memo;
}

/**
 * Finds the pages either side of one in reading order.
 *
 * @param path - Content path of the current page
 * @returns The neighbours, each null at the ends of the sequence
 *
 * @example
 * ```typescript
 * const { previous, next } = getAdjacentPages('getting-started/installation');
 * next?.title; // 'Your First Wiki'
 * ```
 */
export function getAdjacentPages(path: string): Adjacent {
  const sequence = getReadingOrder();
  const index = sequence.indexOf(path);

  // A hidden page, or one reached by a URL that navigation does not cover, has
  // no place in the sequence and so no neighbours to offer.
  if (index === -1) return { previous: null, next: null };

  return {
    previous: toAdjacent(sequence[index - 1]),
    next: toAdjacent(sequence[index + 1]),
  };
}

/**
 * Resolves a content path to the title and href a link needs.
 *
 * @param path - Content path, or undefined at either end of the sequence
 * @returns The page, or null when there is none
 */
function toAdjacent(path: string | undefined): AdjacentPage | null {
  if (!path) return null;

  const { urlMap } = getSite();
  const url = docPathToUrl(urlMap, path);
  if (!url) return null;

  return { title: getDoc(path)?.title ?? path, url: `/${encodeUrlPath(url)}/` };
}
