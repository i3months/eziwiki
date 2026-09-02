import { CodeCopy } from './CodeCopy';
import { LinkPreview } from './LinkPreview';
import { PdfEmbeds } from './PdfEmbed';

/**
 * Props for the MarkdownContent component
 */
interface MarkdownContentProps {
  /** HTML produced at build time by the Markdown pipeline */
  html: string;
}

/**
 * Renders pre-compiled Markdown HTML.
 *
 * The markup arrives already parsed, highlighted, and link-resolved from
 * `renderDoc()`, so this is a server component that emits static HTML. The only
 * client-side code attaches behaviour to what the build produced: the copy
 * buttons, the link previews, and the viewers for any embedded documents.
 *
 * Passing build-time output to `dangerouslySetInnerHTML` is safe here in the
 * sense that matters: the input is the repository's own content files, not user
 * submissions. Raw HTML in Markdown is intentionally supported.
 *
 * @param props - Component props
 * @param props.html - Rendered HTML for the document body
 *
 * @example
 * ```tsx
 * const rendered = await renderDoc('guides/quick-start');
 * <MarkdownContent html={rendered.html} />;
 * ```
 */
export function MarkdownContent({ html }: MarkdownContentProps) {
  return (
    <>
      {/* nosemgrep -- the html is produced by this site's own build from the
          author's Markdown; raw HTML passing through is the documented trust
          model (see Security Model in the README). */}
      <div className="ezw-prose" dangerouslySetInnerHTML={{ __html: html }} />
      <CodeCopy />
      <LinkPreview />
      <PdfEmbeds />
    </>
  );
}
