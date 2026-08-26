import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import type { Root, Link, Text } from 'mdast';
import { getContentRegistry, type ContentDoc } from '../content/registry';
import { resolveTarget } from '../content/resolver';
import { findWikiLinks } from '../markdown/wikilink';
import { headingSlugs, slugAnchor } from '../markdown/headings';
import { resolveAsset } from '../content/assets';
import { getAliasMap } from '../content/aliases';
import { isReservedUrl } from '../navigation/routes';
import { getSite } from '../site';
import { cached, contentGeneration, stamp } from '../cache';

/**
 * The document link graph.
 *
 * Built by scanning every page for links that point at another page, whether
 * written as `[[wiki links]]` or as ordinary Markdown links. The result drives
 * the backlinks panel and the graph view, and surfaces dangling references that
 * would otherwise go unnoticed until a reader clicked one.
 *
 * Server-only.
 */

/** A link from one document to another. */
export interface GraphEdge {
  /** Path of the document containing the link */
  from: string;
  /** Path of the document being linked to */
  to: string;
}

/** A link that could not be resolved to any document. */
export interface BrokenLink {
  /** Path of the document containing the link */
  from: string;
  /** The target as written */
  target: string;
  /**
   * Why it failed: nothing matched, the shorthand matched several pages, or
   * the page exists and the heading named after `#` does not
   */
  reason: 'missing' | 'ambiguous' | 'anchor';
  /** Matching paths, when the target was ambiguous */
  candidates?: string[];
}

/** A node in the rendered graph. */
export interface GraphNode {
  /** Content path, used as the node id */
  path: string;
  /** Display title */
  title: string;
  /** Href for navigation */
  url: string;
  /** Number of links in and out, used to size the node */
  degree: number;
}

/** The full graph. */
export interface LinkGraph {
  /** Every visible document */
  nodes: GraphNode[];
  /** Every resolved link between documents */
  edges: GraphEdge[];
  /** Documents linking *to* a given path */
  backlinks: Map<string, string[]>;
  /** Documents linked *from* a given path */
  outbound: Map<string, string[]>;
  /** Links that resolved to nothing */
  broken: BrokenLink[];
}

/** Parser used for scanning; no rendering plugins, so it stays fast. */
const parser = unified().use(remarkParse).use(remarkGfm);

/** What an ordinary Markdown link refers to, as far as the graph is concerned. */
type MarkdownRef =
  /** External, an anchor, a file, a route of the app's own, or relative */
  | { kind: 'other' }
  /** A page reference in the form the renderer resolves */
  | { kind: 'page'; path: string; exists: boolean };

/**
 * Classifies an ordinary Markdown link.
 *
 * Only page references become edges. A reference to a page that does not
 * exist is reported rather than dropped: the renderer leaves such an href as
 * written, so it ships as a link that 404s, and until now it did so past
 * `check:links --strict` — only the wiki-link spelling of the same typo was
 * caught.
 *
 * @param url - The link's href as authored
 * @returns What it refers to
 */
