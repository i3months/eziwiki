import { getContentRegistry } from '../content/registry';
import { getDocHeadings } from '../markdown/render';
import { docPathToUrl } from '../navigation/url';
import { getSite } from '../site';
import { SEARCH_INDEX_VERSION, type SearchDoc, type SearchIndex } from './types';

/**
 * Builds the search index from the content registry.
 *
 * Documents are split into one entry per section so a hit can link directly to
 * the relevant heading rather than dropping the reader at the top of a long
 * page. Server-only; the output is written to `public/` before the build.
 */

/** Heading depths that start a new indexed section. */
const SECTION_DEPTHS = new Set([2, 3, 4]);

/** Characters of body text kept per entry, to bound the index size. */
const MAX_BODY_CHARS = 1200;

/** The named entities a heading is likely to carry. */
const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/**
 * Converts Markdown to plain text suitable for indexing and previews.
 *
 * Code content is deliberately kept — searching for an API name or a flag is
 * one of the main things people do in developer documentation — but the fence
 * markers, link targets, and emphasis characters are stripped so they cannot
 * pollute matches.
 *
 * @param markdown - Markdown source for a document or section
 * @returns Collapsed plain text
 *
 * @example
 * ```typescript
 * markdownToText('See [the guide](/guides/x) for `--flag`.');
 * // 'See the guide for --flag.'
 * ```
 */
