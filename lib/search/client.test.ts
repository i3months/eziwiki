import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { buildExcerpt, buildQuery, search } from './client';
import { buildSearchIndex } from './build';
import { SEARCH_INDEX_PATH, type SearchIndex } from './types';

/**
 * Exercises the real query path — including the MiniSearch configuration,
 * boosting, and the OR fallback — by serving the actual generated index
 * through a stubbed fetch.
 */

let index: SearchIndex;

beforeAll(async () => {
  index = await buildSearchIndex();

  vi.stubGlobal('fetch', async (url: string) => {
    if (!String(url).endsWith(SEARCH_INDEX_PATH)) {
      return { ok: false, status: 404 } as Response;
    }
    return { ok: true, status: 200, json: async () => index } as Response;
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('buildExcerpt', () => {
  it('returns an empty string for empty input', () => {
    expect(buildExcerpt('', ['x'])).toBe('');
  });

  it('returns short text unchanged', () => {
    expect(buildExcerpt('A short line.', ['short'])).toBe('A short line.');
  });

  it('centres the excerpt on the matched term', () => {
    const body = `${'a '.repeat(200)}needle${' b'.repeat(200)}`;
    const excerpt = buildExcerpt(body, ['needle']);

    expect(excerpt).toContain('needle');
    expect(excerpt.startsWith('…')).toBe(true);
    expect(excerpt.endsWith('…')).toBe(true);
  });

  it('falls back to the start when no term is present', () => {
    const body = 'x'.repeat(500);
    const excerpt = buildExcerpt(body, ['nowhere']);

    expect(excerpt.startsWith('x')).toBe(true);
    expect(excerpt.endsWith('…')).toBe(true);
  });

  it('matches terms case-insensitively', () => {
    const body = `${'a '.repeat(200)}Needle${' b'.repeat(200)}`;
    expect(buildExcerpt(body, ['needle'])).toContain('Needle');
  });
});

describe('search', () => {
  it('returns nothing for a blank query', async () => {
    expect(await search('')).toEqual([]);
    expect(await search('   ')).toEqual([]);
  });

  it('finds a page by its title', async () => {
    const results = await search('quick start');

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((result) => result.url.startsWith('/getting-started/quick-start'))).toBe(
      true,
    );
  });

  it('finds a page by words in its body', async () => {
    const results = await search('syntax highlighting');

    expect(results.some((result) => result.url.includes('syntax-highlighting'))).toBe(true);
  });

  it('links a section hit to its anchor', async () => {
    const results = await search('prerequisites');
    const hit = results.find((result) => result.section);

    expect(hit).toBeDefined();
    expect(hit!.url).toContain('#');
  });

  it('ranks a title match above an incidental body mention', async () => {
    const results = await search('dark mode');

    expect(results[0].url).toContain('dark-mode');
  });

  it('ranks a page above its own subsections', async () => {
    // A section entry carries its page's title as well as its heading, so
    // without a page boost "dark mode" surfaces "Disable Dark Mode" instead of
    // the Dark Mode page itself.
    for (const query of ['dark mode', 'wiki links', 'hidden pages']) {
      const top = (await search(query))[0];

      expect(top, query).toBeDefined();
      expect(top.section, query).toBeUndefined();
    }
  });

  it('tolerates a typo', async () => {
    const results = await search('instalation');

    expect(results.some((result) => result.url.includes('installation'))).toBe(true);
  });

  it('matches on a prefix', async () => {
    const results = await search('deploym');

    expect(results.length).toBeGreaterThan(0);
  });

  it('falls back to OR when no page matches every term', async () => {
    // 'zzzz' appears nowhere, so an AND query would return nothing at all.
    const results = await search('installation zzzz');

    expect(results.length).toBeGreaterThan(0);
  });

  it('returns an empty list when nothing matches at all', async () => {
    expect(await search('qqqqzzzzxxxx')).toEqual([]);
  });

  it('attaches an excerpt to results that have body text', async () => {
    const results = await search('markdown');
    const withBody = results.filter((result) => result.excerpt);

    expect(withBody.length).toBeGreaterThan(0);
  });

  it('never returns more than the display limit', async () => {
    const results = await search('the');

    expect(results.length).toBeLessThanOrEqual(20);
  });
});

describe('search with Korean content', () => {
  it('matches a substring of an unspaced Korean phrase', async () => {
    const korean: SearchIndex = {
      version: index.version,
      docs: [
        {
          id: 'ko',
          path: 'ko',
          url: '/ko',
          title: '한국어 문서',
          body: '위키문서를 만드는 방법을 설명합니다.',
        },
      ],
    };

    const searcher = await (await import('./client')).createSearcher(korean);

    // '위키' is a substring of '위키문서를', which whitespace tokenisation alone
    // would never match — the bigram tokeniser is what makes this work.
    expect(searcher.search('위키', { prefix: true }).length).toBeGreaterThan(0);
    expect(searcher.search('문서', { prefix: true }).length).toBeGreaterThan(0);
  });
});

describe('buildQuery', () => {
  it('lets a Korean word match through any of its parts', () => {
    // As a plain string the word's bigrams were all required, so `설치를`
    // demanded the bigram straddling the particle and found almost nothing.
    expect(buildQuery('vercel 배포를', 'AND')).toEqual({
      combineWith: 'AND',
      queries: ['vercel', { queries: ['배포를'], combineWith: 'OR' }],
    });
  });

  it('leaves a two-character Korean word and Latin words as they are', () => {
    expect(buildQuery('문서 wiki', 'AND')).toEqual({
      combineWith: 'AND',
      queries: ['문서', 'wiki'],
    });
  });
});

describe('search, the forms readers actually type', () => {
  it('finds a page by its name run together', async () => {
    // `wikilink` and `quickstart` used to find nothing at all.
    expect((await search('wikilink'))[0]?.url).toBe('/features/wiki-links');
    expect((await search('quickstart'))[0]?.url).toMatch(/quick-start/);
  });

  it('finds the contents rail by its abbreviation, through a tag', async () => {
    expect((await search('toc'))[0]?.url).toBe('/features/table-of-contents');
  });

  it('does not let a three-letter term drift to other words', async () => {
    // `toc` used to match `to` and `too` in two hundred places.
    const results = await search('toc');
    expect(results.every((r) => r.url.includes('table-of-contents'))).toBe(true);
  });

  it('reports the terms that matched, for highlighting', async () => {
    const [first] = await search('linkz');
    expect(first.terms).toContain('links');
  });
});
