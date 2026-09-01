import type MiniSearch from 'minisearch';
import { isCjk, tokenize } from './tokenizer';
import { SEARCH_INDEX_PATH, SEARCH_INDEX_VERSION, type SearchDoc, type SearchIndex } from './types';

/**
 * Browser-side search.
 *
 * The index is fetched and built on first use rather than at page load, so a
 * reader who never opens search never pays for it.
 */

/** A search hit, with the excerpt to display. */
export interface SearchResult {
  /** Stable identifier of the matched entry */
  id: string;
  /** Href to navigate to, including the section anchor when there is one */
  url: string;
  /** Page title */
  title: string;
  /** Section heading, when the hit is a section rather than a whole page */
  section?: string;
  /** Body excerpt centred on the match */
  excerpt: string;
  /**
   * The document terms the query matched, for highlighting. The words the
   * reader typed are not always in the text: `설치를` matches `설치`, and
   * `linkz` matches `links`.
   */
  terms: string[];
}

/** Characters of context shown around a match. */
const EXCERPT_CHARS = 160;

/** Maximum hits returned to the UI. */
const MAX_RESULTS = 20;

/**
 * Field weights.
 *
 * A query naming a section should surface that section above pages that merely
 * mention the words in passing, so headings outrank body text substantially.
 */
const BOOST = { title: 4, section: 3, slug: 3, tags: 2, description: 2, body: 1 };

/**
 * Extra weight given to whole-page entries over the sections within them.
 *
 * A section entry carries its page's title as well as its own heading, so it
 * matches both boosted fields and would otherwise always outrank the page it
 * belongs to. Searching "dark mode" should land on the Dark Mode page, not on
 * its "Disable Dark Mode" subsection.
 */
const PAGE_BOOST = 1.6;

/**
 * Scales a hit's score according to whether it is a page or a section.
 *
 * @param _id - Document id, unused
 * @param _term - Matched term, unused
 * @param stored - The fields stored alongside the document
 * @returns Multiplier applied to the hit's score
 */
function boostPages(_id: string, _term: string, stored?: Record<string, unknown>): number {
  return stored?.section ? 1 : PAGE_BOOST;
}

let loading: Promise<MiniSearch<SearchDoc>> | null = null;

/**
 * Builds the MiniSearch instance from index data.
 *
 * The library is imported dynamically so it lands in its own chunk, fetched
 * alongside the index on first search rather than on every page load.
 *
 * @param index - Parsed index file
 * @returns A populated searcher
 */
export async function createSearcher(index: SearchIndex): Promise<MiniSearch<SearchDoc>> {
  const { default: MiniSearchCtor } = await import('minisearch');

  const searcher = new MiniSearchCtor<SearchDoc>({
    idField: 'id',
    fields: ['title', 'section', 'slug', 'tags', 'description', 'body'],
    storeFields: ['title', 'section', 'url', 'body', 'description'],
    // The same tokeniser must run over queries and documents, or a CJK query
    // would be split differently from the terms stored for a document.
    tokenize,
  });

  searcher.addAll(index.docs);
  return searcher;
}

/**
 * Fetches and prepares the search index, once per page load.
 *
 * Concurrent callers share a single request: opening the dialog, typing
 * immediately, and a keyboard shortcut firing can all land within the same tick.
 *
 * @returns The ready searcher
 * @throws Error if the index cannot be fetched or is of an unexpected version
 */
export function loadSearcher(): Promise<MiniSearch<SearchDoc>> {
  loading ??= (async () => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const response = await fetch(`${basePath}${SEARCH_INDEX_PATH}`);

    if (!response.ok) {
      throw new Error(`Search index unavailable (${response.status})`);
    }

    const index = (await response.json()) as SearchIndex;

    // A cached index of another shape would not fail loudly: its entries
    // simply lack the fields read off a hit, and the first result the reader
    // picks navigates to `undefined`.
    if (index.version !== SEARCH_INDEX_VERSION) {
      throw new Error(`Search index version ${index.version} is not ${SEARCH_INDEX_VERSION}`);
    }

    return await createSearcher(index);
  })().catch((error) => {
    // Allow a later attempt to retry rather than caching the failure forever.
    loading = null;
    throw error;
  });

  return loading;
}

