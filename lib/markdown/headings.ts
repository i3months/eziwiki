import GithubSlugger from 'github-slugger';
import { toString as mdastToString } from 'mdast-util-to-string';
import { visit } from 'unist-util-visit';
import type { Heading, Root, RootContent, Text } from 'mdast';
import { WIKILINK_PATTERN, parseWikiLink } from './wikilink';
import { resolveTarget } from '../content/resolver';

/**
 * Heading ids computed from the source, as the render will assign them.
 *
 * rehype-slug ids the rendered heading, so `## See [[quick-start|Alias]]`
 * is "See Alias" and gets `see-alias`, and inline HTML contributes nothing.
 * Slugging the raw source gave `see-quick-startalias` for the same heading,
 * and a section include naming the id the page itself advertises found
 * nothing. Anything that has to know a heading's id before the page is
 * rendered — section includes, the link check — reads it from here.
 *
 * Server-only: a wiki link with no label shows the title of the page it
 * resolves to, which takes the resolver.
 */

/** A heading's position, level and the id it will render with. */
export interface HeadingSlug {
  /**
   * Index of the heading among the document's top-level nodes; absent for
   * a heading nested in a callout, a quote or a list, which has an id like
   * any other but cannot start a section include
   */
  index?: number;
  /** Heading level, 1–6 */
  depth: number;
  /** The id, numbered for repeats as rehype-slug numbers them */
  slug: string;
}

/**
 * Slugs an anchor as rehype-slug ids a heading.
 *
 * Authors coming from Obsidian write `[[page#Heading text]]`; an anchor
 * copied from the address bar arrives percent-encoded. Both are brought to
 * the id the page carries; an id written as such passes through unchanged.
 *
 * @param anchor - The anchor as written, without the `#`
 * @returns The id it names
 */
export function slugAnchor(anchor: string): string {
  let decoded = anchor;
  try {
    decoded = decodeURIComponent(anchor);
  } catch {
    // Not percent-encoded after all; a stray `%` is slugged away below.
  }
  return new GithubSlugger().slug(decoded);
}

/**
 * The text a heading renders with, before slugging.
 *
 * @param node - The heading
 * @returns Its visible text
 */
export function headingText(node: Heading): string {
  const clone: Root = { type: 'root', children: [structuredClone(node)] };

  // Inline HTML renders to markup, and an image to an element with no text;
  // neither contributes to the id, though both contribute to the source.
  visit(clone, ['html', 'image', 'imageReference'], (_node, index, parent) => {
    if (parent && index !== undefined) parent.children.splice(index, 1);
    return index;
  });

  visit(clone, 'text', (text: Text) => {
    text.value = text.value.replace(WIKILINK_PATTERN, (raw, embed: string, inner: string) => {
      const link = parseWikiLink(inner, raw, embed === '!');
      if (!link) return raw;
      if (link.label) return link.label;
      if (!link.target) return link.anchor ?? raw;

      return resolveTarget(link.target).doc?.title ?? link.target;
    });
  });

  return mdastToString(clone).trim();
}

/**
 * Ids of every heading in a document, in order.
 *
 * Every heading, wherever it sits: rehype-slug ids one inside a callout or a
 * list like any other, and counts it when numbering a repeat — so reading
 * only the top level reported `[[#inside-callout]]` as a link to nothing,
 * and gave the second `Setup` the wrong number. Only a top-level heading
 * carries an index, since only one can start a section include.
 *
 * @param nodes - The document's top-level nodes
 * @returns One entry per heading
 */
export function headingSlugs(nodes: RootContent[]): HeadingSlug[] {
  const slugger = new GithubSlugger();
  const slugs: HeadingSlug[] = [];
  const root: Root = { type: 'root', children: nodes };

  visit(root, 'heading', (node: Heading, index, parent) => {
    slugs.push({
      ...(parent === root && index !== undefined ? { index } : {}),
      depth: node.depth,
      slug: slugger.slug(headingText(node)),
    });
  });

  return slugs;
}
