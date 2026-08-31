import { GraphView } from '@/components/graph/GraphView';
import { PageTransition } from '@/components/markdown/PageTransition';
import { getLinkGraph } from '@/lib/graph/build';
import { layout } from '@/lib/graph/layout';
import { getWantedPages } from '@/lib/graph/health';
import { format } from '@/lib/i18n/strings';
import { formatNodes } from '@/lib/i18n/nodes';
import { getStrings } from '@/lib/site';
import { getSite } from '@/lib/site';
import { pageUrl } from '@/lib/basePath';
import type { Metadata } from 'next';

/**
 * The link graph view.
 *
 * A static route, so it takes precedence over the catch-all content route and
 * cannot be shadowed by a page named `graph`.
 */

export function generateMetadata(): Metadata {
  const { global, strings } = getSite();

  const canonical = pageUrl('graph', global.baseUrl);

  return {
    title: strings.graph,
    description: strings.graphDescription,
    alternates: { canonical },
    openGraph: { title: strings.graph, description: strings.graphDescription, url: canonical },
    // The graph is navigation, not content; there is nothing here for a search
    // engine to index that the pages themselves do not already provide.
    robots: { index: false, follow: true },
  };
}

/** Nominal layout area, matching what the view would use on its own. */
const AREA = { width: 900, height: 640 };

export default function GraphPage() {
  const { nodes, edges, broken } = getLinkGraph();
  // Laid out here, once, rather than in every reader's browser.
  const positions = layout(
    nodes.map((node) => node.path),
    edges,
    AREA,
  );
  const linked = nodes.filter((node) => node.degree > 0).length;
  const t = getStrings();
  const wanted = getWantedPages();
  // Listed where they are written, because that is where the fix goes. The
  // missing ones are listed below by the page being asked for instead.
  const ambiguous = broken.filter((link) => link.reason === 'ambiguous');

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{t.graph}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {format(t.graphSummary, {
            pages: nodes.length,
            links: edges.length,
            connected: linked,
          })}{' '}
          {t.graphHint}
        </p>
      </div>

      <GraphView nodes={nodes} edges={edges} positions={positions} />

      {ambiguous.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {format(t.unresolvedLinks, { count: ambiguous.length })}
          </h2>
          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            {ambiguous.map((link, index) => (
              <li key={`${link.from}-${link.target}-${index}`}>
                {formatNodes(t.unresolvedLink, {
                  target: <code className="text-red-600 dark:text-red-400">[[{link.target}]]</code>,
                  page: <span className="text-gray-900 dark:text-gray-200">{link.from}</span>,
                })}{' '}
                — {format(t.unresolvedAmbiguous, { candidates: link.candidates?.join(', ') ?? '' })}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/*
        The same links the check reports, turned around: a page several
        documents already expect is the wiki saying what to write next, which a
        list of faults in the pages containing the links does not.
      */}
      {wanted.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {format(t.wantedPages, { count: wanted.length })}
          </h2>
          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            {wanted.map((page) => (
              <li key={page.target}>
                <code className="text-red-600 dark:text-red-400">[[{page.target}]]</code>{' '}
                <span className="text-gray-500 dark:text-gray-500">
                  — {format(t.wantedBy, { count: page.wantedBy.length })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageTransition>
  );
}
