import { parseMarkdownFile } from '@/lib/markdown/parser';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';
import { MarkdownSkeleton } from '@/components/markdown/MarkdownSkeleton';
import { PageTransition } from '@/components/markdown/PageTransition';
import { extractAllPaths } from '@/lib/navigation/builder';
import { generatePathHash, resolveHashToPath } from '@/lib/navigation/hash';
import { payload } from '@/payload/config';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';

interface PageProps {
  params: {
    slug: string[];
  };
}

/**
 * Generate metadata for each page based on frontmatter
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = params;
  const hash = slug.join('/');

  // Resolve hash to actual path
  const path = resolveHashToPath(hash, payload.navigation);

  if (!path) {
    return {
      title: payload.global.title,
      description: payload.global.description,
    };
  }

  try {
    const { frontmatter } = await parseMarkdownFile(path);

    const title = (frontmatter.title as string) || payload.global.title;
    const description = (frontmatter.description as string) || payload.global.description;
    const ogImage = frontmatter.ogImage as string | undefined;
    const baseUrl = payload.global.baseUrl || 'https://example.com';
    const canonicalUrl = `${baseUrl}/${hash}`;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      icons: {
        icon: (frontmatter.favicon as string) || payload.global.favicon || '/favicon.ico',
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        images: ogImage ? [ogImage] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ogImage ? [ogImage] : undefined,
      },
    };
  } catch {
    return {
      title: payload.global.title,
      description: payload.global.description,
    };
  }
}

/**
 * Generate static params for all navigation paths using hash-based URLs
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

  // Convert paths to hash-based slug arrays for Next.js
  return validPaths.map((path) => {
    const hash = generatePathHash(path);
    return {
      slug: hash.split('/'),
    };
  });
}

/**
 * Content component that loads and renders markdown
 */
async function MarkdownContent({ path, hash }: { path: string; hash: string }) {
  try {
    const { content, frontmatter } = await parseMarkdownFile(path);
    const baseUrl = payload.global.baseUrl || 'https://example.com';
    const canonicalUrl = `${baseUrl}/${hash}`;
    const hasMath = content.includes('$') || content.includes('\\[') || content.includes('\\(');

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: (frontmatter.title as string) || payload.global.title,
              description: (frontmatter.description as string) || payload.global.description,
              url: canonicalUrl,
              datePublished: frontmatter.date || new Date().toISOString(),
              dateModified: frontmatter.updated || frontmatter.date || new Date().toISOString(),
              author: {
                '@type': 'Organization',
                name: payload.global.title,
              },
            }),
          }}
        />
        {hasMath && (
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
          />
        )}
        <MarkdownRenderer content={content} />
      </>
    );
  } catch (error) {
    notFound();
  }
}

/**
 * Dynamic content page component
 * Renders Markdown content based on the hash-based URL slug
 */
export default async function ContentPage({ params }: PageProps) {
  const { slug } = params;
  const hash = slug.join('/');

  // Resolve hash to actual file path
  const path = resolveHashToPath(hash, payload.navigation);

  if (!path) {
    notFound();
  }

  return (
    <PageTransition>
      <article className="prose prose-slate max-w-none dark:prose-invert">
        <Suspense fallback={<MarkdownSkeleton />}>
          <MarkdownContent path={path} hash={hash} />
        </Suspense>
      </article>
    </PageTransition>
  );
}
