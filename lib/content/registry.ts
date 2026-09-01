import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { CONTENT_DIR, cached, contentGeneration, stamp } from '../cache';
import { isSafeCssColor } from '../color';

/**
 * A single Markdown document discovered under the content directory.
 *
 * Every downstream feature — navigation, URL resolution, search indexing,
 * backlinks — is derived from this shape rather than from hand-written
 * configuration, so adding a file to `content/` is enough to publish a page.
 */
export interface ContentDoc {
  /** Content-relative path without extension (e.g. 'guides/quick-start') */
  path: string;
  /** Path split on '/', useful for grouping by directory */
  segments: string[];
  /** Directory portion of the path, '' for root-level documents */
  dir: string;
  /** Display title, from frontmatter or derived from the filename */
  title: string;
  /** Short summary from frontmatter, if provided */
  description?: string;
  /** Sort weight within its directory; unset values sort last */
  order: number;
  /** Excluded from navigation, but still reachable by direct URL */
  hidden: boolean;
  /**
   * Labels grouping this document with others across the folder tree.
   *
   * A file sits in exactly one directory, so the sidebar can only express one
   * way of organising a wiki. Tags are the second axis: a page belongs to one
   * section and to as many subjects as it touches.
   */
  tags: string[];
  /**
   * Paths this document used to live at.
   *
   * A wiki moves pages; without these, every published link to the old
   * location breaks silently the moment a file is renamed.
   */
  aliases: string[];
  /** Full parsed frontmatter, for consumers that need custom fields */
  frontmatter: Record<string, unknown>;
  /** Markdown body with frontmatter stripped */
  content: string;
  /** Absolute path on disk */
  filePath: string;
}

/**
 * Optional per-directory metadata, read from `_meta.json` inside a
 * content subdirectory. Lets a folder control how its section is presented
 * without pushing that concern into the global config.
 */
export interface DirMeta {
  /** Section label shown in navigation */
  name?: string;
  /** Sort weight among sibling sections */
  order?: number;
  /** Background colour applied to the section header */
  color?: string;
  /** Icon identifier for the section */
  icon?: string;
  /** Hide the whole section from navigation */
  hidden?: boolean;
}

/** Directory holding all Markdown content. Re-exported from the cache module,
 * which owns the definition so its change signature can never watch a
 * different tree than the one read here. */
export { CONTENT_DIR };

/** Sort weight applied to documents that do not declare `order`. */
const DEFAULT_ORDER = Number.MAX_SAFE_INTEGER;

/**
 * Converts a file or directory name into a human-readable title.
 *
 * Used as the fallback when a document has no `title` in its frontmatter
 * and when a directory has no `_meta.json`.
 *
 * @param name - Raw file or directory name (without extension)
 * @returns Title-cased label with separators replaced by spaces
 *
 * @example
 * ```typescript
 * titleize('quick-start'); // 'Quick Start'
 * titleize('api_reference'); // 'Api Reference'
 * ```
 */
export function titleize(name: string): string {
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Reads a numeric frontmatter field, tolerating string values.
 *
 * @param value - Raw frontmatter value
 * @returns The parsed number, or DEFAULT_ORDER when absent or unparseable
 */
function readOrder(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return DEFAULT_ORDER;
}

/**
 * Reads a boolean frontmatter field, tolerating string values.
 *
 * @param value - Raw frontmatter value
 * @returns True when the value represents an affirmative
 */
function readBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  // YAML 1.1 read `yes` and `on` as true; the parser here does not, and an
  // author who wrote `hidden: yes` got a visible page.
  if (typeof value === 'string') return ['true', 'yes', 'on'].includes(value.trim().toLowerCase());
  return false;
}

/**
 * Reads the `tags` frontmatter.
 *
 * Accepts a single tag or a list, and a comma-separated string, because all
 * three are how people write this and none of them is wrong. Tags are compared
 * case-insensitively — `Setup` and `setup` are one subject, and treating them
 * as two would split a wiki quietly — but the first spelling seen is the one
 * displayed.
 *
 * @param value - The raw frontmatter value
 * @returns Tags in the order written, without duplicates
 */