function classifyMarkdownLink(url: string): MarkdownRef {
  if (!url || url.startsWith('#')) return { kind: 'other' };
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')) return { kind: 'other' };

  const path = url
    .split(/[#?]/)[0]
    .replace(/^(\.\/)+/, '')
    .replace(/^\/+/, '')
    .replace(/\.md$/i, '')
    .replace(/\/+$/, '');
  if (!path) return { kind: 'other' };

  const { byPath } = getContentRegistry();
  if (byPath.has(path) || getAliasMap().has(path)) return { kind: 'page', path, exists: true };

  // Not a page reference in the renderer's sense: a file keeps its extension,
  // `../` is left to the browser, and a reserved segment is the app's own view.
  if (path.startsWith('..') || /\.[a-z0-9]+$/i.test(path) || isReservedUrl(path)) {
    return { kind: 'other' };
  }

  return { kind: 'page', path, exists: false };
}

/** Heading ids per document, for the build in progress. */
const headingMemo = new Map<string, Set<string> | null>();

/**
 * Whether a document has a heading with the id an anchor names.
 *
 * A page that includes another, or writes a heading in HTML, carries ids
 * this cannot see from its source; it is answered for rather than reported,
 * since a link that works is worse to list than one that does not is to miss.
 *
 * @param doc - Document the link points into
 * @param anchor - The anchor as written, text or id
 * @returns true when the heading exists or cannot be ruled out
 */
function hasHeading(doc: ContentDoc, anchor: string): boolean {
  let ids = headingMemo.get(doc.path);

  if (ids === undefined) {
    ids = /!\[\[|<h[1-6][\s>]/i.test(doc.content)
      ? null
      : new Set(headingSlugs((parser.parse(doc.content) as Root).children).map((h) => h.slug));
    headingMemo.set(doc.path, ids);
  }

  return ids === null || ids.has(slugAnchor(anchor));
}

/**
 * Collects every outbound reference in one document.
 *
 * Text nodes are scanned for wiki links and link nodes for Markdown links,
 * which means references written inside code are excluded — documentation
 * showing the syntax should not register as a link.
 *
 * @param doc - Document to scan
 * @returns Resolved targets and any broken references
 */
function scanDoc(doc: ContentDoc): { targets: Set<string>; broken: BrokenLink[] } {
  const tree = parser.parse(doc.content) as Root;
  const targets = new Set<string>();
  const broken: BrokenLink[] = [];

  visit(tree, (node) => {
    if (node.type === 'link') {
      const ref = classifyMarkdownLink((node as Link).url);
      if (ref.kind !== 'page') return;

      if (!ref.exists) {
        broken.push({ from: doc.path, target: ref.path, reason: 'missing' });
      } else if (ref.path !== doc.path) {
        targets.add(ref.path);
      }
      return;
    }

    if (node.type !== 'text') return;

    for (const link of findWikiLinks((node as Text).value)) {
      // An anchor-only link stays within the page and is not an edge — but
      // it can still name a heading the page does not have.
      if (!link.target) {
        if (link.anchor && !hasHeading(doc, link.anchor)) {
          broken.push({ from: doc.path, target: `#${link.anchor}`, reason: 'anchor' });
        }
        continue;
      }

      // `![[diagram.png]]` embeds a file. It is neither an edge between pages
      // nor a broken reference, so it leaves the graph here. An embed that
      // names no such file falls through, matching the renderer, which treats
      // it as a link to a document.
      if (link.embed && resolveAsset(link.target)) continue;

      const resolution = resolveTarget(link.target);

      if (resolution.doc) {
        if (resolution.doc.path !== doc.path) targets.add(resolution.doc.path);

        // The page is there; the heading may not be. Such a link shipped as
        // a dead anchor and passed the strict check, since only the page was
        // ever looked for.
        if (link.anchor && !hasHeading(resolution.doc, link.anchor)) {
          broken.push({
            from: doc.path,
            target: `${link.target}#${link.anchor}`,
            reason: 'anchor',
          });
        }
        continue;
      }

      broken.push({
        from: doc.path,
        target: link.target,
        reason: resolution.kind === 'ambiguous' ? 'ambiguous' : 'missing',
        candidates: resolution.candidates,
      });
    }
  });

  return { targets, broken };
}

let memo: LinkGraph | null = null;
const memoStamp = stamp();

/**
 * Builds the link graph across all visible documents, memoised per process.
 *
 * Hidden pages are left out entirely: they do not appear as nodes, and links
 * to them do not become edges, so an unlisted page cannot be discovered by
 * reading the graph.
 *
 * @returns The graph
 */
export function getLinkGraph(): LinkGraph {
  const hit = cached(memo, memoStamp);
  if (hit) return hit;

  const { docs } = getContentRegistry();
  const { urlMap, hiddenPaths } = getSite();

  headingMemo.clear();

  const visible = docs.filter((doc) => !hiddenPaths.has(doc.path));
  const visiblePaths = new Set(visible.map((doc) => doc.path));

  const edges: GraphEdge[] = [];
  const broken: BrokenLink[] = [];
  const backlinks = new Map<string, string[]>();
  const outbound = new Map<string, string[]>();

  // Hidden pages are scanned for broken links too. They render like any
  // other page, so a dangling link on one is just as dead for the reader who
  // reaches it — it only stays out of the nodes and edges below.
  for (const doc of docs) {
    if (!visiblePaths.has(doc.path)) broken.push(...scanDoc(doc).broken);
  }

  for (const doc of visible) {
    const scan = scanDoc(doc);
    broken.push(...scan.broken);

    const targets = [...scan.targets].filter((target) => visiblePaths.has(target)).sort();
    outbound.set(doc.path, targets);

    for (const target of targets) {
      edges.push({ from: doc.path, to: target });

      const existing = backlinks.get(target);
      if (existing) existing.push(doc.path);
      else backlinks.set(target, [doc.path]);
    }
  }

  for (const list of backlinks.values()) list.sort();

  const degree = new Map<string, number>();
  for (const edge of edges) {
    degree.set(edge.from, (degree.get(edge.from) ?? 0) + 1);
    degree.set(edge.to, (degree.get(edge.to) ?? 0) + 1);
  }

  const nodes: GraphNode[] = visible.map((doc) => ({
    path: doc.path,
    title: doc.title,
    url: `/${urlMap.toUrl[doc.path] ?? doc.path}`,
    degree: degree.get(doc.path) ?? 0,
  }));

  memo = { nodes, edges, backlinks, outbound, broken };

  memoStamp.at = contentGeneration();
  return memo;
}

/** A page and everything one link away from it. */
export interface LocalGraph {
  /** The page itself, plus its immediate neighbours */
  nodes: GraphNode[];
  /** Links among those nodes, including ones not touching the page */
  edges: GraphEdge[];
}

/**
 * Returns the neighbourhood around a page.
 *
 * The whole-site graph answers "how is this wiki shaped"; past a few dozen
 * pages it stops answering "what is near this one", which is the question a
 * reader has while reading. This is that view: the page, everything it links
 * to, everything linking to it, and the links among them — the last so the
 * neighbours read as a cluster rather than a fan of unconnected dots.
 *
 * Direction is deliberately not distinguished. A reader looking for related
 * pages cares that two are connected, not which one did the linking; the
 * backlinks list already says that for the pages that point here.
 *
 * @param path - Content path of the page at the centre
 * @returns The neighbourhood, or empty when the page has no links either way
 *
 * @example
 * ```typescript
 * const { nodes, edges } = getLocalGraph('features/wiki-links');
 * nodes.length; // the page plus its neighbours
 * ```
 */
export function getLocalGraph(path: string): LocalGraph {
  const graph = getLinkGraph();

  const neighbours = new Set<string>([
    ...(graph.outbound.get(path) ?? []),
    ...(graph.backlinks.get(path) ?? []),
  ]);

  if (neighbours.size === 0) return { nodes: [], edges: [] };

  const included = new Set<string>([path, ...neighbours]);

  return {
    nodes: graph.nodes.filter((node) => included.has(node.path)),
    edges: graph.edges.filter((edge) => included.has(edge.from) && included.has(edge.to)),
  };
}

/**
 * Returns the documents that link to a given page.
 *
 * @param path - Content path of the page
 * @returns Nodes linking to it, sorted by title
 */
export function getBacklinks(path: string): GraphNode[] {
  const graph = getLinkGraph();
  const byPath = new Map(graph.nodes.map((node) => [node.path, node]));

  return (graph.backlinks.get(path) ?? [])
    .map((from) => byPath.get(from))
    .filter((node): node is GraphNode => node !== undefined)
    .sort((a, b) => a.title.localeCompare(b.title));
}
