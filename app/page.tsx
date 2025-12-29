import { PageTransition } from '@/components/markdown/PageTransition';

/**
 * Home page - shows empty state for New Tab
 */
export default function Home() {
  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="max-w-md">
          <svg
            className="w-20 h-20 mx-auto mb-6 text-gray-300 dark:text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Welcome to Documentation
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Select a page from the sidebar to get started, or click the + button to open a new tab.
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