function readTags(value: unknown): string[] {
  const raw = typeof value === 'string' ? value.split(',') : Array.isArray(value) ? value : [];

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const entry of raw) {
    if (typeof entry !== 'string') continue;

    const tag = entry.trim();
    if (!tag) continue;

    const key = tag.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    tags.push(tag);
  }

  return tags;
}

/**
 * Reads the `aliases` frontmatter into a list of content paths.
 *
 * Accepts a single string or a list, since an author moving one page writes
 * one path and should not have to remember which form is required. Leading and
 * trailing slashes and a `.md` suffix are tolerated: the value looks like a
 * path, and being strict about its punctuation would only produce silent
 * misses.
 *
 * @param value - The raw frontmatter value
 * @returns Normalised content paths, without duplicates
 */
function readAliases(value: unknown): string[] {
  const raw = typeof value === 'string' ? [value] : Array.isArray(value) ? value : [];

  const paths = raw
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim().replace(/^\/+/, '').replace(/\.md$/i, '').replace(/\/+$/, ''))
    .filter(Boolean);

  return [...new Set(paths)];
}

/**
 * Reads the optional `_meta.json` for a content subdirectory.
 *
 * A malformed or unreadable file is treated as absent rather than fatal, so a
 * typo in an optional presentation file never breaks the build.
 *
 * @param dirPath - Absolute path to the directory
 * @returns Parsed directory metadata, or an empty object
 */
