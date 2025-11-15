import { parseMarkdownFile } from '@/lib/markdown/parser';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';
import { extractAllPaths } from '@/lib/navigation/builder';
import { payload } from '@/payload/config';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    slug: string[];
  };
}

/**
 * Generate static params for all navigation paths
 * This enables static site generation for all content pages
 */
export async function generateStaticParams() {
  const paths = extractAllPaths(payload.navigation);

  // Validate that content files exist for all paths
  const validPaths: string[] = [];

  for (const path of paths) {
    try {
      await parseMarkdownFile(path);
      validPaths.push(path);
    } catch (error) {
      console.error(
        `⚠️  Warning: Missing content file for navigation path: ${path}\n` +
          `   Expected file: content/${path}.md\n` +
          '   This path will not be generated.',
      );
    }
  }

  // Convert paths to slug arrays for Next.js
  return validPaths.map((path) => ({
    slug: path.split('/'),
  }));
}

/**
 * Dynamic content page component
 * Renders Markdown content based on the URL slug
 */
export default async function ContentPage({ params }: PageProps) {
  const { slug } = params;
  const path = slug.join('/');

  try {
    const { content } = await parseMarkdownFile(path);

    return (
      <article className="prose prose-slate max-w-none dark:prose-invert">
        <MarkdownRenderer content={content} />
      </article>
    );
  } catch (error) {
    // If content file doesn't exist, show 404
    notFound();
  }
}
