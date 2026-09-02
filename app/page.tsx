import type { Metadata } from 'next';
import { PageTransition } from '@/components/markdown/PageTransition';
import { pageUrl } from '@/lib/basePath';
import { getSite } from '@/lib/site';
import { payload } from '@/payload/config';

export const metadata: Metadata = {
  title: { absolute: payload.global.title },
  alternates: { canonical: pageUrl('', payload.global.baseUrl) },
};

/**
 * The home page: an empty state until a page is chosen.
 *
 * In the wiki's own words — it was the one screen hardcoded in English, on
 * the address people share first.
 */
export default function Home() {
  const { global, strings } = getSite();

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
            {global.title || strings.homeEmptyTitle}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{strings.homeEmptyBody}</p>
        </div>
      </div>
    </PageTransition>
  );
}
