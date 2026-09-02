/**
 * The small subset of glob syntax the payload needs.
 *
 * Written here rather than taken from a package because exactly one setting
 * uses it — which documents are scans — and the whole of what that setting
 * needs is three wildcards. A dependency for this would be larger than the
 * feature.
 */

/** Patterns compiled once and kept, since the same few are asked repeatedly. */
const compiled = new Map<string, RegExp>();

/**
 * Compiles one pattern to an anchored expression.
 *
 * Every token is replaced in a single pass. Doing it as successive
 * `replace` calls looks simpler and is wrong: the `[^/]*` that `*` expands to
 * contains a `*`, which the next pass would expand again.
 *
 * @param pattern - Glob, e.g. `scans/**` or `archive/*.pdf`
 * @returns An expression matching a whole path
 */
function toRegExp(pattern: string): RegExp {
  const hit = compiled.get(pattern);
  if (hit) return hit;

  const body = pattern.replace(/\*\*\/|\*\*|\*|\?|[.+^${}()|[\]\\]/g, (token) => {
    switch (token) {
      // `**/` spans whole directory names, and none at all: `**/*.pdf` has to
      // match a file at the root as well as one six levels down.
      case '**/':
        return '(?:[^/]+/)*';
      case '**':
        return '.*';
      case '*':
        return '[^/]*';
      case '?':
        return '[^/]';
      default:
        return `\\${token}`;
    }
  });

  // Case-insensitive: `Scans/` and `scans/` name the same directory on macOS
  // and Windows, and an author who wrote one and meant the other is not
  // helped by silence.
  // nosemgrep -- escaping the pattern into this literal is this module's job
  const expression = new RegExp(`^${body}$`, 'i');
  compiled.set(pattern, expression);

  return expression;
}

/**
 * Reports whether a path matches any of the patterns.
 *
 * @param filePath - Path relative to `public/`, with forward slashes
 * @param patterns - Globs; an empty or absent list matches nothing
 * @returns True when at least one pattern matches the whole path
 *
 * @example
 * ```typescript
 * matchesAny('scans/1985/report.pdf', ['scans/**']); // true
 * matchesAny('documents/sample.pdf', ['scans/**']); // false
 * matchesAny('a/b/plan.pdf', ['**\/*.pdf']); // true
 * ```
 */
export function matchesAny(filePath: string, patterns?: string[]): boolean {
  if (!patterns?.length) return false;

  const normalised = filePath.replace(/^\/+/, '');
  return patterns.some((pattern) => toRegExp(pattern.replace(/^\/+/, '')).test(normalised));
}
