import { NavigationItem } from '../payload/types';
import { getContentRegistry, titleize, type ContentDoc, type DirMeta } from '../content/registry';
import { extractAllPaths } from './builder';
import { cached, contentGeneration, stamp } from '../cache';

/**
 * Filesystem-derived navigation.
 *
 * The curated tree in `payload/config.ts` stays authoritative for naming and
 * ordering, but it no longer has to be exhaustive: any document under
 * `content/` that the curated tree does not mention is discovered here and
 * appended to the section matching its directory. Adding a Markdown file is
 * therefore enough to publish it.
 *
 * This module reads the content registry and must only run on the server.
 */

/** Sort weight applied to directories without an explicit `order`. */
const DEFAULT_DIR_ORDER = Number.MAX_SAFE_INTEGER;

/**
 * Returns the parent directory of a content directory path.
 *
 * @param dir - Directory path relative to `content/`
 * @returns The parent directory, or '' for a top-level directory
 */
function parentDir(dir: string): string {
  const index = dir.lastIndexOf('/');
  return index === -1 ? '' : dir.slice(0, index);
}

/**
 * Deep-clones a navigation tree so merging never mutates the payload config.
 *
 * The payload is a module-level constant shared across every rendered page;
 * appending discovered documents to it in place would compound the tree on
 * each render during a dev session.
 */
function cloneTree(items: NavigationItem[]): NavigationItem[] {
  return items.map((item) => ({
    ...item,
    children: item.children ? cloneTree(item.children) : undefined,
  }));
}

/**
 * Maps content directories to the curated section that already represents them.
 *
 * A curated section does not declare which directory it covers, so ownership is
 * inferred from its descendants: a section whose documents all live under
 * `getting-started/` is taken to own that directory. Sections spanning several
 * directories are left unmapped, since appending to them would be a guess.
 *
 * @param items - Curated navigation tree
 * @returns Directory path to the owning navigation node
 */
function indexSectionsByDir(items: NavigationItem[]): Map<string, NavigationItem> {
  const sections = new Map<string, NavigationItem>();

  function visit(node: NavigationItem): Set<string> {
    const dirs = new Set<string>();

    if (node.path) {
      const index = node.path.lastIndexOf('/');
      dirs.add(index === -1 ? '' : node.path.slice(0, index));
    }

    for (const child of node.children ?? []) {
      for (const dir of visit(child)) dirs.add(dir);
    }

    // Only claim ownership when the section is unambiguous.
    if (node.children && dirs.size === 1) {
      const [dir] = Array.from(dirs);
      if (dir && !sections.has(dir)) {
        sections.set(dir, node);
      }
    }

    return dirs;
  }

  for (const item of items) visit(item);
  return sections;
}

/**
 * The sort weight a document contributes to its position at the top level.
 *
 * For a document inside a folder this is the folder's `_meta.json` order, since
 * the document's own order only ranks it among its siblings. For a root-level
 * document there is no folder, so its own `order` serves — which is what lets a
 * single sequence of numbers interleave root pages and sections, rather than
 * root pages always landing after every folder.
 */
function sectionOrder(doc: ContentDoc, dirOrder: (dir: string) => number): number {
  return doc.dir === '' ? doc.order : dirOrder(doc.dir);
}

/**
 * Orders discovered documents so that appended entries land predictably.
 *
 * Documents are grouped by the section they belong to and those sections
 * ordered first, so that a section is created at the right position the moment
 * its first document is appended. Within a section, documents follow their own
 * frontmatter order.
 */
function compareOrphans(a: ContentDoc, b: ContentDoc, dirOrder: (dir: string) => number): number {
  const aSection = sectionOrder(a, dirOrder);
  const bSection = sectionOrder(b, dirOrder);
  if (aSection !== bSection) return aSection - bSection;

  if (a.dir !== b.dir) return a.dir.localeCompare(b.dir);
  if (a.order !== b.order) return a.order - b.order;
  return a.title.localeCompare(b.title);
}

/**
 * Builds a navigation node for a discovered document.
 */
function docToNavItem(doc: ContentDoc): NavigationItem {
  const item: NavigationItem = {
    name: doc.title,
    path: doc.path,
  };

  if (typeof doc.frontmatter.icon === 'string') item.icon = doc.frontmatter.icon;
  if (typeof doc.frontmatter.color === 'string') item.color = doc.frontmatter.color;

  return item;
}

