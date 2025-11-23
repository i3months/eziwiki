import React from 'react';
import ReactMarkdown from 'react-markdown';
import { remarkPlugins, rehypePlugins } from '@/lib/markdown/plugins';
import { CodeBlock } from '@/components/markdown/CodeBlock';
import { resolvePathToHash } from '@/lib/navigation/hash';
import { payload } from '@/payload/config';

/**
 * Props for the MarkdownRenderer component
 */
interface MarkdownRendererProps {
  /** Raw Markdown content to render */
  content: string;
}

/**
 * Renders Markdown content as styled HTML with syntax highlighting
 *
 * This component transforms Markdown text into beautifully styled HTML using
 * react-markdown with custom component mappings. It supports:
 * - GitHub Flavored Markdown (tables, task lists, strikethrough)
 * - Syntax-highlighted code blocks
 * - Responsive typography
 * - Dark mode support
 * - Semantic HTML elements
 *
 * The component applies Tailwind CSS classes for consistent styling and
 * automatically handles external links with proper security attributes.
 *
 * @param props - Component props
 * @param props.content - Raw Markdown string to render
 *
 * @example
 * ```tsx
 * const markdown = `
 * # Hello World
 *
 * This is a **bold** statement with a [link](https://example.com).
 *
 * \`\`\`typescript
 * const greeting = 'Hello!';
 * \`\`\`
 * `;
 *
 * <MarkdownRenderer content={markdown} />
 * ```
 */
export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={{
        h1: ({ children }) => (
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100 leading-tight">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mt-6 mb-3 text-gray-900 dark:text-gray-100 leading-snug">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold mt-5 mb-2 text-gray-900 dark:text-gray-100 leading-snug">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-lg sm:text-xl lg:text-2xl font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200 leading-normal">
            {children}
          </h4>
        ),
        h5: ({ children }) => (
          <h5 className="text-base sm:text-lg lg:text-xl font-semibold mt-3 mb-2 text-gray-800 dark:text-gray-200 leading-normal">
            {children}
          </h5>
        ),
        h6: ({ children }) => (
          <h6 className="text-sm sm:text-base lg:text-lg font-semibold mt-3 mb-2 text-gray-800 dark:text-gray-200 leading-normal">
            {children}
          </h6>
        ),
        p: ({ children }) => (
          <p className="text-sm sm:text-base lg:text-lg leading-relaxed mb-4 text-gray-700 dark:text-gray-300">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-5 mb-4 text-sm sm:text-base lg:text-lg text-gray-700 dark:text-gray-300">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-5 mb-4 text-sm sm:text-base lg:text-lg text-gray-700 dark:text-gray-300">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="leading-snug mb-1 [&>p]:mb-0 [&>p]:leading-snug">{children}</li>
        ),
        a: ({ href, children }) => {
          // Convert internal links to hash-based URLs
          let finalHref = href;

          if (href && !href.startsWith('http') && !href.startsWith('#')) {
            // Remove leading slash if present
            const cleanPath = href.startsWith('/') ? href.slice(1) : href;

            // Try to resolve to hash URL
            const hash = resolvePathToHash(cleanPath, payload.navigation);
            if (hash) {
              finalHref = `/${hash}`;
            }
          }

          return (
            <a
              href={finalHref}
              className="text-blue-600 dark:text-blue-400 hover:underline"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {children}
            </a>
          );
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4 text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">
            {children}
          </blockquote>
        ),
        code: ({
          inline,
          className,
          children,
          ...props
        }: {
          inline?: boolean;
          className?: string;
          children?: React.ReactNode;
        }) => {
          // Only handle inline code here
          // Block code is handled by the pre component
          if (inline) {
            return (
              <code
                className="px-1.5 py-0.5 rounded text-sm font-mono"
                style={{
                  backgroundColor: 'var(--color-code-bg)',
                  color: 'var(--color-code-text)',
                }}
                {...props}
              >
                {children}
              </code>
            );
          }

          // For block code, just return the code element
          // The pre component will handle the CodeBlock rendering
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        pre: ({ children }: { children?: React.ReactNode }) => {
          // Extract code content and language from children
          const childArray = React.Children.toArray(children);
          const codeElement = childArray[0] as React.ReactElement<{
            className?: string;
            children?: React.ReactNode;
          }>;

          // Helper function to extract text content from children
          const extractText = (node: React.ReactNode): string => {
            if (typeof node === 'string') return node;
            if (typeof node === 'number') return String(node);
            if (Array.isArray(node)) return node.map(extractText).join('');
            if (React.isValidElement(node)) {
              const props = node.props as { children?: React.ReactNode };
              if (props?.children) {
                return extractText(props.children);
              }
            }
            return '';
          };

          if (codeElement?.props?.className) {
            const match = /language-(\w+)/.exec(codeElement.props.className || '');
            const language = match ? match[1] : 'text';
            const code = extractText(codeElement.props.children).replace(/\n$/, '');

            return <CodeBlock language={language} code={code} />;
          }

          // Fallback for code blocks without language
          const code = extractText(codeElement?.props?.children || '').replace(/\n$/, '');
          return <CodeBlock language="text" code={code} />;
        },
        img: ({ src, alt }) => (
          <img src={src} alt={alt || ''} className="max-w-full h-auto rounded-lg my-4" />
        ),
        hr: () => <hr className="my-8 border-gray-300 dark:border-gray-700" />,
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>,
        tbody: ({ children }) => (
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {children}
          </tbody>
        ),
        tr: ({ children }) => <tr>{children}</tr>,
        th: ({ children }) => (
          <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm lg:text-base font-semibold text-gray-900 dark:text-gray-100">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm lg:text-base text-gray-700 dark:text-gray-300">
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
