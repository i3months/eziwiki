import { MetadataRoute } from 'next';
import { payload } from '@/payload/config';
import { fileUrl } from '@/lib/basePath';

// Next 16 wants the intent stated even under `output: export`.
export const dynamic = 'force-static';

/**
 * Generates robots.txt.
 *
 * Nothing is disallowed. Search engines render a page before judging it, so
 * blocking `/_next/` — where the stylesheet and scripts live — leaves the
 * crawler looking at an unstyled document and reporting the assets as blocked
 * resources. There is no `/api/` either: the site is a static export.
 *
 * Pages that should stay out of the index carry `noindex` in their own
 * metadata, which is the mechanism that actually keeps them out. A path
 * disallowed here would still be indexable if something linked to it, since a
 * crawler that is told not to fetch a page cannot read the `noindex` on it.
 *
 * @returns Robots configuration
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: fileUrl('/sitemap.xml', payload.global.baseUrl),
  };
}
