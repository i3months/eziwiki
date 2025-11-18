'use client';

import React, { useState } from 'react';

/**
 * Props for the CodeBlock component
 */
interface CodeBlockProps {
  /** Programming language identifier for syntax highlighting */
  language: string;
  /** Source code to display */
  code: string;
}

/**
 * Renders a syntax-highlighted code block with copy-to-clipboard functionality
 *
 * This component displays code with a language label and a copy button.
 * When the copy button is clicked, the code is copied to the clipboard
 * and the button shows a confirmation message for 2 seconds.
 *
 * @param props - Component props
 * @param props.language - Programming language identifier (e.g., 'typescript', 'python', 'bash')
 * @param props.code - The source code to display
 *
 * @example
 * ```tsx
 * <CodeBlock
 *   language="typescript"
 *   code="const greeting = 'Hello, World!';"
 * />
 * ```
 */
export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="relative group mb-4">
      <div className="flex items-center justify-between bg-gray-900 dark:bg-black px-4 py-2 rounded-t-lg border-b border-gray-700 dark:border-gray-800">
        <span className="text-xs font-mono text-gray-400 uppercase">{language || 'text'}</span>
        <button
          onClick={handleCopy}
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-1 rounded hover:bg-gray-700"
          aria-label="Copy code"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="bg-gray-900 dark:bg-black p-4 overflow-x-auto m-0">
        <code className="text-sm font-mono text-gray-100">{code}</code>
      </pre>
    </div>
  );
}
