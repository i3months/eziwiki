import { describe, expect, it } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { Heading, Root } from 'mdast';
import { getDoc } from '../content/registry';
import { headingSlugs, headingText, slugAnchor } from './headings';

function parse(markdown: string): Root {
  return unified().use(remarkParse).parse(markdown) as Root;
}

function heading(markdown: string): Heading {
  return parse(markdown).children[0] as Heading;
}

describe('headingText', () => {
  it('shows a labelled wiki link as its label', () => {
    expect(headingText(heading('## See [[quick-start|Alias]]'))).toBe('See Alias');
  });

  it('shows an unlabelled wiki link as the title of the page it reaches', () => {
    // `intro` is the one page both this repository and a scaffolded project
    // have, so the test travels with the engine.
    expect(headingText(heading('## See [[intro]]'))).toBe(`See ${getDoc('intro')?.title}`);
  });

  it('shows a link to nowhere as written', () => {
    expect(headingText(heading('## See [[no-such-page]]'))).toBe('See no-such-page');
  });

  it('drops inline HTML, as the render does', () => {
    expect(headingText(heading('## Setup <small>beta</small>'))).toBe('Setup beta');
  });

  it('drops an image, whose alt the render does not print', () => {
    expect(headingText(heading('## Logo ![logo](l.png)'))).toBe('Logo');
  });
});

describe('slugAnchor', () => {
  it('slugs heading text and leaves an id alone', () => {
    expect(slugAnchor('Start here')).toBe('start-here');
    expect(slugAnchor('start-here')).toBe('start-here');
  });

  it('decodes an anchor copied from the address bar', () => {
    expect(slugAnchor(encodeURIComponent('설치 방법'))).toBe('설치-방법');
    expect(slugAnchor('100%')).toBe('100');
  });
});

describe('headingSlugs', () => {
  it('ids a heading inside a callout or a list, and numbers across them', () => {
    // rehype-slug ids every heading wherever it sits; reading only the top
    // level reported `[[#inside]]` as a link to nothing.
    const tree = parse('# Setup\n\n> [!NOTE]\n> ## Inside\n\n- ## Setup\n\n## After');
    const slugs = headingSlugs(tree.children);

    expect(slugs.map((h) => h.slug)).toEqual(['setup', 'inside', 'setup-1', 'after']);
    expect(slugs.map((h) => h.index)).toEqual([0, undefined, undefined, 3]);
  });

  it('ids headings as rehype-slug will, numbering repeats', () => {
    const tree = parse('# Intro\n\ntext\n\n## Intro\n\n### Deep [[x|Alias]]');

    expect(headingSlugs(tree.children)).toEqual([
      { index: 0, depth: 1, slug: 'intro' },
      { index: 2, depth: 2, slug: 'intro-1' },
      { index: 3, depth: 3, slug: 'deep-alias' },
    ]);
  });
});
