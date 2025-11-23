'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary component
 * Catches errors that occur outside of the normal error boundary
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <svg
                className="mx-auto h-16 w-16 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Critical Error
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              A critical error occurred. Please try refreshing the page.
            </p>

            {error.message && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 dark:text-red-200 font-mono break-words">
                  {error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={reset}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Try again
              </button>

              <a
                href="/"
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg transition-colors"
              >
                Go home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
