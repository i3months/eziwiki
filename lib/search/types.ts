/**
 * Shared shapes for the search index.
 *
 * This module is isomorphic on purpose: the build script writes the index and
 * the browser reads it, and both need to agree on the format.
 */

/** One searchable unit — a whole document, or a section within one. */
export interface SearchDoc {
  /** Stable identifier, `path` for a page and `path#anchor` for a section */
  id: string;
  /** Href to navigate to, resolved under the site's URL strategy */
  url: string;
  /** Title of the page this entry belongs to */
  title: string;
  /** Heading text when this entry is a section, otherwise undefined */
  section?: string;
  /**
   * Page description from frontmatter — on the page entry, and on a section
   * with no text of its own, where the excerpt falls back to it
   */
  description?: string;
  /** Plain-text body of the page or section, used for matching and previews */
  body: string;
  /**
   * The page's file name run together — `wikilinks` for `wiki-links.md` —
   * on the page entry only. What a reader types without the space or the
   * hyphen matched nothing before.
   */
  slug?: string;
  /** The page's tags, space-separated, on the page entry only */
  tags?: string;
}

/** The generated index file, as served to the browser. */
export interface SearchIndex {
  /** Format version, so a stale cached index can be detected and ignored */
  version: number;
  /** Every searchable entry */
  docs: SearchDoc[];
}

/** Current index format version. Bump when the SearchDoc shape changes. */
export const SEARCH_INDEX_VERSION = 3;

/** Public path the generated index is served from. */
export const SEARCH_INDEX_PATH = '/search-index.json';
