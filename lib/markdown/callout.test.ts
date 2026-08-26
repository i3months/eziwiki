import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './render';

/** Renders a callout and reports what it became. */
async function render(markdown: string) {
  const { html } = await renderMarkdown(`${markdown}\n`);

  return {
    html,
    kind: (html.match(/ezw-callout--(\w+)/) ?? [])[1] ?? null,
    tag: (html.match(/<(details|div)[^>]*ezw-callout/) ?? [])[1] ?? null,
    title: (html.match(/ezw-callout__title">([^<]*)/) ?? [])[1] ?? null,
  };
}

describe('callouts', () => {
  it('turns a marked blockquote into a callout', async () => {
    const { kind, tag, title, html } = await render('> [!NOTE]\n> Useful information.');

    expect(kind).toBe('note');
    expect(tag).toBe('div');
    expect(title).toBe('Note');
    expect(html).toContain('Useful information.');
  });

  it('uses a title given on the marker line', async () => {
    expect((await render('> [!WARNING] Mind the gap\n> Careful.')).title).toBe('Mind the gap');
  });

  it('recognises the kinds case-insensitively', async () => {
    expect((await render('> [!note]\n> x')).kind).toBe('note');
    expect((await render('> [!NoTe]\n> x')).kind).toBe('note');
  });

  // Obsidian defines more kinds than GitHub and vaults use them, so they map
  // onto the nearest one instead of losing their formatting.
  it('maps the extra Obsidian kinds onto the nearest one', async () => {
    expect((await render('> [!danger]\n> x')).kind).toBe('caution');
    expect((await render('> [!success]\n> x')).kind).toBe('tip');
    expect((await render('> [!question]\n> x')).kind).toBe('important');
  });

  it('leaves an unknown kind as an ordinary quote', async () => {
    const { kind, html } = await render('> [!nonsense]\n> x');

    expect(kind).toBeNull();
    expect(html).toContain('<blockquote>');
  });

  it('leaves a plain quote alone', async () => {
    const { kind, html } = await render('> Just a quote.');

    expect(kind).toBeNull();
    expect(html).toContain('<blockquote>');
  });

  // `<details>` opens and closes without script, so a disclosure keeps working
  // with JavaScript disabled.
  it('folds with a trailing - or +', async () => {
    const closed = await render('> [!TIP]- Optional\n> Hidden.');
    const open = await render('> [!TIP]+ Shown\n> Visible.');

    expect(closed.tag).toBe('details');
    expect(closed.html).not.toMatch(/<details[^>]*\sopen/);
    expect(open.tag).toBe('details');
    expect(open.html).toMatch(/<details[^>]*\sopen/);
  });

  // The body passes through the rest of the pipeline, so nothing inside a
  // callout behaves differently from the same text outside one.
  it('renders links, wiki links and code inside the body', async () => {
    // `intro` is the one page both this repository and a scaffolded project
    // have, so the test travels with the engine.
    const wiki = await render('> [!NOTE]\n> See [[intro]].');
    const code = await render('> [!TIP]\n> Run `npm i`.');

    expect(wiki.html).toContain('ezw-wikilink');
    expect(code.html).toContain('<code');
  });

  it('keeps a multi-line body together', async () => {
    const { html } = await render('> [!NOTE]\n> First line.\n> Second line.');

    expect(html).toContain('First line.');
    expect(html).toContain('Second line.');
  });

  it('keeps a title that carries inline code together', async () => {
    // The title used to end at the first inline node: this one read "Use",
    // and the code and the words after it fell into the body.
    const { html } = await render('> [!TIP] Use `npm ci` instead\n> Body text.');

    expect(html).toMatch(/ezw-callout__title">Use <code>npm ci<\/code> instead</);
    expect(html).toMatch(/<p>Body text\.<\/p>/);
  });

  it('ends the title at a hard break', async () => {
    // Two trailing spaces are a `break` node, not a newline in the text;
    // the title used to run on through it and swallow the body.
    const { html } = await render('> [!NOTE] Title  \n> Body text.');

    expect(html).toMatch(/ezw-callout__title">Title<\/p>/);
    expect(html).toContain('Body text.');
  });

  it('converts a callout nested inside another', async () => {
    const { html } = await render('> [!NOTE] Outer\n> > [!TIP] Inner\n> > Inner body.');

    expect(html).toContain('ezw-callout--note');
    expect(html).toContain('ezw-callout--tip');
    expect(html).toContain('ezw-callout__title">Inner<');
    expect(html).not.toContain('[!TIP]');
  });
});
