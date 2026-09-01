import { MarkdownContent } from '@/components/markdown/MarkdownContent';
import { PageTransition } from '@/components/markdown/PageTransition';
import { TableOfContents } from '@/components/layout/TableOfContents';
import { Backlinks } from '@/components/layout/Backlinks';
import { LocalGraph } from '@/components/layout/LocalGraph';
import { PageNavigation } from '@/components/layout/PageNavigation';
import { PageTags } from '@/components/layout/PageTags';
import { PageMeta } from '@/components/layout/PageMeta';
import { MovedPage } from '@/components/layout/MovedPage';
import { getBacklinks, getLocalGraph } from '@/lib/graph/build';
import { getAdjacentPages } from '@/lib/navigation/sequence';
import { getAliasMap, aliasUrl, resolveAliasUrl } from '@/lib/content/aliases';
import { getTagsFor } from '@/lib/content/tags';
import { getLastModified, getPublished } from '@/lib/content/lastModified';
import { getEditUrl } from '@/lib/content/editUrl';
import { getExcerpt } from '@/lib/content/excerpt';
import { oneLine } from '@/lib/content/llms';
import { jsonLd } from '@/lib/seo/jsonLd';
import { getBreadcrumbTrail } from '@/lib/navigation/breadcrumb';
import { renderDoc } from '@/lib/markdown/render';
import { getDoc, type ContentDoc } from '@/lib/content/registry';
import { docPathToUrl, urlToDocPath } from '@/lib/navigation/url';
import { getSite } from '@/lib/site';
import { asset, fileUrl, pageUrl } from '@/lib/basePath';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface PageProps {
  params: {
    slug: string[];
  };
}

/**
 * Resolves a route's slug segments to a document in the content registry.
 *
 * Under the `path` strategy a slug has one segment per directory level; under
 * `hash` it is a single opaque segment. Joining first and resolving through the
 * URL map handles both without the route needing to know which is in effect.
 *
 * @param slug - Route segments captured by the catch-all route
 * @returns The content path and its canonical URL segment, or null
 */
function resolveSlug(slug: string[]): { path: string; url: string } | null {
  const { urlMap } = getSite();
  const url = decodeSegments(slug);
  const path = urlToDocPath(urlMap, url);

  return path ? { path, url } : null;
}

/**
 * Joins route segments as the URL map keys them.
 *
 * The dev server hands the segments percent-encoded — `/한글-페이지/` arrives
 * as `%ED%95%9C…` — while the export writes files by the raw name and the map
 * is keyed by it. Undecoded, every non-ASCII page 404ed in the one tool its
 * author writes with. A segment that is not valid percent-encoding is kept
 * as written.
 *
 * @param slug - Route segments captured by the catch-all route
 * @returns The URL segment, decoded
 */
function decodeSegments(slug: string[]): string {
  return slug
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join('/');
}

/**
 * Resolves a slug that names a page's former address.
 *
 * Checked only after the live map misses, so a real page always wins over an
 * alias — an alias shadowing a page is refused when the index is built, but
 * order here makes the intent explicit.
 *
 * @param slug - Route segments captured by the catch-all route
 * @returns The document that superseded the address, and its URL, or null
 */
function resolveMoved(slug: string[]): { path: string; url: string } | null {
  const { urlMap } = getSite();
  const path = resolveAliasUrl(decodeSegments(slug), urlMap.strategy);
  if (!path) return null;

  const url = docPathToUrl(urlMap, path);
  return url ? { path, url } : null;
}

/**
 * Generates per-page metadata from the document's frontmatter.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { global, hiddenPaths } = getSite();
  const resolved = resolveSlug(params.slug);
  const doc = resolved ? getDoc(resolved.path) : undefined;

  if (!resolved || !doc) {
    const moved = resolveMoved(params.slug);
    const target = moved ? getDoc(moved.path) : undefined;

    // A former address should not compete with the page it forwards to: it is
    // kept out of the index, and points its canonical at the destination so any
    // ranking the old URL earned transfers rather than being split.
    if (moved && target) {
      return {
        title: target.title,
        description: describe(target, moved.path),
        alternates: { canonical: pageUrl(moved.url, global.baseUrl) },
        robots: { index: false, follow: true },
      };
    }

    return { title: global.title, description: global.description };
  }

  const title = doc.title;
  const description = describe(doc, resolved.path);
  const rawOgImage = doc.frontmatter.ogImage as string | undefined;
  const ogImage = rawOgImage ? fileUrl(rawOgImage, global.baseUrl) : undefined;
  const canonicalUrl = pageUrl(resolved.url, global.baseUrl);

  // The site's own images when the page names none. Next replaces the
  // layout's Open Graph block with this one rather than merging them, so
  // without the fallback every content page was shared as a text-only card
  // while the home page had its picture.
  const { seo } = global;
  const siteImages = seo?.openGraph?.images?.map((image) => ({
    ...image,
    url: fileUrl(image.url, global.baseUrl),
  }));
  const images = ogImage ? [ogImage] : siteImages;
  const twitterImages = ogImage
    ? [ogImage]
    : (seo?.twitter?.images?.map((image) => fileUrl(image, global.baseUrl)) ??
      siteImages?.map((image) => image.url));

  const published = getPublished(resolved.path);
  const modified = getLastModified(resolved.path)?.iso ?? published;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    icons: {
      icon: asset((doc.frontmatter.favicon as string) || global.favicon || '/favicon.ico'),
    },
    // Hidden pages stay reachable by direct link but should not be indexed.
    robots: hiddenPaths.has(resolved.path) ? { index: false, follow: false } : undefined,
    openGraph: {
      // `article` rather than the default `website`: a documentation page is a
      // document, and the type is what lets the two timestamps below be stated
      // at all. Both are how a crawler tells a page kept current from one
      // written once — omitted when nothing knows, never stamped with the
      // build.
      type: 'article',
      publishedTime: published ?? undefined,
      modifiedTime: modified ?? undefined,
      title,
      description,
      url: canonicalUrl,
      images,
    },
    twitter: {
      card: seo?.twitter?.card ?? 'summary_large_image',
      site: seo?.twitter?.site,
      creator: seo?.twitter?.creator,
      title,
      description,
      images: twitterImages,
    },
  };
}

/**
 * The description a page is announced with.
 *
 * The author's own first; otherwise the page's opening lines, as `llms.txt`
 * already summarises it. Falling straight through to the site description
 * gave every undescribed page the same one, so a search result for "Code
 * Blocks" read as a pitch for the wiki.
 *
 * @param doc - The document
 * @param path - Its content path
 * @returns One line of description
 */
