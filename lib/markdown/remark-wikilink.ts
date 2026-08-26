import { visit } from 'unist-util-visit';
import type {
  Root,
  Text,
  PhrasingContent,
  Parent,
  Paragraph,
  RootContent,
  BlockContent,
} from 'mdast';
import { WIKILINK_PATTERN, parseWikiLink, type WikiLink } from './wikilink';
import { remarkCallouts } from './remark-callout';
import { slugAnchor } from './headings';
import { getStrings } from '../site';
import { format, formatBytes } from '../i18n/format';

/**
 * Turns `[[wiki links]]` into ordinary Markdown links.
 *
 * Runs on the Markdown AST, before conversion to HTML, so the resulting links
 * pass through the rest of the pipeline like any other. Only text nodes are
 * visited, which means links written inside code spans and fenced blocks are
 * left alone for free — documentation that explains the syntax has to be able
 * to show it.
 */

/** What a target resolved to. */
export interface WikiLinkTarget {
  /** Root-relative href for the document */
  url: string;
  /** Default display text when the author gave no label */
  title: string;
  /** One-line summary, carried on the link so a hover card needs no request */
  excerpt?: string;
}

/**
 * Resolves a wiki-link target to a destination, or null when there is none.
 */
export type WikiLinkResolver = (target: string) => WikiLinkTarget | null;

/** A static file an embed resolved to. */
export interface EmbedTarget {
  /** Root-relative URL of the file */
  url: string;
  /** How it should be shown */
  kind: 'image' | 'pdf';
  /** Size in bytes, shown in a viewer's header before the file loads */
  size?: number;
  /** Pages drawn at build time; absent when none were drawn */
  images?: {
    /** `poster` is the first page only; `raster` is all of them */
    mode: 'poster' | 'raster';
    /** Pages in the document */
    pages: number;
    /** The images, in page order */
    files: Array<{ url: string; width: number; height: number }>;
  };
}

/**
 * Resolves an embed target to a static file, or null when there is none.
 */
export type EmbedResolver = (target: string) => EmbedTarget | null;

/** A document whose content is to be shown inside another. */
export interface TranscludeTarget {
  /** Content path, used to detect a page including itself */
  path: string;
  /** Href of the source document */
  url: string;
  /** Title of the source document */
  title: string;
  /** The Markdown nodes to splice in */
  nodes: RootContent[];
}

/**
 * Resolves an embed target to a document's content, or null when the target is
 * not a document or the named section does not exist.
 */
export type TranscludeResolver = (target: string, anchor?: string) => TranscludeTarget | null;

/** How a wiki link should be turned into a node. */
export interface WikiLinkResolvers {
  /** Resolves a document target */
  link: WikiLinkResolver;
  /** Resolves an embeddable file; absent when embeds are not supported */
  embed?: EmbedResolver;
  /** Resolves a document to include inline; absent disables transclusion */
  transclude?: TranscludeResolver;
}

/**
 * How deeply a transclusion may nest.
 *
 * A page including a page that includes a page is already hard to read; past
 * that it is more likely a mistake than an intent, and each level multiplies
 * the work the build does.
 */
const MAX_TRANSCLUSION_DEPTH = 3;

/**
 * Builds the replacement node for one wiki link.
 *
 * An unresolved link renders as marked-up text rather than an anchor: a link
 * that goes nowhere is worse than visibly broken text, because it looks
 * clickable and silently is not.
 */
