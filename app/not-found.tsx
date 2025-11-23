import Link from 'next/link';

/**
 * 404 Not Found page
 * Displayed when a page or content file doesn't exist
 */
export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <svg
            className="mx-auto h-24 w-24 text-gray-300 dark:text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Page not found
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-2">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
          Try using the navigation sidebar to find what you&apos;re looking for.
        </p>

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