function describe(doc: ContentDoc, path: string): string {
  return doc.description || oneLine(getExcerpt(path)) || getSite().global.description;
}

/**
 * Enumerates every document for static generation.
 *
 * The list comes from the content registry, so a Markdown file is built whether
 * or not navigation references it. That is what lets hidden and unlisted pages
 * work without a parallel registration step.
 */
export async function generateStaticParams() {
  const { urlMap, docPaths } = getSite();

  const pages = docPaths.flatMap((path) => {
    const url = docPathToUrl(urlMap, path);
    return url ? [{ slug: url.split('/') }] : [];
  });

  // Former addresses are built too, each as a page that forwards. Without this
  // there is nothing at the old URL for a static host to serve.
  const moved = [...getAliasMap().keys()].map((alias) => ({
    slug: aliasUrl(alias, urlMap.strategy).split('/'),
  }));

  return [...pages, ...moved];
}

/**
 * Emits Article structured data for a document.
 */
function ArticleSchema({ doc, url }: { doc: ContentDoc; url: string }) {
  const { global } = getSite();
  const published = getPublished(doc.path);
  // The same resolution the footer shows, so a crawler and a reader are never
  // told different things about when the page last changed.
  const modified = getLastModified(doc.path)?.iso ?? published;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        // Through `jsonLd`, never `JSON.stringify`: the title is a
        // contributor's to write, and `</script>` in it ended the data block.
        __html: jsonLd({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: doc.title,
          description: describe(doc, doc.path),
          // Through `pageUrl`, as the canonical is: built by hand it lacked
          // the trailing slash every page is served with and ignored the
          // site URL override, so the two named different addresses.
          url: pageUrl(url, global.baseUrl),
          // Dates are omitted when absent rather than stamped with the build
          // time: a fabricated date misleads both readers and crawlers.
          ...(published ? { datePublished: published } : {}),
          ...(modified ? { dateModified: modified } : {}),
          author: {
            '@type': 'Organization',
            name: global.title,
          },
        }),
      }}
    />
  );
}

/**
 * Emits the trail to this page as structured data.
 *
 * The same walk the visible breadcrumb makes, so the two cannot disagree —
 * structured data describing a trail the page does not show is the kind of
 * mismatch that costs more than the markup gains.
 *
 * A page the navigation does not contain gets nothing rather than a trail
 * invented from its URL, which for the `hash` strategy would be a single
 * meaningless digest anyway.
 */
function BreadcrumbSchema({ path }: { path: string }) {
  const { global, navigation, urlMap } = getSite();
  const trail = getBreadcrumbTrail(navigation, path);

  if (!trail || trail.length < 2) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: jsonLd({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: trail.map((crumb, index) => {
            const url = crumb.path ? docPathToUrl(urlMap, crumb.path) : null;

            return {
              '@type': 'ListItem',
              position: index + 1,
              name: crumb.name,
              // A section that is only a heading has nowhere to point, and
              // schema.org allows the item to be a bare name for exactly that.
              ...(url ? { item: pageUrl(url, global.baseUrl) } : {}),
            };
          }),
        }),
      }}
    />
  );
}

/**
 * Renders a content page: the document body, plus its table of contents on
 * screens wide enough to carry a second column.
 */
export default async function ContentPage({ params }: PageProps) {
  const resolved = resolveSlug(params.slug);

  if (!resolved) {
    const moved = resolveMoved(params.slug);
    const target = moved ? getDoc(moved.path) : undefined;

    if (moved && target) return <MovedPage url={`/${moved.url}/`} title={target.title} />;

    notFound();
  }

  const doc = getDoc(resolved.path);
  const rendered = await renderDoc(resolved.path);

  if (!doc || !rendered) notFound();

  return (
    <PageTransition>
      <div className="flex gap-8">
        <article className="prose prose-slate min-w-0 max-w-none flex-1 dark:prose-invert">
          <ArticleSchema doc={doc} url={resolved.url} />
          <BreadcrumbSchema path={resolved.path} />
          <PageTags tags={getTagsFor(resolved.path)} />
          <MarkdownContent html={rendered.html} />
          <PageMeta
            lastModified={getLastModified(resolved.path)}
            editUrl={getEditUrl(resolved.path)}
          />
          <PageNavigation adjacent={getAdjacentPages(resolved.path)} />
          <Backlinks links={getBacklinks(resolved.path)} />
          <LocalGraph graph={getLocalGraph(resolved.path)} path={resolved.path} />
        </article>

        <aside className="hidden w-56 flex-shrink-0 xl:block print:hidden">
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <TableOfContents headings={rendered.headings} />
          </div>
        </aside>
      </div>
    </PageTransition>
  );
}