function toNode(link: WikiLink, resolvers: WikiLinkResolvers): PhrasingContent {
  const resolve = resolvers.link;

  // `![[file.png]]` shows the file rather than linking to it. Only static
  // assets are embedded for now; `![[some-note]]` falls through to a link, so
  // an author who writes it gets a working reference instead of nothing.
  if (link.embed && resolvers.embed) {
    const asset = resolvers.embed(link.target);

    if (asset?.kind === 'image') {
      return {
        type: 'image',
        url: asset.url,
        alt: link.label ?? link.target,
      };
    }

    // A document gets a viewer, which is a block and cannot sit inside a
    // sentence — `embedBlocks` below builds that from an embed standing alone
    // in its own paragraph. Written mid-prose it becomes a link to the file,
    // which is the most an inline position can carry.
    if (asset) {
      return {
        type: 'link',
        url: asset.url,
        data: { hProperties: { className: ['ezw-file-link'], download: true } },
        children: [{ type: 'text', value: link.label ?? link.target }],
      };
    }
  }

  // An anchor-only link points within the current page, so there is nothing to
  // resolve.
  if (!link.target && link.anchor) {
    return {
      type: 'link',
      url: `#${slugAnchor(link.anchor)}`,
      children: [{ type: 'text', value: link.label ?? link.anchor }],
    };
  }

  const resolved = resolve(link.target);

  if (!resolved) {
    return {
      // `emphasis` is a carrier for the rendered span: it is a known phrasing
      // type, so it degrades to <em> if the hName hint is ever ignored.
      type: 'emphasis',
      data: {
        hName: 'span',
        hProperties: {
          className: ['ezw-broken-link'],
          title: `Unresolved link: ${link.target}`,
        },
      },
      children: [{ type: 'text', value: link.label ?? link.target }],
    };
  }

  return {
    type: 'link',
    url: link.anchor ? `${resolved.url}#${slugAnchor(link.anchor)}` : resolved.url,
    data: {
      hProperties: {
        className: ['ezw-wikilink'],
        // The card's contents travel with the link rather than being fetched.
        // The build already knows them, and a reader who hovers should not wait
        // on a request to find out where a link goes.
        'data-preview-title': resolved.title,
        ...(resolved.excerpt ? { 'data-preview': resolved.excerpt } : {}),
      },
    },
    children: [{ type: 'text', value: link.label ?? resolved.title }],
  };
}

/**
 * Splits a text node into text and link nodes.
 *
 * @param node - The text node to split
 * @param resolvers - Target resolvers for links and embeds
 * @returns Replacement nodes, or null when the text contains no wiki links
 */
function splitText(node: Text, resolvers: WikiLinkResolvers): PhrasingContent[] | null {
  const { value } = node;
  if (!value.includes('[[')) return null;

  const replacement: PhrasingContent[] = [];
  let cursor = 0;
  let matched = false;

  // matchAll on a global pattern is safe here because the regex literal is
  // re-evaluated per call; lastIndex never leaks between documents.
  for (const match of value.matchAll(WIKILINK_PATTERN)) {
    const parsed = parseWikiLink(match[2], match[0], match[1] === '!');
    if (!parsed) continue;

    const start = match.index ?? 0;

    if (start > cursor) {
      replacement.push({ type: 'text', value: value.slice(cursor, start) });
    }

    replacement.push(toNode(parsed, resolvers));
    cursor = start + match[0].length;
    matched = true;
  }

  if (!matched) return null;

  if (cursor < value.length) {
    replacement.push({ type: 'text', value: value.slice(cursor) });
  }

  return replacement;
}

/**
 * Reads a paragraph that consists of nothing but one embed.
 *
 * Transclusion replaces a paragraph with whole blocks — headings, lists, code —
 * which cannot sit inside one. So it applies only when the embed is alone in
 * its paragraph, which is also how an author writes it. An embed with prose
 * beside it stays inline and becomes a link.
 *
 * @param node - Paragraph to inspect
 * @returns The embed, or null when the paragraph holds anything else
 */
function soleEmbed(node: Paragraph): WikiLink | null {
  if (node.children.length !== 1) return null;

  const [child] = node.children;
  if (child.type !== 'text') return null;

  const text = child.value.trim();
  const match = /^(!?)\[\[([^\]\n]+)\]\]$/.exec(text);
  if (!match || match[1] !== '!') return null;

  return parseWikiLink(match[2], match[0], true);
}

/**
 * Wraps included content so a reader can see where it came from.
 *
 * `blockquote` carries the block children — it is a known type that accepts
 * them — while `hName` renders it as a plain division.
 */
function wrapTranscluded(target: TranscludeTarget, nodes: RootContent[]): RootContent {
  return {
    type: 'blockquote',
    data: {
      hName: 'div',
      hProperties: { className: ['ezw-transclusion'] },
    },
    children: [
      ...(nodes as BlockContent[]),
      {
        type: 'paragraph',
        data: {
          hProperties: {
            className: ['ezw-transclusion__source'],
            // The stylesheet writes this before the link; a stylesheet cannot
            // be translated, so the word comes from here.
            'data-label': getStrings().includedFrom,
          },
        },
        children: [
          {
            type: 'link',
            url: target.url,
            children: [{ type: 'text', value: target.title }],
          },
        ],
      },
    ],
  };
}

/**
 * Marks headings that arrived by transclusion.
 *
 * The table of contents describes the page a reader is on. Headings pulled in
 * from elsewhere would list sections that belong to another document, so they
 * are flagged here and skipped when the contents are collected.
 */
