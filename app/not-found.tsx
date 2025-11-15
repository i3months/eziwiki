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
          <h1 className="text-9xl font-bold text-gray-300 dark:text-gray-700">404</h1>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Page not found</h2>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or the content file is missing.
        </p>

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
