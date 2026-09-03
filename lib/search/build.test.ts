import { describe, it, expect } from 'vitest';
import { buildSearchIndex, markdownToText, splitSections } from './build';
import { getSite } from '../site';

describe('markdownToText', () => {
  it('unwraps links to their text', () => {
    expect(markdownToText('See [the guide](/guides/x) for details.')).toBe(
      'See the guide for details.',
    );
  });

  it('keeps image alt text and drops the source', () => {
    expect(markdownToText('![A diagram](/images/x.png)')).toBe('A diagram');
  });

  it('strips emphasis and inline code markers', () => {
    expect(markdownToText('Run **`npm install`** _now_')).toBe('Run npm install now');
  });

  it('strips heading markers', () => {
    expect(markdownToText('# Title\n\nBody')).toBe('Title Body');
  });

  it('keeps code contents but drops the fences', () => {
    const text = markdownToText('```typescript\nconst apiKey = 1;\n```');

    expect(text).toContain('const apiKey = 1;');
    expect(text).not.toContain('```');
    expect(text).not.toContain('typescript');
  });

  it('strips HTML tags and comments', () => {
    expect(markdownToText('<div class="x">hi</div><!-- note -->')).toBe('hi');
  });

  it('flattens list and blockquote markers', () => {
    expect(markdownToText('- one\n- two\n\n> quoted')).toBe('one two quoted');
  });

  it('flattens tables without leaving delimiter rows', () => {
    const text = markdownToText('| a | b |\n| - | - |\n| 1 | 2 |');

    expect(text).toContain('a');
    expect(text).toContain('1');
    expect(text).not.toContain('|');
    expect(text).not.toMatch(/-{2,}/);
  });
});

describe('splitSections', () => {
  it('returns a single preamble when there are no headings', () => {
    const sections = splitSections('Just some text.\n');

    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBeUndefined();
  });

  it('splits at h2 through h4', () => {
    const sections = splitSections('intro\n\n## Two\na\n\n### Three\nb\n\n#### Four\nc\n');

    expect(sections.map((section) => section.heading)).toEqual([undefined, 'Two', 'Three', 'Four']);
  });

  it('does not split at h1 or h5', () => {
    const sections = splitSections('# One\n\n##### Five\n\n## Two\n');

    expect(sections.map((section) => section.heading)).toEqual([undefined, 'Two']);
  });

  it('ignores headings inside fenced code blocks', () => {
    const sections = splitSections('intro\n\n```bash\n## not a heading\n```\n\n## Real\n');

    expect(sections.map((section) => section.heading)).toEqual([undefined, 'Real']);
  });

  it('handles tilde fences as well as backticks', () => {
    const sections = splitSections('~~~\n## nope\n~~~\n\n## Real\n');

    expect(sections.map((section) => section.heading)).toEqual([undefined, 'Real']);
  });

  it('assigns body text to the heading that precedes it', () => {
    const sections = splitSections('## Setup\nrun npm install\n\n## Usage\nrun npm start\n');

    expect(sections[1].markdown).toContain('npm install');
    expect(sections[1].markdown).not.toContain('npm start');
  });

  it('strips trailing closing hashes from a heading', () => {
    expect(splitSections('## Setup ##\n')[1].heading).toBe('Setup');
  });

  it('keeps a hash that is part of the heading text', () => {
    // Only a space-separated run of hashes closes a heading; the one in `C#`
    // is the name, and dropping it left the section without an anchor.
    expect(splitSections('## C#\n')[1].heading).toBe('C#');
    expect(splitSections('## Issue #12\n')[1].heading).toBe('Issue #12');
  });
});

describe('buildSearchIndex', () => {
  it('indexes every visible page and its sections', async () => {
    const index = await buildSearchIndex();
    // The page's path is the id's first half; the field itself was dropped
    // from the index, since nothing in the browser read it.
    const paths = new Set(index.docs.map((doc) => doc.id.split('#')[0]));

    expect(index.docs.length).toBeGreaterThan(paths.size);
    expect(paths.has('getting-started/quick-start')).toBe(true);
  });

  it('excludes pages hidden by frontmatter or by navigation', async () => {
    const index = await buildSearchIndex();
    const { hiddenPaths } = getSite();

    expect(hiddenPaths.size).toBeGreaterThan(0);

    for (const hidden of hiddenPaths) {
      expect(index.docs.some((doc) => doc.id.split('#')[0] === hidden)).toBe(false);
    }
  });

  it('links section entries to a real anchor on the page', async () => {
    const index = await buildSearchIndex();
    const sections = index.docs.filter((doc) => doc.section);

    expect(sections.length).toBeGreaterThan(0);

    for (const section of sections) {
      // Every section should carry an anchor in its URL; a bare page URL
      // means the heading could not be matched to the rendered document.
      const path = section.id.split('#')[0];
      expect(section.url).toMatch(new RegExp(`^/${path}#.+`));
    }
  });

  it('gives every entry a unique id', async () => {
    const index = await buildSearchIndex();
    const ids = index.docs.map((doc) => doc.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('leaves no Markdown syntax in the indexed body text', async () => {
    const index = await buildSearchIndex();

    for (const doc of index.docs) {
      expect(doc.body).not.toContain('```');
      expect(doc.body).not.toMatch(/\]\(/);
    }
  });
});
