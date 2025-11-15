import { parseMarkdownFile } from '@/lib/markdown/parser';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';

/**
 * Home page - renders the intro/default content
 */
export default async function Home() {
  // Load the intro/default content
  const { content } = await parseMarkdownFile('intro');

  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <MarkdownRenderer content={content} />
    </article>
  );
}
