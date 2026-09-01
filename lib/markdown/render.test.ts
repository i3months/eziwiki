import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { renderDoc, renderMarkdown } from './render';

// The pages are drawn by `npm run build:pdf-images`. On a checkout that has
// not run it these tests are skipped, and say so, rather than passing on an
// early return that asserted nothing.
const drewPosters = fs.existsSync(path.join(process.cwd(), 'public', 'pdf-images', 'index.json'));

describe('renderMarkdown', () => {
  it('renders headings with anchor ids and collects them', async () => {
    const { html, headings } = await renderMarkdown('# Title\n\n## Setup\n\n### Details\n');

    expect(html).toContain('id="setup"');
    expect(headings).toEqual([
      { id: 'setup', text: 'Setup', depth: 2 },
      { id: 'details', text: 'Details', depth: 3 },
    ]);
  });

  it('excludes h1 from the table of contents', async () => {
    const { headings } = await renderMarkdown('# Page Title\n\n## Section\n');

    expect(headings.map((heading) => heading.text)).toEqual(['Section']);
  });

  it('wraps code blocks with a language label and copy button', async () => {
    const { html } = await renderMarkdown('```typescript\nconst x = 1;\n```\n');

    expect(html).toContain('class="ezw-code"');
    expect(html).toContain('data-language="typescript"');
    expect(html).toContain('data-ezw-copy');
    expect(html).toContain('>typescript<');
  });

  it('labels a fence with no language as text', async () => {
    const { html } = await renderMarkdown('```\nplain\n```\n');

    expect(html).toContain('data-language="text"');
  });

  it('shows a fence’s title in place of its language', async () => {
    const { html } = await renderMarkdown('```ts title="src/index.ts"\nconst x = 1;\n```\n');

    expect(html).toContain('class="ezw-code__title">src/index.ts<');
    // The language is still recorded, just not spelled out beside a filename
    // that already says more than it does.
    expect(html).toContain('data-language="ts"');
    expect(html).not.toContain('ezw-code__lang');
  });

  it('marks the lines a fence named', async () => {
    const { html } = await renderMarkdown('```ts {2}\nconst a = 1;\nconst b = 2;\n```\n');

    const lines = html.split('class="line');

    expect(lines[1]).not.toContain('ezw-line--marked');
    expect(lines[2]).toContain('ezw-line--marked');
  });

  it('asks the stylesheet for line numbers rather than emitting them', async () => {
    const { html } = await renderMarkdown('```ts showLineNumbers\nconst a = 1;\n```\n');

    expect(html).toContain('ezw-code--numbered');
    // Numbers in the markup would be copied along with the code.
    expect(html).not.toContain('>1<');
  });

  it('keeps a fence’s meta out of the page', async () => {
    // It exists only to survive `rehypeRaw` on the way to the highlighter.
    const { html } = await renderMarkdown('```ts title="a.ts" {1}\nconst a = 1;\n```\n');

    expect(html).not.toContain('metastring');
  });

  it('leaves a plain fence exactly as it was', async () => {
    const { html } = await renderMarkdown('```ts\nconst a = 1;\n```\n');

    expect(html).toContain('class="ezw-code"');
    expect(html).not.toContain('ezw-code--numbered');
    expect(html).not.toContain('ezw-line--marked');
  });

  it('highlights code with both themes as CSS variables', async () => {
    const { html } = await renderMarkdown('```js\nconst x = 1;\n```\n');

    expect(html).toContain('--shiki-light');
    expect(html).toContain('--shiki-dark');
    // With defaultColor disabled neither theme is baked in as a plain colour.
    expect(html).not.toMatch(/<pre[^>]*style="[^"]*(?<!-)color:\s*#/);
  });

  it('does not fail the build on an unknown code language', async () => {
    const { html } = await renderMarkdown('```not-a-real-language\nx\n```\n');

    expect(html).toContain('class="ezw-code"');
  });

  it('rewrites internal links to site URLs', async () => {
    const { html } = await renderMarkdown('[Quick Start](getting-started/quick-start)\n');

    expect(html).toContain('href="/getting-started/quick-start/"');
  });

  it('resolves internal links written with a .md extension or leading slash', async () => {
    const { html } = await renderMarkdown(
      '[a](/getting-started/quick-start) [b](getting-started/quick-start.md)\n',
    );

    expect(html.match(/href="\/getting-started\/quick-start\/"/g)).toHaveLength(2);
  });

  // `trailingSlash` is on, so this is the form the page is exported under. A
  // slashless link is a redirect on hosts that add the slash, and a 404 on
  // hosts that do not.
  it('emits internal links in the trailing-slash form the export uses', async () => {
    const { html } = await renderMarkdown('[a](getting-started/quick-start)\n');

    expect(html).toContain('href="/getting-started/quick-start/"');
    expect(html).not.toMatch(/href="\/getting-started\/quick-start"/);
  });

  it('preserves the anchor when resolving an internal link', async () => {
    const { html } = await renderMarkdown('[Step](getting-started/quick-start#step-two)\n');

    expect(html).toContain('href="/getting-started/quick-start/#step-two"');
  });

  it('leaves in-page anchors alone', async () => {
    const { html } = await renderMarkdown('## Setup\n\n[Jump](#setup)\n');

    expect(html).toContain('href="#setup"');
  });

  it('leaves unresolvable internal links as authored', async () => {
    const { html } = await renderMarkdown('[Missing](no/such/page)\n');

    expect(html).toContain('href="no/such/page"');
  });

  it('opens external links in a new tab with a safe rel', async () => {
    const { html } = await renderMarkdown('[Next.js](https://nextjs.org)\n');

    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('renders GitHub Flavored Markdown tables and task lists', async () => {
    const { html } = await renderMarkdown('| a | b |\n| - | - |\n| 1 | 2 |\n\n- [x] done\n');

    expect(html).toContain('<table>');
    expect(html).toContain('type="checkbox"');
  });

  it('renders math with KaTeX', async () => {
    const { html } = await renderMarkdown('$E = mc^2$\n');

    expect(html).toContain('katex');
  });

  it('keeps raw HTML written inside Markdown', async () => {
    const { html } = await renderMarkdown('<div class="custom">hello</div>\n');

    expect(html).toContain('<div class="custom">hello</div>');
  });

  // The opening figure is usually what the browser measures as the largest
  // contentful paint, and deferring it keeps the request out of the preload
  // scan, so it is fetched eagerly while the images below it still defer.
  it('fetches the first image eagerly and defers the rest', async () => {
    const { html } = await renderMarkdown('![one](/images/a.png)\n\n![two](/images/b.png)\n');

    const [first, second] = html.match(/<img[^>]*>/g) ?? [];

    expect(first).toContain('loading="eager"');
    expect(first).toContain('fetchpriority="high"');
    expect(second).toContain('loading="lazy"');
    expect(second).not.toContain('fetchpriority');
  });

  it('adds the styling hook to every image', async () => {
    const { html } = await renderMarkdown('![alt](/images/x.png)\n');

    expect(html).toContain('ezw-img');
  });
});

describe('renderDoc', () => {
  it('renders a document from the content registry', async () => {
    const rendered = await renderDoc('intro');

    expect(rendered).not.toBeNull();
    expect(rendered!.html.length).toBeGreaterThan(0);
  });

  it('memoises repeated renders of the same document', async () => {
    expect(await renderDoc('intro')).toBe(await renderDoc('intro'));
  });

  it('returns null for a document that does not exist', async () => {
    expect(await renderDoc('does-not-exist')).toBeNull();
  });
});

describe('wiki links', () => {
  it('resolves a full path', async () => {
    const { html } = await renderMarkdown('[[getting-started/quick-start]]\n');

    expect(html).toContain('href="/getting-started/quick-start/"');
    expect(html).toContain('ezw-wikilink');
    // With no label, the target's own title is used as the link text.
    expect(html).toContain('>Quick Start<');
  });

  it('resolves a bare file name', async () => {
    const { html } = await renderMarkdown('[[quick-start]]\n');

    expect(html).toContain('href="/getting-started/quick-start/"');
  });

  it('resolves a page title', async () => {
    const { html } = await renderMarkdown('[[Quick Start]]\n');

    expect(html).toContain('href="/getting-started/quick-start/"');
  });

  it('uses an explicit label', async () => {
    const { html } = await renderMarkdown('[[quick-start|start here]]\n');

    expect(html).toContain('>start here<');
  });

  it('appends an anchor', async () => {
    const { html } = await renderMarkdown('[[quick-start#prerequisites]]\n');

    expect(html).toContain('href="/getting-started/quick-start/#prerequisites"');
  });

  it('links an anchor-only reference within the page', async () => {
    const { html } = await renderMarkdown('## Setup\n\n[[#setup]]\n');

    expect(html).toContain('href="#setup"');
  });

  it('marks an unresolved link as broken instead of linking nowhere', async () => {
    const { html } = await renderMarkdown('[[no-such-page]]\n');

    expect(html).toContain('ezw-broken-link');
    expect(html).not.toContain('href="/no-such-page"');
    expect(html).toContain('>no-such-page<');
  });

  it('leaves wiki links inside code untouched', async () => {
    const inline = await renderMarkdown('Use `[[quick-start]]` to link.\n');
    const fenced = await renderMarkdown('```\n[[quick-start]]\n```\n');

    expect(inline.html).not.toContain('ezw-wikilink');
    expect(inline.html).toContain('[[quick-start]]');
    expect(fenced.html).not.toContain('ezw-wikilink');
  });

  it('handles several links in one paragraph with text between them', async () => {
    const { html } = await renderMarkdown('See [[intro]] and then [[quick-start]] next.\n');

    expect(html).toContain('href="/intro/"');
    expect(html).toContain('href="/getting-started/quick-start/"');
    expect(html).toContain('See ');
    expect(html).toContain(' and then ');
    expect(html).toContain(' next.');
  });

  it('leaves unmatched brackets as literal text', async () => {
    const { html } = await renderMarkdown('An array like [[1, 2], [3]] stays put.\n');

    expect(html).not.toContain('ezw-wikilink');
    expect(html).not.toContain('ezw-broken-link');
  });
});

describe('embeds', () => {
  it('renders an embedded image from a bare filename', async () => {
    const { html } = await renderMarkdown('![[sample.jpg]]\n');

    expect(html).toContain('<img');
    expect(html).toContain('src="/images/docs/sample.jpg"');
    expect(html).toContain('ezw-img');
  });

  it('accepts the full path under public/', async () => {
    const { html } = await renderMarkdown('![[images/docs/sample.jpg]]\n');

    expect(html).toContain('src="/images/docs/sample.jpg"');
  });

  it('uses the label as alt text', async () => {
    const { html } = await renderMarkdown('![[sample.jpg|A sample]]\n');

    expect(html).toContain('alt="A sample"');
  });

  // Without the embed the `!` would survive as literal text ahead of a link,
  // which is how this read before embeds were understood.
  it('leaves no stray exclamation mark', async () => {
    const { html } = await renderMarkdown('![[sample.jpg]]\n');

    expect(html).not.toContain('>!<');
    expect(html).not.toMatch(/!\s*<img/);
  });

  it('still links when the embed names a page rather than a file', async () => {
    const { html } = await renderMarkdown('![[quick-start]]\n');

    expect(html).toContain('href="/getting-started/quick-start/"');
  });

  it('marks an embed that matches nothing as broken', async () => {
    const { html } = await renderMarkdown('![[no-such-file.png]]\n');

    expect(html).toContain('ezw-broken-link');
  });
});

describe('document embeds', () => {
  it('renders a PDF alone in its paragraph as a viewer figure', async () => {
    const { html } = await renderMarkdown('![[sample.pdf]]\n');

    expect(html).toContain('<figure');
    expect(html).toContain('class="ezw-pdf"');
    expect(html).toContain('data-ezw-pdf');
    expect(html).toContain('data-name="sample.pdf"');
  });

  // The address lives on the fallback link and nowhere else, which is what
  // lets `rehypeBasePath` correct it for a subdirectory deployment.
  it('carries the file’s URL on a real link inside the figure', async () => {
    const { html } = await renderMarkdown('![[sample.pdf]]\n');

    expect(html).toContain('class="ezw-pdf__fallback"');
    expect(html).toContain('href="/documents/sample.pdf"');
    expect(html).toContain('download');
    // The document itself is never the source of an image; only its poster is.
    expect(html).not.toContain('<img src="/documents/sample.pdf"');
  });

  // The poster is drawn by `npm run build:posters`. It is absent on a checkout
  // that has not run it, so these describe what is emitted when it is there
  // rather than asserting it always is.
  it.skipIf(!drewPosters)('shows the first page as an image when the build drew one', async () => {
    const { html } = await renderMarkdown('![[sample.pdf]]\n');

    expect(html).toMatch(/<img[^>]*class="ezw-pdf__poster[^"]*"/);
    expect(html).toContain('src="/pdf-images/documents/sample.pdf.1.webp"');
    // Written out so the box is the right shape before the image arrives.
    expect(html).toMatch(/width="\d+"/);
    expect(html).toMatch(/height="\d+"/);
  });

  it.skipIf(!drewPosters)('records the page count the poster build measured', async () => {
    const { html } = await renderMarkdown('![[sample.pdf]]\n');

    expect(html).toContain('data-pages="3"');
  });

  it('records the size the build measured', async () => {
    const { html } = await renderMarkdown('![[sample.pdf]]\n');

    expect(html).toMatch(/data-size="[1-9]\d*"/);
  });

  // The label is what the document is called wherever a reader sees its name:
  // the viewer's header reads it off `data-name`, and the fallback link is the
  // same words again. The file name stays on the href, where it belongs.
  it('uses the label to name the file when one is given', async () => {
    const { html } = await renderMarkdown('![[sample.pdf|The handbook]]\n');

    expect(html).toContain('data-name="The handbook"');
    expect(html).toContain('>The handbook</a>');
    expect(html).toContain('href="/documents/sample.pdf"');
  });

  it('accepts the full path under public/', async () => {
    const { html } = await renderMarkdown('![[documents/sample.pdf]]\n');

    expect(html).toContain('href="/documents/sample.pdf"');
  });

  // A viewer is a block and cannot sit inside a sentence, so an embed written
  // mid-prose becomes the most an inline position can carry: a link.
  // `documents.raster` in the payload names `scans/**`, so the demo scan is
  // shown as pictures of its pages and never reaches the viewer.
  it.skipIf(!drewPosters)('shows a document named as a scan as images of its pages', async () => {
    const { html } = await renderMarkdown('![[field-notebook.pdf]]\n');

    expect(html).toContain('class="ezw-pdf ezw-pdf--raster"');
    expect(html).toContain('src="/pdf-images/scans/field-notebook.pdf.1.webp"');
    expect(html).toContain('src="/pdf-images/scans/field-notebook.pdf.2.webp"');
  });

  // The absence is the feature: the client only ever looks for this attribute,
  // so without it pdf.js cannot be fetched by this figure under any
  // circumstance, and the pages are readable with script switched off.
  it.skipIf(!drewPosters)('leaves a scan with nothing for the viewer to attach to', async () => {
    const { html } = await renderMarkdown('![[field-notebook.pdf]]\n');

    const figure = /<figure class="ezw-pdf ezw-pdf--raster"[\s\S]*?<\/figure>/.exec(html)?.[0];
    expect(figure).toBeDefined();
    expect(figure).not.toContain('data-ezw-pdf');
    expect(figure).toContain('href="/scans/field-notebook.pdf"');
  });

  it.skipIf(!drewPosters)('numbers a scan’s pages in their alt text', async () => {
    const { html } = await renderMarkdown('![[field-notebook.pdf]]\n');

    expect(html).toContain('alt="Page 1 of 2"');
    expect(html).toContain('alt="Page 2 of 2"');
  });

  it.skipIf(!drewPosters)('lets the label name a scan in its header', async () => {
    const { html } = await renderMarkdown('![[field-notebook.pdf|Field notebook]]\n');

    expect(html).toContain('>Field notebook</span>');
  });

  it('becomes a link when the embed shares its paragraph with prose', async () => {
    const { html } = await renderMarkdown('See ![[sample.pdf|the handbook]] for details.\n');

    expect(html).not.toContain('ezw-pdf');
    expect(html).toContain('class="ezw-file-link"');
    expect(html).toContain('href="/documents/sample.pdf"');
    expect(html).toContain('>the handbook</a>');
  });
});

describe('transclusion', () => {
  it('includes a whole document when the embed is alone in its paragraph', async () => {
    const { html } = await renderMarkdown('![[quick-start]]\n');

    expect(html).toContain('ezw-transclusion');
    expect(html).toContain('Prerequisites');
  });

  it('attributes the content to the page it came from', async () => {
    const { html } = await renderMarkdown('![[quick-start]]\n');

    expect(html).toContain('ezw-transclusion__source');
    expect(html).toContain('href="/getting-started/quick-start/"');
  });

  it('includes only the named section', async () => {
    const whole = await renderMarkdown('![[quick-start]]\n');
    const section = await renderMarkdown('![[quick-start#prerequisites]]\n');

    expect(section.html).toContain('ezw-transclusion');
    expect(section.html).toContain('Prerequisites');
    expect(section.html.length).toBeLessThan(whole.html.length / 2);
    // The section stops at the next heading of the same level.
    expect(section.html).not.toContain('Step 1');
  });

  // Blocks cannot sit inside a paragraph, and an embed among prose is being
  // used as a reference rather than as an inclusion.
  it('stays a link when the embed shares its paragraph with text', async () => {
    const { html } = await renderMarkdown('see ![[quick-start]] here\n');

    expect(html).not.toContain('ezw-transclusion');
    expect(html).toContain('ezw-wikilink');
  });

  it('falls back to a link when the named section does not exist', async () => {
    const { html } = await renderMarkdown('![[quick-start#no-such-section]]\n');

    expect(html).not.toContain('ezw-transclusion');
    expect(html).toContain('href="/getting-started/quick-start/#no-such-section"');
  });

  // Rendering a copy of the page inside itself would not terminate.
  it('refuses a document that includes itself', async () => {
    const { html } = await renderMarkdown('![[quick-start]]\n', 'getting-started/quick-start');

    expect(html).not.toContain('ezw-transclusion');
    expect(html).toContain('ezw-wikilink');
  });

  // The contents describe the page a reader is on, not the pages it borrows.
  it('keeps transcluded headings out of the table of contents', async () => {
    const { headings } = await renderMarkdown('## Mine\n\n![[quick-start]]\n');

    expect(headings.map((heading) => heading.text)).toEqual(['Mine']);
  });
});

describe('link previews', () => {
  // The card's contents ride on the anchor so hovering costs no request.
  it('carries the target title and summary on the link', async () => {
    const { html } = await renderMarkdown('[[quick-start]]\n');

    expect(html).toContain('data-preview-title="Quick Start"');
    expect(html).toMatch(/data-preview="[^"]+"/);
  });

  it('leaves a broken link without preview data', async () => {
    const { html } = await renderMarkdown('[[no-such-page]]\n');

    expect(html).not.toContain('data-preview');
  });
});

describe('heading anchors', () => {
  it('gives each heading a link to itself', async () => {
    const { html } = await renderMarkdown('## Setup steps\n');

    expect(html).toContain('class="ezw-heading__anchor"');
    expect(html).toContain('href="#setup-steps"');
  });

  // The page URL already addresses the page; a link to its own title would
  // point at where the reader is.
  it('leaves the title heading alone', async () => {
    const { html } = await renderMarkdown('# Title\n\n## Section\n');
    const title = html.match(/<h1[\s\S]*?<\/h1>/)?.[0] ?? '';

    expect(title).not.toContain('ezw-heading__anchor');
    expect(html.match(/<h2[\s\S]*?<\/h2>/)?.[0]).toContain('ezw-heading__anchor');
  });

  // Without a name of its own a screen reader hears every heading trailed by
  // a stray "#".
  it('names the anchor after the section it links to', async () => {
    const { html } = await renderMarkdown('## Setup steps\n');

    expect(html).toContain('aria-label="Link to this section: Setup steps"');
  });

  // Collection runs first, so the anchor's own text never reaches the rail.
  it('keeps the anchor out of the contents', async () => {
    const { headings } = await renderMarkdown('## Setup\n\n### Deep\n');

    expect(headings.map((heading) => heading.text)).toEqual(['Setup', 'Deep']);
  });

  // A transcluded heading's id belongs to the page it came from; linking it
  // here would send a reader to a copy.
  it('leaves transcluded headings unanchored', async () => {
    const { html } = await renderMarkdown('![[intro]]\n');
    const transcluded = html.match(/<div class="ezw-transclusion">[\s\S]*?<\/div>/)?.[0] ?? '';

    expect(transcluded).not.toContain('ezw-heading__anchor');
  });
});
