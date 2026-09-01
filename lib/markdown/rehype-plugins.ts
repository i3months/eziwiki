import { visit } from 'unist-util-visit';
import { toString } from 'hast-util-to-string';
import type { Element, Root } from 'hast';
import { docPathToUrl, type UrlMap, encodeUrlPath } from '../navigation/url';
import { getStrings } from '../site';
import { format } from '../i18n/format';
import { parseCodeMeta } from './codeMeta';

/**
 * Custom rehype plugins used by the build-time Markdown pipeline.
 *
 * These run against the HTML AST, after Markdown has been converted but before
 * it is serialised, which is the only place where heading anchors, resolved
 * links, and code-block chrome can all be produced without shipping a Markdown
 * parser to the browser.
 */

/** A heading extracted from a document, used to render the table of contents. */
export interface Heading {
  /** Anchor id, matching the `id` attribute rehype-slug assigned */
  id: string;
  /** Rendered text of the heading */
  text: string;
  /** Heading level, 1 for h1 through 6 for h6 */
  depth: number;
}

/** Heading levels collected for the table of contents. */
const TOC_LEVELS = new Set(['h2', 'h3', 'h4']);

/**
 * Collects document headings onto `file.data.headings`.
 *
 * Results are attached to the virtual file rather than to a closure so that a
 * single compiled processor can be reused across every document in the build —
 * instantiating the syntax highlighter per page is the dominant cost otherwise.
 *
 * Must run after `rehype-slug`, which assigns the `id` attributes the table of
 * contents links to. Headings without an id are skipped rather than given a
 * generated one, since an anchor absent from the document is a dead link.
 *
 * @example
 * ```typescript
 * const file = await unified().use(rehypeSlug).use(rehypeCollectHeadings).process(md);
 * const headings = file.data.headings as Heading[];
 * ```
 */
export function rehypeCollectHeadings() {
  return (tree: Root, file: { data: Record<string, unknown> }) => {
    const collected: Heading[] = [];

    visit(tree, 'element', (node: Element) => {
      if (!TOC_LEVELS.has(node.tagName)) return;

      // A transcluded heading belongs to the document it came from. Listing it
      // would offer a reader sections that are not this page's own, and two
      // entries with the same name whenever a page includes part of another.
      if (node.properties?.dataTranscluded) return;

      const id = node.properties?.id;
      if (typeof id !== 'string' || !id) return;

      collected.push({
        id,
        text: toString(node),
        depth: Number(node.tagName.slice(1)),
      });
    });

    file.data.headings = collected;
  };
}

/** Heading levels that get a link to themselves. */
const ANCHORED_LEVELS = new Set(['h2', 'h3', 'h4', 'h5', 'h6']);

/**
 * Appends a link to each heading pointing at itself.
 *
 * A reader who wants to send someone to one section of a long page otherwise
 * has to read the id out of the address bar, or link the whole page and say
 * "scroll down". Every documentation site solves this the same way, and the
 * anchor is a real link — focusable, copyable, and working without script.
 *
 * `h1` is skipped: it names the page, which the page URL already addresses.
 * Transcluded headings are skipped too, since their `id` belongs to the
 * document they came from and linking here would send a reader to a copy.
 */
export function rehypeHeadingAnchors() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (!ANCHORED_LEVELS.has(node.tagName)) return;
      if (node.properties?.dataTranscluded) return;

      const id = node.properties?.id;
      if (typeof id !== 'string' || !id) return;

      node.properties.className = [
        ...(Array.isArray(node.properties.className) ? node.properties.className.map(String) : []),
        'ezw-heading',
      ];

      node.children.push({
        type: 'element',
        tagName: 'a',
        properties: {
          href: `#${id}`,
          className: ['ezw-heading__anchor'],
          // The heading's own text already names the destination; without this
          // a screen reader hears every heading followed by a stray "#".
          'aria-label': format(getStrings().linkToSection, { title: toString(node) }),
        },
        children: [{ type: 'text', value: '#' }],
      });
    });
  };
}

/**
 * Determines whether an href points outside the site.
 */
function isExternal(href: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//');
}

/**
 * Rewrites internal Markdown links to the site's configured URL form, and
 * hardens external links.
 *
 * Authors write links the way the content tree looks — `[Setup](guides/setup)`
 * — and this resolves them through the URL map, so the same Markdown works
 * under either URL strategy. Anchors, external URLs, and links to unknown
 * documents are left untouched.
 *
 * @param urlMap - Precomputed mapping from content paths to URL segments
 */
