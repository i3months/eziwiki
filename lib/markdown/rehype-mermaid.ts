import { visit } from 'unist-util-visit';
import { toString } from 'hast-util-to-string';
import type { Element, Root } from 'hast';
import { getStrings } from '../site';

/**
 * Renders ```mermaid fences to SVG during the build.
 *
 * The usual way to put a diagram on a page is to ship Mermaid to the browser
 * and let it draw one after load. That would be the largest thing this site
 * downloads by a wide margin, it would move the page as the diagram appeared,
 * and a crawler or a reader without JavaScript would see nothing. The diagram
 * is fixed at build time, so it is drawn once, here, and arrives as markup.
 *
 * A fence that cannot be drawn is left alone, and goes on to be highlighted as
 * an ordinary code block. Failing that way costs a reader nothing they had
 * before, while stopping the build over one diagram would.
 */

/** Class Markdown gives a fence tagged `mermaid`. */
const FENCE_CLASS = 'language-mermaid';

/**
 * The renderer, loaded on first use.
 *
 * `beautiful-mermaid` ships ESM only, with no CommonJS entry, so a static
 * import fails in the build scripts that reach this module through `tsx`.
 * Importing it dynamically works from either, and the promise is kept so the
 * cost is paid once rather than per document.
 */
let rendererPromise: Promise<(text: string) => string> | null = null;

/**
 * Returns the SVG renderer.
 */
function getRenderer(): Promise<(text: string) => string> {
  rendererPromise ??= import('beautiful-mermaid').then((module) => module.renderMermaidSVG);
  return rendererPromise;
}

/**
 * Pulls the web-font import out of the rendered SVG.
 *
 * The renderer inlines an `@import` for Google Fonts, which would be a
 * third-party request on every page carrying a diagram — from a site that
 * self-hosts and subsets its fonts precisely so there are none. The diagram
 * inherits the page's font once the rule is gone.
 */
function stripFontImport(svg: string): string {
  return svg.replace(/@import\s+url\([^)]*\);?/g, '');
}

/**
 * Removes the colours the renderer fixes on the root element.
 *
 * It writes `--bg` and `--fg` into an inline `style`, where a stylesheet cannot
 * reach them, which would leave every diagram in its light-theme colours after
 * a reader switched to dark. Dropping them lets the site's own CSS supply the
 * variables the SVG already refers to — the same arrangement the syntax
 * highlighter uses.
 */
function stripInlineColours(svg: string): string {
  return svg.replace(/(<svg[^>]*?)\sstyle="[^"]*"/, '$1');
}

/**
 * Reads the fence's language from its class list.
 */
function isMermaidFence(node: Element): boolean {
  const className = node.properties?.className;
  const classes = Array.isArray(className) ? className.map(String) : [];

  // Case-insensitively: this runs before the code shell lower-cases the
  // language, and ```Mermaid was otherwise highlighted rather than drawn.
  return classes.some((cls) => String(cls).toLowerCase() === FENCE_CLASS);
}

/**
 * Rehype plugin factory.
 *
 * Must run before the code-block chrome and the highlighter, so that a fence it
 * claims never becomes a code block, and one it declines still does.
 *
 * @example
 * ```typescript
 * unified().use(rehypeMermaid).use(rehypeCodeShell).use(rehypeShiki, options);
 * ```
 */
export function rehypeMermaid() {
  return async (tree: Root) => {
    // Collected first, then rendered: `visit` is synchronous, and the renderer
    // has to be awaited before any of it can be drawn.
    const fences: Array<{ parent: Root | Element; index: number; source: string }> = [];

    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index === undefined) return;

      const code = node.children.find(
        (child): child is Element => child.type === 'element' && child.tagName === 'code',
      );

      if (!code || !isMermaidFence(code)) return;

      fences.push({ parent: parent as Root | Element, index, source: toString(code) });
    });

    if (fences.length === 0) return;

    const render = await getRenderer();

    for (const fence of fences) {
      let svg: string;

      try {
        svg = render(fence.source);
      } catch {
        // Diagram kinds the renderer does not know, and syntax it cannot read,
        // both land here. The fence stays as it was written and goes on to be
        // highlighted as an ordinary code block.
        continue;
      }

      fence.parent.children[fence.index] = {
        type: 'element',
        tagName: 'figure',
        // Named, so assistive technology frames what follows as one drawing
        // rather than reading its labels as loose text.
        properties: { className: ['ezw-mermaid'], role: 'img', 'aria-label': getStrings().diagram },
        children: [
          // Serialised verbatim: `rehype-stringify` is configured to pass raw
          // through, and parsing the SVG back into a tree only to print it
          // again would buy nothing.
          { type: 'raw', value: stripInlineColours(stripFontImport(svg)) } as never,
        ],
      };
    }
  };
}
