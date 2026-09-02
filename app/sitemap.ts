import { MetadataRoute } from 'next';
import { getSite } from '@/lib/site';
import { docPathToUrl } from '@/lib/navigation/url';
import { pageUrl } from '@/lib/basePath';
import { getTags } from '@/lib/content/tags';
import { getLastModified } from '@/lib/content/lastModified';

// Next 16 wants the intent stated even under `output: export`.
export const dynamic = 'force-static';

/**
 * When a page last changed, for a crawler.
 *
 * Omitted rather than guessed at when nothing knows. `lastmod` is a claim
 * about the document, and a wrong one is worse than none: a crawler that finds
 * the date moved but the page unchanged learns to stop believing the field.
 *
 * @param path - Content path
 * @returns The date, or undefined when the page has no history yet
 */
function changedAt(path: string): Date | undefined {
  const modified = getLastModified(path);
  return modified ? new Date(modified.iso) : undefined;
}

/**
 * The most recent change anywhere in a set of pages.
 *
 * Index pages — the front page, the tag listings — have no history of their
 * own: their files are unchanged while what they list changes underneath them.
 * The newest thing they show is the closest thing to a date they have.
 *
 * @param paths - Content paths the index covers
 * @returns The latest date among them, or undefined when none has one
 */
function newestOf(paths: string[]): Date | undefined {
  const dates = paths.flatMap((path) => {
    const at = changedAt(path);
    return at ? [at.getTime()] : [];
  });

  return dates.length > 0 ? new Date(Math.max(...dates)) : undefined;
}

/**
 * Generates the sitemap for every published page.
 *
 * Entries are derived from the content registry rather than from navigation,
 * so documents reachable only by direct link are still discoverable. Pages
 * marked `hidden` are excluded — they are deliberately unlisted, and
 * advertising them in the sitemap would defeat that.
 *
 * Under the `hash` URL strategy the emitted URLs are hashes, which search
 * engines can crawl but which carry no descriptive value; the `path` strategy
 * is the one to use if organic search matters.
 *
 * @returns Sitemap entries for the home page and all visible content
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const { global, urlMap, docPaths, hiddenPaths } = getSite();
  const visible = docPaths.filter((path) => !hiddenPaths.has(path));

  const homeEntry: MetadataRoute.Sitemap[0] = {
    url: pageUrl('', global.baseUrl),
    lastModified: newestOf(visible),
    changeFrequency: 'weekly',
    priority: 1,
  };

  const contentEntries = visible.flatMap((path): MetadataRoute.Sitemap => {
    const url = docPathToUrl(urlMap, path);
    if (!url) return [];

    return [
      {
        url: pageUrl(url, global.baseUrl),
        lastModified: changedAt(path),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
    ];
  });

  // Tag pages are indexable and canonical, so leaving them out of the sitemap
  // said one thing to a crawler following links and another to one reading
  // this. The index is listed even when empty; a tag page only exists when
  // something carries it.
  const tags = getTags();

  const tagEntries: MetadataRoute.Sitemap = [
    {
      url: pageUrl('tags', global.baseUrl),
      lastModified: newestOf(tags.flatMap((tag) => tag.pages.map((page) => page.path))),
      changeFrequency: 'weekly',
      priority: 0.4,
    },
    ...tags.map((tag) => ({
      url: pageUrl(`tags/${encodeURIComponent(tag.slug)}`, global.baseUrl),
      lastModified: newestOf(tag.pages.map((page) => page.path)),
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    })),
  ];

  return [homeEntry, ...contentEntries, ...tagEntries];
}
