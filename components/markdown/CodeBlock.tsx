'use client';

import React, { useState } from 'react';

interface CodeBlockProps {
  language: string;
  code: string;
}

/**
 * Renders a syntax-highlighted code block with copy functionality
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
      <div className="flex items-center justify-between bg-gray-800 dark:bg-gray-900 px-4 py-2 rounded-t-lg">
        <span className="text-xs font-mono text-gray-400 uppercase">{language || 'text'}</span>
        <button
          onClick={handleCopy}
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-1 rounded hover:bg-gray-700"
          aria-label="Copy code"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="bg-gray-900 dark:bg-black p-4 rounded-b-lg overflow-x-auto">
        <code className="text-sm font-mono text-gray-100 block">{code}</code>
      </pre>
    </div>
  );
}