function markTranscludedHeadings(tree: Root): void {
  visit(tree, 'heading', (heading) => {
    heading.data ??= {};
    const properties = (heading.data.hProperties ??= {}) as Record<string, unknown>;
    properties['data-transcluded'] = 'true';
  });
}

/**
 * Replaces sole-embed paragraphs with the content they name.
 *
 * @param tree - Tree to transform in place
 * @param resolvers - Target resolvers
 * @param stack - Paths already being included, innermost last
 */
function transclude(tree: Root, resolvers: WikiLinkResolvers, stack: string[]): void {
  const resolve = resolvers.transclude;
  if (!resolve) return;

  visit(tree, 'paragraph', (node: Paragraph, index, parent) => {
    if (!parent || index === undefined) return;

    const embed = soleEmbed(node);
    if (!embed || !embed.target) return;

    const target = resolve(embed.target, embed.anchor);
    if (!target) return;

    // A page including itself, directly or through a chain, would never finish.
    // Leaving the link is the honest outcome: the reference is real, it just
    // cannot be shown here.
    if (stack.includes(target.path) || stack.length >= MAX_TRANSCLUSION_DEPTH) return;

    const inner: Root = { type: 'root', children: target.nodes };
    transclude(inner, resolvers, [...stack, target.path]);
    // The included page was parsed by itself, and the callout pass over the
    // host page ran before this one — so without this its `> [!note]` blocks
    // arrived as plain quotes with the marker still in the text.
    remarkCallouts()(inner);
    markTranscludedHeadings(inner);

    parent.children.splice(index, 1, wrapTranscluded(target, inner.children));

    return index + 1;
  });
}

/**
 * Builds the block a document embed becomes.
 *
 * What ships is a `<figure>` holding the document's first page as an ordinary
 * image, and a plain link to the file. The viewer is mounted into it in the
 * browser only once the reader asks for it, so the markup the build emits is
 * both what they see first and what they are left with if script never runs:
 * a picture of the document and a link to it, rather than an empty box.
 *
 * The image and the link are also where the two URLs live, rather than
 * `data-` attributes, because `rehypeBasePath` prefixes `src` and `href` — a
 * deployment in a subdirectory gets the right addresses for free, in the one
 * place each address is written.
 *
 * `blockquote` is a carrier for the figure the way it is for a transclusion:
 * a block-level type that accepts block children, renamed on the way out.
 *
 * @param embed - The parsed embed
 * @param target - What it resolved to
 * @returns The replacement block, or null when the file is not one with a viewer
 */
function embedBlock(embed: WikiLink, target: EmbedTarget): RootContent | null {
  if (target.kind !== 'pdf') return null;

  const name = target.url.split('/').pop() || embed.target;
  const label = embed.label ?? name;

  if (target.images?.mode === 'raster') return rasterBlock(target, label);

  const poster = target.images?.files[0];
  const children: BlockContent[] = [];

  if (poster) {
    children.push(pageImage(poster, label, ['ezw-pdf__poster']));
  }

  return {
    type: 'blockquote',
    data: {
      hName: 'figure',
      hProperties: {
        className: ['ezw-pdf'],
        'data-ezw-pdf': '',
        'data-name': label,
        ...(target.size ? { 'data-size': String(target.size) } : {}),
        ...(target.images ? { 'data-pages': String(target.images.pages) } : {}),
      },
    },
    children: [
      ...children,
      {
        type: 'paragraph',
        data: {
          hName: 'a',
          hProperties: {
            className: ['ezw-pdf__fallback'],
            href: target.url,
            download: true,
          },
        },
        children: [{ type: 'text', value: label }],
      },
    ],
  };
}

/**
 * One drawn page as an image.
 *
 * The dimensions are written out so the box is the right shape before the
 * image arrives; a page that resized the article as it loaded would move
 * whatever the reader was already reading.
 *
 * `paragraph` is the carrier — a block-level type renamed on the way out, the
 * same trick the figure itself uses.
 */
function pageImage(
  page: { url: string; width: number; height: number },
  alt: string,
  className: string[],
): BlockContent {
  return {
    type: 'paragraph',
    data: {
      hName: 'img',
      hProperties: {
        className,
        src: page.url,
        width: page.width,
        height: page.height,
        alt,
      },
    },
    children: [],
  };
}

