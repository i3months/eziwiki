import { getContentRegistry, type ContentDoc } from './registry';
import { getSite } from '../site';
import { docPathToUrl, encodeUrlPath } from '../navigation/url';
import { cached, contentGeneration, stamp } from '../cache';

/**
 * Subjects, gathered across the folder tree.
 *
 * A file lives in one directory, so the sidebar can only ever show one way of
 * organising a wiki. Tags are the other way: a page sits in one section and
 * touches as many subjects as it touches. Where the graph says which pages
 * mention each other, tags say which are about the same thing whether or not
 * anyone thought to link them.
 *
 * Server-only: reads the content registry.
 */

/** Route segment the tag pages live under. */
export const TAGS_SEGMENT = 'tags';

/**
 * The URL segment a tag name becomes.
 *
 * Lower-cased, with every run of anything but letters and digits folded to a
 * hyphen. The name itself used to be the slug, and a name such as `CI/CD` or
 * `C#` then made a page nothing could reach: the export wrote the delimiter
 * into the directory name percent-encoded, and the host decoded the request
 * before looking, so the two never met.
 *
 * @param name - Tag as written in the frontmatter
 * @returns The slug, `tag` when nothing of the name survives
 */
export function tagSlug(name: string): string {
  return (
    name
      .normalize('NFC')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '') || 'tag'
  );
}

/** A page carrying a tag. */
export interface TaggedPage {
  /** Content path */
  path: string;
  /** Display title */
  title: string;
  /** Href, in the site's configured URL form */
  url: string;
  /** Short summary, when the page has one */
  description?: string;
}

/** A subject and the pages about it. */
export interface Tag {
  /** The tag as first written by an author */
  name: string;
  /** Lowercased form, used in URLs and for comparison */
  slug: string;
  /** Pages carrying it, in reading order */
  pages: TaggedPage[];
}

let memo: Tag[] | null = null;
const memoStamp = stamp();

/**
 * Converts a page to the shape a listing needs.
 */
function toTaggedPage(doc: ContentDoc): TaggedPage | null {
  const url = docPathToUrl(getSite().urlMap, doc.path);
  if (!url) return null;

  return {
    path: doc.path,
    title: doc.title,
    url: `/${encodeUrlPath(url)}/`,
    description: doc.description,
  };
}

/**
 * Collects every tag and the pages carrying it.
 *
 * Hidden pages are left out. A page kept off the sidebar on purpose should not
 * reappear in a tag listing, which would make the tag index a way of
 * enumerating exactly what was meant to stay unlisted.
 *
 * @returns Tags sorted by name, each with its pages
 *
 * @example
 * ```typescript
 * getTags().map((tag) => `${tag.name} (${tag.pages.length})`);
 * ```
 */
export function getTags(): Tag[] {
  const hit = cached(memo, memoStamp);
  if (hit) return hit;

  const { docs } = getContentRegistry();
  const { hiddenPaths } = getSite();
  const bySlug = new Map<string, Tag>();

  for (const doc of docs) {
    if (hiddenPaths.has(doc.path)) continue;

    const page = toTaggedPage(doc);
    if (!page) continue;

    for (const name of doc.tags) {
      const slug = tagSlug(name);
      const existing = bySlug.get(slug);

      // The first spelling wins, so a wiki that writes `Setup` once and `setup`
      // thereafter still shows one tag rather than two.
      if (existing) existing.pages.push(page);
      else bySlug.set(slug, { name, slug, pages: [page] });
    }
  }

  memo = [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));

  memoStamp.at = contentGeneration();
  return memo;
}

/**
 * Finds one tag by its slug.
 *
 * @param slug - Lowercased tag name from the URL
 * @returns The tag, or null when nothing carries it
 */
export function getTag(slug: string): Tag | null {
  // Through `tagSlug`, so the name itself finds the tag as well as its slug;
  // a slug run through it again is unchanged.
  const wanted = tagSlug(decodeURIComponent(slug));
  return getTags().find((tag) => tag.slug === wanted) ?? null;
}

/**
 * Returns the tags on one page, in the order they were written.
 *
 * @param path - Content path
 * @returns The page's tags, empty when it has none
 */
export function getTagsFor(path: string): Tag[] {
  return getTags().filter((tag) => tag.pages.some((page) => page.path === path));
}