function readDirMeta(dirPath: string): DirMeta {
  const metaPath = path.join(dirPath, '_meta.json');

  try {
    const raw = fs.readFileSync(metaPath, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const meta = parsed as DirMeta;
      // The colour lands in a style attribute, where anything past a
      // semicolon is a declaration of the author's choosing; only a colour
      // gets through.
      if (typeof meta.color === 'string' && !isSafeCssColor(meta.color)) delete meta.color;
      // `"hidden": "false"` is a string, and a string is truthy: read as a
      // boolean here so no reader downstream has to remember that.
      if (meta.hidden !== undefined) meta.hidden = readBoolean(meta.hidden);
      return meta;
    }
    return {};
  } catch (error) {
    // A malformed file is treated as absent rather than fatal, but silently
    // absent meant a section losing its name, order and colour with nothing
    // said. Not for a file that does not exist, which is the usual case.
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️  ${path.relative(process.cwd(), metaPath)} could not be read: ${reason}`);
    }
    return {};
  }
}

/**
 * Recursively collects every Markdown file beneath a directory.
 *
 * Files and directories whose names begin with `_` or `.` are skipped, which
 * keeps `_meta.json`, drafts, and editor cruft out of the published site.
 *
 * @param dir - Absolute directory to walk
 * @param baseDir - Absolute root of the content tree, used to derive relative paths
 * @returns Absolute paths of every discovered `.md` file
 */
function walkMarkdown(dir: string, baseDir: string): string[] {
  let entries: fs.Dirent[];

  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkMarkdown(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Parses a single Markdown file into a ContentDoc.
 *
 * @param filePath - Absolute path to the Markdown file
 * @returns The parsed document, or null if the file could not be read
 */
function readDoc(filePath: string): ContentDoc | null {
  let raw: string;

  try {
    raw = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }

  // Composed form throughout. A macOS volume hands back decomposed names —
  // 한글 as its jamo — while a keyboard, git, and a Linux checkout all produce
  // the composed form; without this a link typed to such a page resolved on
  // CI and not locally, and the page's URL differed between the two.
  const relative = path.relative(CONTENT_DIR, filePath).replace(/\\/g, '/').normalize('NFC');

  let parsed: ReturnType<typeof matter>;
  try {
    // With an options object, so gray-matter does not cache: it stores the
    // file before parsing, and after one failure the same input came back
    // parsed as empty frontmatter — one error, then a page with `---` in
    // its body and no sign anything was wrong.
    parsed = matter(raw, {});
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`content/${relative}: the frontmatter could not be read.\n${reason}`);
  }

  const { data, content } = parsed;
  const frontmatter = data as Record<string, unknown>;

  const docPath = relative.replace(/\.md$/, '');
  const segments = docPath.split('/');
  const fileName = segments[segments.length - 1];

  return {
    path: docPath,
    segments,
    dir: segments.slice(0, -1).join('/'),
    title: typeof frontmatter.title === 'string' ? frontmatter.title : titleize(fileName),
    description: typeof frontmatter.description === 'string' ? frontmatter.description : undefined,
    order: readOrder(frontmatter.order),
    hidden: readBoolean(frontmatter.hidden) || frontmatter.nav === false,
    tags: readTags(frontmatter.tags),
    aliases: readAliases(frontmatter.aliases),
    frontmatter,
    content,
    filePath,
  };
}

/**
 * Orders documents by explicit weight first, then alphabetically by title.
 *
 * Documents without an `order` fall back to title ordering, so a partially
 * annotated directory still produces a stable, sensible sequence.
 */
function compareDocs(a: ContentDoc, b: ContentDoc): number {
  if (a.order !== b.order) return a.order - b.order;
  return a.title.localeCompare(b.title);
}

/**
 * The full content registry: every document plus the directory metadata
 * needed to render sections around them.
 */
export interface ContentRegistry {
  /** All discovered documents, sorted by order then title */
  docs: ContentDoc[];
  /** Documents keyed by their content-relative path */
  byPath: Map<string, ContentDoc>;
  /** Directory metadata keyed by directory path relative to `content/` */
  dirMeta: Map<string, DirMeta>;
}

let memo: ContentRegistry | null = null;
const memoStamp = stamp();

/**
 * Scans the content directory and builds the document registry.
 *
 * The result is memoised for the lifetime of the process. A build renders many
 * pages from the same content tree, and rescanning the filesystem for each one
 * is pure waste; call {@link clearRegistryCache} if the tree changes in-process.
 *
 * @returns The populated registry
 *
 * @example
 * ```typescript
 * const { docs, byPath } = getContentRegistry();
 *
 * console.log(docs.length); // 21
 * console.log(byPath.get('getting-started/quick-start')?.title); // 'Quick Start'
 * ```
 */
export function getContentRegistry(): ContentRegistry {
  const hit = cached(memo, memoStamp);
  if (hit) return hit;

  const files = walkMarkdown(CONTENT_DIR, CONTENT_DIR);
  const docs = files
    .map(readDoc)
    .filter((doc): doc is ContentDoc => doc !== null)
    .sort(compareDocs);

  const byPath = new Map(docs.map((doc) => [doc.path, doc]));

  // Collect metadata for every directory that actually contains documents.
  const dirMeta = new Map<string, DirMeta>();
  const dirs = new Set<string>();

  for (const doc of docs) {
    // Register the document's directory and each of its ancestors, so that a
    // nested section such as 'api/v2' contributes both 'api' and 'api/v2'.
    for (let i = 1; i < doc.segments.length; i++) {
      dirs.add(doc.segments.slice(0, i).join('/'));
    }
  }

  for (const dir of dirs) {
    dirMeta.set(dir, readDirMeta(path.join(CONTENT_DIR, dir)));
  }

  memo = { docs, byPath, dirMeta };

  memoStamp.at = contentGeneration();
  return memo;
}

/**
 * Discards the memoised registry so the next call rescans the filesystem.
 *
 * Primarily useful in tests, and for tooling that mutates content between reads.
 */
export function clearRegistryCache(): void {
  memo = null;
}

/**
 * Looks up a single document by its content-relative path.
 *
 * @param docPath - Path without extension (e.g. 'guides/quick-start')
 * @returns The document, or undefined if no such file exists
 */
export function getDoc(docPath: string): ContentDoc | undefined {
  return getContentRegistry().byPath.get(docPath);
}

/**
 * Returns every document path in the content tree.
 *
 * Unlike navigation-derived path lists, this includes documents that are
 * hidden or absent from the sidebar — they still need to be built.
 *
 * @returns Content-relative paths, sorted
 */
export function getAllDocPaths(): string[] {
  return getContentRegistry().docs.map((doc) => doc.path);
}