export function rehypeInternalLinks(source: UrlMap | (() => UrlMap)) {
  return (tree: Root) => {
    // Read per document rather than captured when the processor was built:
    // the processor outlives many edits in development, and a page added
    // after it was created stayed unresolved in ordinary links — though not
    // in wiki links, which look their targets up as they go — until restart.
    const urlMap = typeof source === 'function' ? source() : source;

    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'a') return;

      const href = node.properties?.href;
      if (typeof href !== 'string' || !href) return;

      if (isExternal(href)) {
        node.properties.target = '_blank';
        // `rel` is a space-separated list property in hast, so it is modelled
        // as an array rather than a single string.
        node.properties.rel = ['noopener', 'noreferrer'];
        return;
      }

      // In-page anchors already point at ids produced by rehype-slug.
      if (href.startsWith('#')) return;

      // Split off any anchor or query so the document part can be resolved.
      const match = /^([^#?]*)(.*)$/.exec(href);
      if (!match) return;

      const [, rawPath, suffix] = match;
      // `./page` is the same reference as `/page` or `page`; left as written
      // it was resolved by the browser against the current directory instead.
      const docPath = rawPath
        .replace(/^(\.\/)+/, '')
        .replace(/^\/+/, '')
        .replace(/\.md$/, '')
        .replace(/\/+$/, '');
      if (!docPath) return;

      const url = docPathToUrl(urlMap, docPath);
      if (url) {
        // Trailing slash to match `trailingSlash` in the Next config: that is
        // the form every page is exported under. Hosts that redirect the
        // slashless form cost a round trip per link; hosts that do not — a
        // plain object store, say — answer it with a 404.
        node.properties.href = `/${encodeUrlPath(url)}/${suffix}`;
      }
    });
  };
}

/**
 * Preserves a fence's information line across `rehypeRaw`.
 *
 * Markdown puts everything after the language into `code.meta`, and
 * `remark-rehype` carries it to the HTML tree as `node.data.meta` — a field
 * with no representation in HTML. `rehypeRaw` serialises the tree and parses
 * it back to interpret embedded HTML, and anything that is not an attribute
 * does not survive the round trip.
 *
 * Copying it into `metastring` makes it an attribute, which does. Both the
 * shell below and `@shikijs/rehype` read it from there. The highlighter
 * replaces the whole `<pre>` with its own output, so the attribute never
 * reaches the page.
 */
export function rehypeCodeMetastring() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'code') return;

      const meta = node.data?.meta;
      if (typeof meta !== 'string' || !meta) return;

      node.properties = { ...node.properties, metastring: meta };
    });
  };
}

/**
 * Wraps fenced code blocks in a container with a label and copy button.
 *
 * Runs *before* the syntax highlighter so that the language recorded in the
 * Markdown fence is still available; the highlighter then rewrites the inner
 * `<pre>` in place. The copy button carries no inline handler — a single
 * delegated listener on the client picks it up — which keeps the entire
 * highlighting stack out of the browser bundle.
 *
 * The fence's information line is read here too. A `title=` replaces the
 * language in the bar, because a reader who can see the file a snippet belongs
 * to rarely also needs to be told it is TypeScript; `showLineNumbers` sets a
 * class the stylesheet counts from, so numbering costs no markup at all.
 */
export function rehypeCodeShell() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index === undefined) return;

      // Skip blocks that have already been wrapped.
      if (
        parent.type === 'element' &&
        (parent as Element).properties?.['data-ezw-code'] !== undefined
      ) {
        return;
      }

      const code = node.children.find(
        (child): child is Element => child.type === 'element' && child.tagName === 'code',
      );

      const className = code?.properties?.className;
      const classes = Array.isArray(className) ? className.map(String) : [];
      const languageClass = classes.find((cls) => cls.startsWith('language-'));
      // Lower-cased here, before Shiki reads it: grammars are registered in
      // lower case, so ```TypeScript otherwise fell back to plain text.
      const language = languageClass
        ? languageClass.slice('language-'.length).toLowerCase()
        : 'text';

      if (code?.properties && languageClass && languageClass !== `language-${language}`) {
        code.properties.className = classes.map((cls) =>
          cls === languageClass ? `language-${language}` : cls,
        );
      }

      // `metastring` rather than `data.meta`: see rehypeCodeMetastring above.
      const metastring = code?.properties?.metastring;
      const meta = parseCodeMeta(typeof metastring === 'string' ? metastring : undefined);

      const wrapper: Element = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: meta.lineNumbers ? ['ezw-code', 'ezw-code--numbered'] : ['ezw-code'],
          'data-ezw-code': '',
          'data-language': language,
        },
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: { className: ['ezw-code__bar'] },
            children: [
              {
                type: 'element',
                tagName: 'span',
                properties: {
                  className: meta.title ? ['ezw-code__title'] : ['ezw-code__lang'],
                },
                children: [{ type: 'text', value: meta.title ?? language }],
              },
              {
                type: 'element',
                tagName: 'button',
                // No `aria-label`: it read "Copy code" while the button
                // visibly says "Copy", so the spoken name did not contain the
                // written one — which is exactly what a voice user speaks.
                properties: {
                  type: 'button',
                  className: ['ezw-code__copy'],
                  'data-ezw-copy': '',
                  // The label changes to confirm the copy, and a change on
                  // the focused control is not reliably read out otherwise.
                  'aria-live': 'polite',
                },
                children: [{ type: 'text', value: getStrings().copy }],
              },
            ],
          },
          node,
        ],
      };

      parent.children[index] = wrapper;
    });
  };
}