/**
 * Builds an excerpt centred on the first matched term.
 *
 * Showing the start of a long section is rarely useful — the reason a result
 * matched is usually somewhere in the middle.
 *
 * @param body - Full body text of the entry
 * @param terms - Terms MiniSearch matched
 * @returns A trimmed excerpt, with ellipses where text was cut
 */
export function buildExcerpt(body: string, terms: string[]): string {
  if (!body) return '';

  const lower = body.toLowerCase();
  let at = -1;

  // Longest term first: a Korean query also matches through its bigrams,
  // and centring on `하기` when `배포하기` is in the text misses the point.
  const byLength = [...terms].sort((a, b) => b.length - a.length);
  const longest = byLength[0]?.length ?? 0;

  for (const term of byLength) {
    if (at !== -1 && term.length < longest) break;
    const found = lower.indexOf(term.toLowerCase());
    if (found !== -1 && (at === -1 || found < at)) at = found;
  }

  if (at === -1 || body.length <= EXCERPT_CHARS) {
    return body.slice(0, EXCERPT_CHARS) + (body.length > EXCERPT_CHARS ? '…' : '');
  }

  const start = Math.max(0, at - EXCERPT_CHARS / 3);
  const end = Math.min(body.length, start + EXCERPT_CHARS);

  return (start > 0 ? '…' : '') + body.slice(start, end).trim() + (end < body.length ? '…' : '');
}

/**
 * Runs a query against the loaded index.
 *
 * @param query - Raw user input
 * @returns Ranked results, empty for a blank query
 *
 * @example
 * ```typescript
 * const results = await search('dark mode');
 * results[0].url; // '/features/dark-mode'
 * ```
 */
/**
 * Shapes a query so a Korean word matches through any of its parts.
 *
 * The tokeniser expands `설치를` to `설치를`, `설치` and `치를`, and as a
 * plain string those were required all together — so a document had to
 * contain the bigram straddling the particle, and `설치를` found two entries
 * where `설치` found five. Each word of three or more CJK characters becomes
 * its own OR group; the words themselves still combine with AND. A whole-word
 * match still ranks first, since MiniSearch scores by how many terms of the
 * query matched.
 *
 * @param query - Trimmed user input
 * @param combineWith - How the words combine
 * @returns A MiniSearch query
 */
export function buildQuery(query: string, combineWith: 'AND' | 'OR'): Query {
  const words = query.split(/\s+/).filter(Boolean);

  return {
    combineWith,
    queries: words.map((word) =>
      isCjk(word.toLowerCase()) && [...word].length > 2
        ? { queries: [word], combineWith: 'OR' as const }
        : word,
    ),
  };
}

/** A MiniSearch query: a string, or a tree of them. */
type Query = string | { combineWith: 'AND' | 'OR'; queries: Query[] };

/**
 * How many edits a term may be off by.
 *
 * At one fifth of the length a three-letter term was allowed one edit, so
 * `toc` matched `to` and `too` in two hundred and fifty places, none of
 * them the contents rail. Terms shorter than four letters have to be exact.
 */
function fuzzyFor(term: string): number | false {
  return term.length >= 4 ? 0.2 : false;
}

export async function search(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const searcher = await loadSearcher();

  const options = {
    boost: BOOST,
    prefix: true,
    fuzzy: fuzzyFor,
    boostDocument: boostPages,
  };

  const hits = searcher.search(buildQuery(trimmed, 'AND'), options);

  // An AND query that matches nothing is usually one stray word away from a
  // useful result, so fall back to OR rather than showing an empty list.
  const results = hits.length ? hits : searcher.search(buildQuery(trimmed, 'OR'), options);

  return results.slice(0, MAX_RESULTS).map((hit) => ({
    id: String(hit.id),
    url: hit.url as string,
    title: hit.title as string,
    section: hit.section as string | undefined,
    // A heading with nothing but subsections under it has no body; the
    // page's description stands in rather than an empty line.
    excerpt:
      buildExcerpt((hit.body as string) ?? '', hit.terms) ||
      ((hit.description as string | undefined) ?? ''),
    terms: hit.terms,
  }));
}
