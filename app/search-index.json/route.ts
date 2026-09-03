import { buildSearchIndex } from '@/lib/search/build';

/**
 * Serves the search index.
 *
 * A route handler rather than a file a script writes into `public/`, for the
 * same reason `llms.txt` is one: the content derives from the wiki. As a
 * build artefact the index also went stale in development — a page added
 * while `next dev` ran was unsearchable until a restart, silently. Here the
 * dev server derives it per request off the same memo every page uses, and
 * the export writes it out as the same static file it always shipped.
 */
export const dynamic = 'force-static';

export async function GET(): Promise<Response> {
  const index = await buildSearchIndex();

  return new Response(JSON.stringify(index), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