/**
 * Prefixes root-relative asset URLs with the deployment base path.
 *
 * Static exports served from a subdirectory — GitHub Pages project sites, for
 * one — need `/images/x.png` rewritten to `/eziwiki/images/x.png`. Next rewrites
 * these for JSX it controls, but not for HTML produced by this pipeline.
 *
 * @param basePath - Deployment base path, or '' when served from the root
 */
export function rehypeBasePath(basePath: string) {
  const prefix = (url: string): string => {
    if (!url.startsWith('/') || url.startsWith('//')) return url;
    if (url.startsWith(`${basePath}/`)) return url;
    return `${basePath}${url}`;
  };

  // A srcset is a comma-separated list of candidates, each a URL followed by
  // a descriptor.
  const prefixSrcset = (candidate: string): string =>
    candidate.replace(/^(\s*)(\S+)/, (_, space: string, url: string) => `${space}${prefix(url)}`);

  return (tree: Root) => {
    if (!basePath) return;

    visit(tree, 'element', (node: Element) => {
      const attrs = URL_ATTRIBUTES[node.tagName];
      if (!attrs || !node.properties) return;

      for (const attr of attrs) {
        const value = node.properties[attr];

        if (attr === 'srcSet') {
          if (typeof value === 'string') {
            node.properties.srcSet = value.split(',').map(prefixSrcset).join(',');
          }
          continue;
        }

        if (typeof value === 'string') node.properties[attr] = prefix(value);
      }
    });
  };
}

/**
 * Where an element names a URL, by tag.
 *
 * Only links and images were rewritten, which is what Markdown itself can
 * produce; but raw HTML is the one way to embed a video or a frame, and its
 * `src`, `poster` and `srcset` were left pointing at the domain root.
 */
const URL_ATTRIBUTES: Record<string, string[]> = {
  a: ['href'],
  img: ['src', 'srcSet'],
  source: ['src', 'srcSet'],
  video: ['src', 'poster'],
  audio: ['src'],
  track: ['src'],
  iframe: ['src'],
  embed: ['src'],
  object: ['data'],
};

/**
 * Adds loading hints and consistent styling hooks to content images.
 *
 * Every image was deferred, including the first one. On a page that opens with
 * a figure that image is what the browser measures as the largest contentful
 * paint, and `loading="lazy"` keeps it out of the preload scan — the request
 * only starts once layout has reached it, so the headline metric waits on a
 * round trip that need not have been late. The first image is therefore
 * fetched eagerly and marked high priority; the rest, which are further down,
 * keep deferring.
 */
export function rehypeImages() {
  return (tree: Root) => {
    let seen = 0;

    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'img') return;

      node.properties ??= {};
      const isFirst = seen++ === 0;

      if (isFirst) {
        node.properties.loading ??= 'eager';
        node.properties.fetchPriority ??= 'high';
      } else {
        node.properties.loading ??= 'lazy';
      }
      node.properties.decoding ??= 'async';

      const className = node.properties.className;
      const classes = Array.isArray(className) ? className.map(String) : [];
      node.properties.className = [...classes, 'ezw-img'];
    });
  };
}

/**
 * Wraps each table in a box that scrolls sideways.
 *
 * The table itself used to be made `display: block` on a phone so it could
 * scroll, which costs it its table semantics in Safari — VoiceOver read a
 * comparison table as a run of unrelated text. The scrolling belongs to a
 * wrapper, and the table stays a table.
 */
export function rehypeTables() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'table' || !parent || index === undefined) return;
      if (parent.type === 'element' && (parent as Element).properties?.className) {
        const classes = (parent as Element).properties.className;
        if (Array.isArray(classes) && classes.includes('ezw-table')) return;
      }

      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['ezw-table'] },
        children: [node],
      };
    });
  };
}