export function markdownToText(markdown: string): string {
  return (
    markdown
      // Fenced code: drop the fence lines, keep the code itself.
      .replace(/^ {0,3}(`{3,}|~{3,}).*$/gm, '')
      // HTML tags and comments.
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      // Images before links, so alt text survives and the src does not.
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Reference-style links and bare autolinks.
      .replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1')
      .replace(/<(https?:\/\/[^>]+)>/g, '$1')
      // Heading markers. Depths 2-4 start their own section, but an h1 or an h5
      // stays inline and would otherwise leave a stray '#' in the indexed text.
      .replace(/^ {0,3}#{1,6} +/gm, '')
      // Emphasis, inline code, blockquote and list markers, table pipes.
      .replace(/[*_~`]+/g, '')
      .replace(/^ {0,3}>+ ?/gm, '')
      .replace(/^ {0,3}([-*+]|\d+\.) +/gm, '')
      .replace(/^ {0,3}\|/gm, ' ')
      .replace(/\|/g, ' ')
      // Horizontal rules and table delimiter rows.
      .replace(/^ {0,3}([-*_])(\s*\1){2,}\s*$/gm, ' ')
      .replace(/^[\s:|-]+$/gm, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/** A slice of a document between two headings. */
interface Section {
  /** Heading text, absent for the text preceding the first heading */
  heading?: string;
  /** Raw Markdown of the section body */
  markdown: string;
}

/**
 * Splits Markdown into sections at ATX headings of indexable depth.
 *
 * Fence state is tracked so that a `#` comment inside a code block is not
 * mistaken for a heading — which would otherwise split a document at arbitrary
 * points and misalign sections from their anchors.
 *
 * @param markdown - Markdown source with frontmatter removed
 * @returns Sections in document order, the first being any preamble
 */
export function splitSections(markdown: string): Section[] {
  const sections: Section[] = [{ markdown: '' }];
  let fence: string | null = null;

  for (const line of markdown.split('\n')) {
    const fenceMatch = /^ {0,3}(`{3,}|~{3,})/.exec(line);

    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (fence === null) {
        fence = marker;
      } else if (fence === marker) {
        fence = null;
      }
    }

    // A closing sequence of hashes is optional and must follow a space, so
    // the `#` in `## C#` is part of the heading — as CommonMark reads it and
    // as the rendered heading spells it, which the anchor match depends on.
    const headingMatch = fence === null ? /^ {0,3}(#{1,6}) +(.*?)(?:\s+#+)?\s*$/.exec(line) : null;

    if (headingMatch && SECTION_DEPTHS.has(headingMatch[1].length)) {
      sections.push({ heading: headingMatch[2].trim(), markdown: '' });
      continue;
    }

    sections[sections.length - 1].markdown += `${line}\n`;
  }

  return sections;
}

/**
 * Pairs each section with the anchor id of its heading.
 *
 * Sections come from the Markdown source and anchors from the rendered HTML, so
 * the two are ordered alike but not guaranteed to correspond one-to-one — a
 * heading written as raw HTML, for instance, appears in the render but not in
 * the source scan. Matching on heading text and only advancing on a hit keeps
 * one such discrepancy from shifting every subsequent anchor, which would
 * silently point search results at the wrong sections.
 *
 * @param sections - Sections after the preamble, in document order
 * @param anchors - Rendered headings, in document order
 * @returns Anchor id per section, or undefined where none could be matched
 */
function matchAnchors(
  sections: Section[],
  anchors: Array<{ id: string; text: string }>,
): Array<string | undefined> {
  // The source spells a heading with escapes and entities that the render has
  // resolved — `Tom &amp; Jerry`, `A \* B` — so both sides are brought to the
  // rendered form before comparing, or such a section silently loses its
  // anchor and drops the reader at the top of the page.
  const normalize = (value: string) =>
    markdownToText(value.replace(/\\([!-/:-@[-`{-~])/g, '$1'))
      .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
      .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, name: string) => ENTITIES[name])
      .toLowerCase();
  let cursor = 0;

  return sections.map((section) => {
    const target = normalize(section.heading ?? '');

    for (let i = cursor; i < anchors.length; i++) {
      if (normalize(anchors[i].text) === target) {
        cursor = i + 1;
        return anchors[i].id;
      }
    }

    return undefined;
  });
}

/**
 * Builds the search index for every published document.
 *
 * Hidden documents are excluded: they are unlisted by intent, and surfacing
 * them in search would defeat that.
 *
 * @returns The index, ready to serialise
 */
export async function buildSearchIndex(): Promise<SearchIndex> {
  const { docs } = getContentRegistry();
  const { urlMap, hiddenPaths } = getSite();
  const entries: SearchDoc[] = [];

  for (const doc of docs) {
    if (hiddenPaths.has(doc.path)) continue;

    const url = docPathToUrl(urlMap, doc.path);
    if (!url) continue;

    const href = `/${url}`;

    // Anchors come from the same plugins the page runs, so they are exactly
    // the ids rehype-slug produced and the links will resolve. Only the
    // headings are needed, and stopping there skips highlighting code and
    // drawing diagrams the index will never look at.
    const [preamble, ...sections] = splitSections(doc.content);
    const anchors = matchAnchors(sections, await getDocHeadings(doc.path));

    entries.push({
      id: doc.path,
      url: href,
      title: doc.title,
      description: doc.description,
      // The title heading is already the `title` field; left in the body it
      // was indexed twice and opened every excerpt.
      body: markdownToText(preamble.markdown.replace(/^ {0,3}# [^\n]*\n?/m, '')).slice(
        0,
        MAX_BODY_CHARS,
      ),
      slug: doc.segments[doc.segments.length - 1].replace(/[-_]/g, ''),
      ...(doc.tags.length ? { tags: doc.tags.join(' ') } : {}),
    });

    sections.forEach((section, index) => {
      const anchor = anchors[index];

      const body = markdownToText(section.markdown).slice(0, MAX_BODY_CHARS);

      entries.push({
        id: anchor ? `${doc.path}#${anchor}` : `${doc.path}#${index}`,
        url: anchor ? `${href}#${anchor}` : href,
        title: doc.title,
        section: section.heading,
        body,
        // Only where the excerpt will need it — a heading with nothing but
        // subsections beneath it. Repeated on every section it was a third
        // of a megabyte at a thousand pages.
        ...(body ? {} : { description: doc.description }),
      });
    });
  }

  return { version: SEARCH_INDEX_VERSION, docs: entries };
}