/**
 * A document shown as pictures of its pages.
 *
 * For scans, which the payload names. There is no `data-ezw-pdf` here, and
 * that absence is the feature: the viewer never finds this figure, so pdf.js
 * is not fetched by it under any circumstance and the whole thing works with
 * script switched off. What it costs is what a scan never had to give — its
 * pages carry no text to select, search, or read aloud.
 *
 * The header is therefore written here rather than rendered by a component,
 * which is also why it carries no icon: an icon would mean inlining an SVG
 * into every embed to save a component that is not running.
 *
 * @param target - What the embed resolved to, with every page drawn
 * @param label - What to call it: the author's label, or the file name
 * @returns The figure
 */
function rasterBlock(target: EmbedTarget, label: string): RootContent {
  const images = target.images!;
  const meta = [target.size ? formatBytes(target.size) : null, `${images.pages}p`]
    .filter(Boolean)
    .join(' · ');

  const bar: BlockContent = {
    type: 'blockquote',
    data: { hName: 'div', hProperties: { className: ['ezw-pdf__bar'] } },
    children: [
      {
        type: 'blockquote',
        data: { hName: 'div', hProperties: { className: ['ezw-pdf__file'] } },
        children: [
          {
            type: 'paragraph',
            data: { hName: 'span', hProperties: { className: ['ezw-pdf__name'], title: label } },
            children: [{ type: 'text', value: label }],
          },
          {
            type: 'paragraph',
            data: { hName: 'span', hProperties: { className: ['ezw-pdf__meta'] } },
            children: [{ type: 'text', value: meta }],
          },
        ],
      },
      {
        type: 'paragraph',
        data: {
          hName: 'a',
          hProperties: {
            className: ['ezw-pdf__download'],
            href: target.url,
            download: true,
          },
        },
        children: [{ type: 'text', value: getStrings().pdfDownload }],
      },
    ],
  };

  return {
    type: 'blockquote',
    data: {
      hName: 'figure',
      hProperties: {
        className: ['ezw-pdf', 'ezw-pdf--raster'],
        'data-name': label,
        'data-pages': String(images.pages),
      },
    },
    children: [
      bar,
      {
        type: 'blockquote',
        data: { hName: 'div', hProperties: { className: ['ezw-pdf__scroll'] } },
        children: images.files.map((page, index) =>
          pageImage(
            page,
            format(getStrings().pdfPageOf, { page: index + 1, pages: images.pages }),
            ['ezw-pdf__page-image'],
          ),
        ),
      },
    ],
  };
}

/**
 * Replaces sole-embed paragraphs with the viewer the file they name deserves.
 *
 * Runs after transclusion and before the inline pass, on the same paragraphs
 * transclusion looks at and for the same reason: what replaces the paragraph is
 * a block, and a block cannot be produced from inside one.
 *
 * @param tree - Tree to transform in place
 * @param resolvers - Target resolvers
 */
function embedBlocks(tree: Root, resolvers: WikiLinkResolvers): void {
  const resolve = resolvers.embed;
  if (!resolve) return;

  visit(tree, 'paragraph', (node: Paragraph, index, parent) => {
    if (!parent || index === undefined) return;

    const embed = soleEmbed(node);
    if (!embed?.target) return;

    const target = resolve(embed.target);
    if (!target) return;

    const block = embedBlock(embed, target);
    if (!block) return;

    parent.children.splice(index, 1, block);

    // Past the block just inserted: its own children hold nothing to visit.
    return index + 1;
  });
}

/**
 * Remark plugin factory.
 *
 * @param resolvers - Resolves a target to a document, and optionally to a file
 *
 * @example
 * ```typescript
 * unified().use(remarkParse).use(remarkWikiLinks, {
 *   link: (target) =>
 *     target === 'intro' ? { url: '/intro/', title: 'Introduction' } : null,
 *   embed: (target) => (target === 'logo.svg' ? { url: '/images/logo.svg' } : null),
 * });
 * ```
 */
export function remarkWikiLinks(resolvers: WikiLinkResolvers) {
  return (tree: Root, file: { data: Record<string, unknown> }) => {
    // Transclusion first: it works on whole paragraphs, and the inline pass
    // below would otherwise have already turned the embed into a link.
    const docPath = file?.data?.docPath;
    transclude(tree, resolvers, typeof docPath === 'string' ? [docPath] : []);

    // Then document embeds, for the same reason: a viewer is a block, and the
    // inline pass below would already have turned the embed into a link.
    embedBlocks(tree, resolvers);

    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined) return;

      const replacement = splitText(node, resolvers);
      if (!replacement) return;

      (parent as Parent).children.splice(index, 1, ...replacement);

      // Continue after the nodes just inserted, so their text is not rescanned.
      return index + replacement.length;
    });
  };
}
