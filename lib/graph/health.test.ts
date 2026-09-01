import { describe, it, expect } from 'vitest';
import { suggestPath, getWantedPages, getWikiHealth, nearestPage } from './health';
import { getLinkGraph } from './build';
import { normalizeTarget } from '../content/resolver';

describe('suggestPath', () => {
  it('leaves a path that is already one alone', () => {
    expect(suggestPath('guides/setup')).toBe('guides/setup');
  });

  it('turns a title into a filename', () => {
    expect(suggestPath('Quick Start')).toBe('quick-start');
  });

  it('keeps the directories a target names', () => {
    expect(suggestPath('Getting Started/First Wiki')).toBe('getting-started/first-wiki');
  });

  it('collapses punctuation rather than carrying it into a filename', () => {
    expect(suggestPath('What’s new?')).toBe('what-s-new');
    expect(suggestPath('  spaced  out  ')).toBe('spaced-out');
  });

  it('keeps letters that are not Latin', () => {
    // A Korean or Japanese wiki names its files in its own language; stripping
    // to ASCII would leave every one of them called nothing at all.
    expect(suggestPath('빠른 시작')).toBe('빠른-시작');
  });

  it('gives nothing back when nothing can be a filename', () => {
    expect(suggestPath('!!!')).toBe('');
    expect(suggestPath('')).toBe('');
  });

  it('produces a path the resolver can match by title', () => {
    // The loop only closes if creating `suggestPath(target)` makes `[[target]]`
    // resolve. It does so through the title, which is the target written out.
    const target = 'Deploying to Fly';

    expect(normalizeTarget(target)).toBe(normalizeTarget(target.trim()));
    expect(suggestPath(target)).toBe('deploying-to-fly');
  });
});

describe('getWantedPages', () => {
  it('finds nothing to write in a wiki with no broken links', () => {
    // The demo content resolves cleanly; `check:links` asserts the same thing
    // from the other side.
    expect(getWantedPages()).toEqual([]);
  });
});

describe('getWikiHealth', () => {
  it('never calls the page a reader starts on an orphan', () => {
    // Nothing needs to point at the entry page, so reporting it every build
    // would teach everyone to ignore the report.
    const { orphans } = getWikiHealth();

    expect(orphans.some((page) => page.path === 'intro')).toBe(false);
  });

  it('agrees with the graph about which pages lead nowhere', () => {
    const { deadEnds } = getWikiHealth();
    const { outbound } = getLinkGraph();

    for (const page of deadEnds) {
      expect(outbound.get(page.path) ?? [], page.path).toEqual([]);
    }

    // And does not miss one: every page absent from the list has somewhere to
    // go. Asserting only the first half would pass on an empty list.
    const reported = new Set(deadEnds.map((page) => page.path));
    const missed = [...outbound.entries()]
      .filter(([path, links]) => links.length === 0 && !reported.has(path))
      .map(([path]) => path);

    expect(missed).toEqual([]);
  });
});

// A typo used to be answered with an invitation to create the page again.
describe('nearestPage', () => {
  it('offers the page a near miss meant', () => {
    expect(nearestPage('intr')).toBe('intro');
    expect(nearestPage('Intro ')).toBe('intro');
  });

  it('offers nothing for a target unlike any page', () => {
    expect(nearestPage('zzqx-nonexistent-page')).toBeUndefined();
    expect(nearestPage('ab')).toBeUndefined();
  });
});