/**
 * Builds a navigation section node for a content directory.
 */
function dirToNavItem(dir: string, meta: DirMeta): NavigationItem {
  const name = meta.name ?? titleize(dir.slice(dir.lastIndexOf('/') + 1));
  const item: NavigationItem = { name, children: [] };

  if (meta.icon) item.icon = meta.icon;
  if (meta.color) item.color = meta.color;
  if (meta.hidden) item.hidden = true;

  return item;
}

/**
 * Merges curated navigation with documents discovered under `content/`.
 *
 * Curated entries are preserved exactly as written. Every document not already
 * referenced — and not marked `hidden` in its frontmatter — is appended to the
 * section covering its directory, creating that section (and any missing
 * ancestors) when necessary.
 *
 * @param curated - Navigation from the payload config; may be empty
 * @returns The merged navigation tree
 *
 * @example
 * ```typescript
 * // content/guides/advanced.md exists but is absent from the payload
 * const nav = mergeDiscoveredDocs(payload.navigation ?? []);
 * // The 'Guides' section now includes an 'Advanced' entry.
 * ```
 */
export function mergeDiscoveredDocs(curated: NavigationItem[]): NavigationItem[] {
  const { docs, dirMeta } = getContentRegistry();
  const root = cloneTree(curated);

  const referenced = new Set(extractAllPaths(root));
  const orphans = docs.filter((doc) => !referenced.has(doc.path) && !doc.hidden);

  if (orphans.length === 0) return root;

  const sections = indexSectionsByDir(root);
  const dirOrder = (dir: string) => dirMeta.get(dir)?.order ?? DEFAULT_DIR_ORDER;

  /**
   * Returns the children array that documents in `dir` should be appended to,
   * creating the section chain if it does not exist yet.
   */
  function childrenFor(dir: string): NavigationItem[] {
    if (!dir) return root;

    const existing = sections.get(dir);
    if (existing) {
      existing.children ??= [];
      return existing.children;
    }

    const node = dirToNavItem(dir, dirMeta.get(dir) ?? {});
    childrenFor(parentDir(dir)).push(node);
    sections.set(dir, node);

    return node.children!;
  }

  for (const doc of [...orphans].sort((a, b) => compareOrphans(a, b, dirOrder))) {
    childrenFor(doc.dir).push(docToNavItem(doc));
  }

  return root;
}

/**
 * Flags curated entries whose document hides itself in frontmatter.
 *
 * Discovery already leaves such documents out, but a curated entry is kept
 * exactly as written — so a page marked `hidden: true` that the payload also
 * lists stayed in the sidebar and in the reading sequence, while search, the
 * sitemap and the graph all honoured the frontmatter. Marking the entry here
 * lets every consumer of the tree agree with them.
 */
function markHiddenDocs(items: NavigationItem[], hidden: Set<string>): void {
  for (const item of items) {
    // An entry that heads a section is left alone: `hidden` is inherited by
    // everything beneath it, and a page hiding itself says nothing about the
    // pages filed under it.
    if (item.path && !item.children?.length && hidden.has(item.path)) item.hidden = true;
    if (item.children) markHiddenDocs(item.children, hidden);
  }
}

let memo: NavigationItem[] | null = null;
const memoStamp = stamp();

/**
 * Returns the site navigation, memoised per process.
 *
 * When `autoNavigation` is disabled in the payload, the curated tree is
 * returned untouched; otherwise discovered documents are merged in.
 *
 * @param curated - Navigation from the payload config
 * @param autoNavigation - Whether to append discovered documents (default true)
 * @returns The navigation tree to render
 */
export function getNavigation(
  curated: NavigationItem[] | undefined,
  autoNavigation = true,
): NavigationItem[] {
  const hit = cached(memo, memoStamp);
  if (hit) return hit;

  const base = curated ?? [];
  const tree = autoNavigation ? mergeDiscoveredDocs(base) : cloneTree(base);

  // Both branches return a clone, so this never marks the payload itself.
  const hiddenDocs = new Set(
    getContentRegistry()
      .docs.filter((doc) => doc.hidden)
      .map((doc) => doc.path),
  );
  markHiddenDocs(tree, hiddenDocs);

  memo = tree;
  memoStamp.at = contentGeneration();

  return memo;
}
