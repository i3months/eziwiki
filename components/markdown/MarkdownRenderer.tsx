import React from 'react';
import ReactMarkdown from 'react-markdown';
import { remarkPlugins, rehypePlugins } from '@/lib/markdown/plugins';
import { CodeBlock } from '@/components/markdown/CodeBlock';

interface MarkdownRendererProps {
  content: string;
}

/**
 * Renders Markdown content with styled components and syntax highlighting
 */
export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={{
        h1: ({ children }) => (
          <h1 className="text-4xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-3xl font-semibold mt-6 mb-3 text-gray-900 dark:text-gray-100">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-2xl font-semibold mt-5 mb-2 text-gray-900 dark:text-gray-100">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-xl font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
            {children}
          </h4>
        ),
        h5: ({ children }) => (
          <h5 className="text-lg font-semibold mt-3 mb-2 text-gray-800 dark:text-gray-200">
            {children}
          </h5>
        ),
        h6: ({ children }) => (
          <h6 className="text-base font-semibold mt-3 mb-2 text-gray-800 dark:text-gray-200">
            {children}
          </h6>
        ),
        p: ({ children }) => (
          <p className="text-base leading-7 mb-4 text-gray-700 dark:text-gray-300">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="ml-4">{children}</li>,
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-blue-600 dark:text-blue-400 hover:underline"
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4 text-gray-600 dark:text-gray-400">
            {children}
          </blockquote>
        ),
        code: ({ inline, className, children, ...props }: any) => {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';

          if (!inline && language) {
            return <CodeBlock language={language} code={String(children).replace(/\n$/, '')} />;
          }

          return (
            <code
              className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200"
              {...props}
            >
              {children}
            </code>
          );
        },
        pre: ({ children }) => <div className="mb-4">{children}</div>,
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
          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
