import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTag, getTags, type Tag } from '@/lib/content/tags';
import { getSite } from '@/lib/site';
import { pageUrl } from '@/lib/basePath';

interface PageProps {
  /** Next 15 turned route params into a promise; awaited where used */
  params: Promise<{ tag?: string[] }>;
}

/**
 * The tag index and every tag, served by one route.
 *
 * An optional catch-all rather than two routes because a static export refuses
 * a dynamic segment whose `generateStaticParams` comes back empty — which is
 * exactly what a new wiki has, before anyone has written a tag. Folded together,
 * the index is always one of the params and the build has something to make.
 */
export async function generateStaticParams() {
  return [{ tag: [] as string[] }, ...getTags().map((tag) => ({ tag: [tag.slug] }))];
}

/** The tag a route names, or null when the route is the index. */
function resolveTag(tag: string[] | undefined): Tag | null {
  const [slug] = tag ?? [];
  return slug ? getTag(slug) : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag: segments } = await params;
  const { global } = getSite();
  const [slug] = segments ?? [];

  if (!slug) {
    const canonical = pageUrl('tags', global.baseUrl);

    return {
      title: 'Tags',
      description: 'Subjects across the wiki',
      alternates: { canonical },
      openGraph: { title: 'Tags', description: 'Subjects across the wiki', url: canonical },
    };
  }

  const tag = getTag(slug);
  if (!tag) return { title: 'Tag', description: global.description };

  const title = tag.name;
  const description = `Pages about ${tag.name}`;
  const canonical = pageUrl(`tags/${encodeURIComponent(tag.slug)}`, global.baseUrl);

  return {
    title,
    description,
    alternates: { canonical },
    // Stated here as well: the layout's Open Graph block names the home page,
    // and a route that sets none of its own is shared as the home page.
    openGraph: { title, description, url: canonical },
  };
}

/**
 * Lists every subject, or the pages about one.
 *
 * The sidebar shows one arrangement — the folder tree — and this shows the
 * other. A page belongs to one section and to as many subjects as it touches,
 * and only this view can say so.
 */
export default async function TagsPage({ params }: PageProps) {
  const { tag: segments } = await params;
  const [slug] = segments ?? [];

  if (slug) {
    const tag = resolveTag(segments);
    if (!tag) notFound();

    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/tags/"
          className="text-xs uppercase tracking-wide text-gray-500 no-underline hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Tags
        </Link>

        <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{tag.name}</h1>

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {tag.pages.length} {tag.pages.length === 1 ? 'page' : 'pages'}
        </p>

        <ul className="mt-6 space-y-3">
          {tag.pages.map((page) => (
            <li key={page.path}>
              <Link
                href={page.url}
                className="block rounded-lg border border-gray-200 p-4 no-underline transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-800/50"
              >
                <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  {page.title}
                </span>
                {page.description && (
                  <span className="mt-1 block text-sm text-gray-600 dark:text-gray-400">
                    {page.description}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const tags = getTags();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Tags</h1>

      {tags.length === 0 ? (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          No tags yet. Add <code>tags</code> to a page&rsquo;s frontmatter and it will appear here.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {tags.length} {tags.length === 1 ? 'subject' : 'subjects'} across the wiki.
          </p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag.slug}>
                <Link
                  href={`/tags/${encodeURIComponent(tag.slug)}/`}
                  className="inline-flex items-baseline gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 no-underline transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:border-gray-700 dark:hover:bg-gray-800/50"
                >
                  {tag.name}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {tag.pages.length}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
