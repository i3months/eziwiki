import { getLinkGraph, type GraphNode } from './build';
import { normalizeTarget } from '../content/resolver';
import { getContentRegistry } from '../content/registry';
import { getReadingOrder } from '../navigation/sequence';
import { cached, contentGeneration, stamp } from '../cache';

/**
 * What the link graph says about the state of the wiki.
 *
 * A broken link is an error and already reported. These are not errors — a
 * wiki can be perfectly correct and still have them — but they are the shapes
 * a collection of documents falls into when it stops being a wiki: pages
 * nothing leads to, and pages nothing leads on from. Neither is visible from
 * inside a single document, and neither shows up in a link check, which only
 * asks whether the links that exist resolve.
 *
 * Server-only.
 */

/** Pages the graph flags as worth a second look. */
export interface WikiHealth {
  /** Pages nothing links to, so a reader can only arrive through the sidebar */
  orphans: GraphNode[];
  /** Pages with no links out, where a reader arrives and has nowhere to go */
  deadEnds: GraphNode[];
}

/** A page the wiki refers to but does not have. */
export interface WantedPage {
  /** The target as written in the links asking for it */
  target: string;
  /** Content paths of the pages asking, in the order they were scanned */
  wantedBy: string[];
  /** Suggested content path for the page, derived from the target */
  suggestedPath: string;
  /** An existing page the target may have meant, when one is close enough */
  nearest?: string;
}

let memo: WikiHealth | null = null;
const memoStamp = stamp();
let wantedMemo: WantedPage[] | null = null;
const wantedStamp = stamp();

/**
 * Finds pages that are disconnected from the rest of the wiki.
 *
 * The first page in reading order is never an orphan. It is where a reader
 * starts, so nothing needs to point at it, and reporting it every build would
 * teach everyone to ignore the report.
 *
 * @returns The pages worth looking at
 *
 * @example
 * ```typescript
 * const { orphans, deadEnds } = getWikiHealth();
 * orphans.map((page) => page.path); // ['examples/api-docs', …]
 * ```
 */
export function getWikiHealth(): WikiHealth {
  const hit = cached(memo, memoStamp);
  if (hit) return hit;

  const graph = getLinkGraph();
  const [entry] = getReadingOrder();

  const orphans = graph.nodes.filter(
    (node) => node.path !== entry && (graph.backlinks.get(node.path) ?? []).length === 0,
  );

  const deadEnds = graph.nodes.filter((node) => (graph.outbound.get(node.path) ?? []).length === 0);

  memo = { orphans, deadEnds };
  memoStamp.at = contentGeneration();
  return memo;
}

/**
 * Turns a link target into a path a file could be created at.
 *
 * A target may be a path already (`guides/setup`), or a title someone wrote
 * expecting the wiki to know what they meant (`Quick Start`). The second has to
 * become a filename, and the conventions are the ones the rest of the wiki
 * already uses: lower case, hyphens for spaces.
 *
 * @param target - The unresolved target, as written
 * @returns A content-relative path without extension
 */
export function suggestPath(target: string): string {
  return target
    .split('/')
    .map((segment) =>
      segment
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, ''),
    )
    .filter(Boolean)
    .join('/');
}

/**
 * Lists the pages the wiki refers to but does not have.
 *
 * A broken link is usually reported as a fault in the page containing it. Seen
 * from the other end it is something else: a page several documents already
 * expect to exist is the clearest statement a wiki can make about what to write
 * next, and it costs nothing to collect because the links were written by
 * whoever needed the page.
 *
 * Targets are grouped the way the resolver compares them, so `[[Deploying]]`
 * and `[[deploying]]` are one page wanted twice rather than two pages wanted
 * once — writing the file answers both.
 *
 * Ambiguous targets are left out. They name pages that do exist — the wiki has
 * too many of them, not too few — and creating another would not help.
 *
 * @returns Wanted pages, most-wanted first
 *
 * @example
 * ```typescript
 * getWantedPages();
 * // [{ target: 'Deploying', wantedBy: ['intro', 'vercel'], suggestedPath: 'deploying' }]
 * ```
 */
/**
 * Edit distance between two strings, for telling a typo from a new page.
 */
function distance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) rows[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }

  return rows[a.length][b.length];
}

/**
 * The existing page a target most likely meant, when one is close.
 *
 * `[[quik-start]]` used to be answered with `npm run new quik-start` — an
 * invitation to create a second Quick Start. A target within two edits of a
 * page's name, title or path, or that one of them begins with, is offered
 * as the correction instead.
 *
 * @param target - The unresolved target, as written
 * @returns The content path of the nearest page, or undefined
 */
export function nearestPage(target: string): string | undefined {
  const wanted = normalizeTarget(target);
  if (wanted.length < 3) return undefined;

  let best: { path: string; score: number } | undefined;

  for (const doc of getContentRegistry().docs) {
    const keys = [doc.path, doc.segments[doc.segments.length - 1], doc.title].map(normalizeTarget);

    for (const key of keys) {
      const score = key.startsWith(wanted) || wanted.startsWith(key) ? 1 : distance(wanted, key);
      if (score > 2) continue;
      if (
        !best ||
        score < best.score ||
        (score === best.score && doc.path.length < best.path.length)
      ) {
        best = { path: doc.path, score };
      }
    }
  }

  return best?.path;
}

export function getWantedPages(): WantedPage[] {
  const hit = cached(wantedMemo, wantedStamp);
  if (hit) return hit;

  const wanted = new Map<string, WantedPage>();

  for (const link of getLinkGraph().broken) {
    if (link.reason !== 'missing') continue;

    const key = normalizeTarget(link.target);
    const existing = wanted.get(key);

    if (existing) {
      // One page may ask twice; that is one page wanting it, not two.
      if (!existing.wantedBy.includes(link.from)) existing.wantedBy.push(link.from);
      continue;
    }

    const nearest = nearestPage(link.target);

    wanted.set(key, {
      target: link.target,
      wantedBy: [link.from],
      suggestedPath: suggestPath(link.target),
      ...(nearest ? { nearest } : {}),
    });
  }

  wantedMemo = [...wanted.values()].sort(
    (a, b) => b.wantedBy.length - a.wantedBy.length || a.target.localeCompare(b.target),
  );
  wantedStamp.at = contentGeneration();

  return wantedMemo;
}
