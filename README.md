<div align="center">
  <img src="eziwiki.webp" alt="EziWiki">
  <br/><hr/>
</div>

<p align="center"><em><strong>A modern, lightweight wiki and documentation generator</strong></em></p>

<p align="center">
  <a href="https://i3months.com">🌐 A site built with it</a> •
  <a href="https://eziwiki.vercel.app">🌐 Demo (Vercel)</a> •
  <a href="https://i3months.github.io/eziwiki">🌐 Demo (GitHub Pages)</a>
</p>

## Introduction

Write Markdown, get a fast static wiki.

- **A file is a page** — drop a `.md` into `content/` and it is published; folders become sections
- **Search, contents rail, wiki links, embeds, backlinks, and graph views** — built in, no configuration
- **Rendered at build time** — no Markdown parser or highlighter ships to the browser
- **Deploy anywhere** — the output is plain static files

## Requirements

- Node.js 22.13 or higher (Node 20 reached end of life in April 2026)
- npm (comes with Node.js)

## Quick Start

```bash
npx create-eziwiki my-docs
cd my-docs
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your wiki.

To work from this repository instead — with the full demo content:

```bash
git clone https://github.com/i3months/eziwiki.git
cd eziwiki
npm install
npm run dev
```

## Upgrading from an earlier version

**Page URLs changed.** Earlier versions addressed every page by a hash
(`/c432b372-e0e30267-e65e26a1`). The default is now the readable content path
(`/getting-started/quick-start`), which is indexable and shareable.

If your site is already published and you need the old links to keep working,
opt back in from `payload/config.ts`:

```typescript
global: {
  urlStrategy: 'hash',
}
```

Otherwise no action is needed — existing Markdown links keep resolving either
way, since they are written as content paths and resolved at build time.

Navigation also became optional: pages under `content/` are now discovered
automatically. An existing `navigation` array keeps working unchanged.

### Updating the engine

`npx create-eziwiki` copies the engine — `app/`, `components/`, `lib/`,
`styles/`, `scripts/` and the root config files — into your project, so an
update is a copy too. Your own work lives in `content/`, `payload/` and
`public/`, and the engine directories are best left unedited so they can be
replaced whole.

The release a project came from is recorded in its `package.json` under
`eziwiki.version`. To update:

```bash
npx create-eziwiki@latest fresh        # a new project beside yours
rm -rf app components lib styles scripts
cp -R fresh/{app,components,lib,styles,scripts} .
cp fresh/{next.config.js,tailwind.config.ts,tsconfig.json,vitest.config.ts,postcss.config.js,vercel.json} .
npm install
```

Then read the [changelog](CHANGELOG.md) for the releases in between: before
1.0, a key in `payload/config.ts`, a frontmatter field or a `_meta.json`
setting may change, and every such change is listed there with what to do
about it.

## Project Structure

```
eziwiki/
├── payload/
│   └── config.ts          # Site configuration
├── content/               # Your Markdown files
│   ├── intro.md
│   ├── guides/
│   ├── api/
│   └── tutorials/
├── public/                # Static assets
│   ├── images/
│   └── favicon.svg
├── out/                   # Built site (auto-generated)
│
├── app/                   # Next.js pages
├── components/            # React components
├── lib/                   # Core utilities
├── scripts/               # Build scripts
└── styles/                # Global styles
```

**To get started, edit:**

- `payload/config.ts` - Navigation, theme, SEO
- `content/` - Your Markdown content
- `public/` - Images and assets

**Want to customize further?** You can modify `components/`, `styles/`, and `lib/` to fit your needs.

## Configuration

### Edit `payload/config.ts`

```typescript
import { Payload } from '@/lib/payload/types';

export const payload: Payload = {
  global: {
    title: 'My Wiki',
    description: 'My personal knowledge base',
    lang: 'en', // BCP 47 tag; set it if the wiki is not in English
    baseUrl: 'https://your-site.com',
    repoUrl: 'https://github.com/you/your-wiki', // Optional; sidebar link and edit links
    urlStrategy: 'path', // 'path' (readable, SEO-friendly) | 'hash' (opaque)
    autoNavigation: true, // Discover content/ files not listed below
    favicon: '/favicon.svg', // Optional; a file under public/
    seo: {
      // Optional. Shared as the site's card wherever a page sets no `ogImage`.
      openGraph: { images: [{ url: '/og-image.svg', width: 1200, height: 630 }] },
      twitter: { card: 'summary_large_image' },
    },
  },
  // Optional. Omit it entirely and navigation is built from content/.
  navigation: [
    {
      name: 'Introduction',
      path: 'intro', // Links to content/intro.md
    },
    {
      name: 'Guides',
      color: '#fef08a', // Optional folder color
      children: [
        { name: 'Quick Start', path: 'guides/quick-start' },
        { name: 'Configuration', path: 'guides/configuration' },
      ],
    },
  ],
  // Optional. Documents shown as images of their pages rather than in the
  // viewer — for scans, which have no text to lose. See PDF Embeds below.
  documents: {
    raster: ['scans/**'],
  },
  theme: {
    // Optional - uses defaults if omitted. These set the light palette;
    // dark mode keeps its own. Also: background, text, sidebarBg, codeBg.
    primary: '#2563eb',
    secondary: '#7c3aed',
  },
};
```

### Navigation Options

Navigation is optional. Every Markdown file under `content/` is published
automatically, and any file the config does not mention is appended to the
section matching its directory. Use `navigation` only to control naming and
ordering; set `global.autoNavigation: false` to make it exhaustive instead.

Ordering and presentation can also come from the content itself:

**Frontmatter (per page):**

```markdown
---
title: Quick Start # Sidebar label; falls back to the filename
description: Get going in 5 minutes
order: 1 # Sort weight within its directory
icon: 🚀 # Shown before the label in the sidebar
hidden: true # Unlisted, not private: built and linkable, absent from the sidebar (`nav: false` means the same)
tags: [setup] # See Tags below
aliases: [guides/start] # Former paths that should keep working; see Aliases below
updated: 2026-03-14 # Overrides the commit date; see Last Updated below
ogImage: /images/quick-start.png # Social card for this page
---
```

**`_meta.json` (per directory):**

```json
{ "name": "Getting Started", "icon": "📚", "order": 1, "color": "#dbeafe", "hidden": false }
```

**Basic page:**

```typescript
{ name: 'Getting Started', path: 'intro' }
```

**Folder with children:**

```typescript
{
  name: 'Guides',
  color: '#fef08a',  // Optional
  children: [
    { name: 'Setup', path: 'guides/setup' },
  ],
}
```

**Hidden page:**

```typescript
{ name: 'Secret', path: 'private/notes', hidden: true }
```

### Add Content

Create Markdown files in `content/` matching your paths:

**`content/guides/quick-start.md`**

```markdown
---
title: Quick Start Guide
---

# Quick Start Guide

Welcome! Check out the [Configuration Guide](/guides/configuration).
```

Frontmatter is optional.

## Export

Build your wiki as static files:

```bash
npm run build
```

Deploy the `out/` directory to Netlify, Vercel, Github pages

## Features

### Search

Press <kbd>⌘K</kbd> (<kbd>Ctrl K</kbd> on Windows and Linux) anywhere, or click the
search box in the sidebar.

Full-text search covers page titles, every heading, and page contents. Results
link straight to the matching section rather than the top of the page. The index
is derived from the content at build time — in development it is fresh on
every request, so a page saved a moment ago is already searchable — and it is
searched entirely in the browser: no server, no third-party service, works on
any static host.

It is fetched the first time you search, so pages that are only read never
download it.

Korean, Japanese, and Chinese content is indexed by character bigrams, so
searching `위키` matches `위키문서를` — which whitespace tokenisation alone would
miss — and a query with a particle or an ending, `설치를` or `배포하는`, finds
what the bare word finds. A page is also found by its file name run together
(`wikilink`) and by its tags.

### Table of Contents

Every page gets an automatic contents rail on wide screens, built from its `h2`
through `h4` headings, with the current section highlighted as you scroll. It is
rendered at build time, so it is in the HTML rather than assembled by script.

### Heading Anchors

Every heading below the title carries a link to itself, shown on hover or
keyboard focus, so a section can be shared without reading an id out of the
address bar.

### Wiki Links

Link to a page by name, without knowing where it lives:

```markdown
[[quick-start]] # by file name
[[Quick Start]] # by title
[[getting-started/quick-start]] # by full path
[[quick-start#prerequisites|Step one]] # anchor and label
```

A shorthand matching several pages is refused rather than guessed at, and a
target matching nothing renders as visibly broken text instead of a dead link.
`npm run check:links` lists them all — along with an anchor naming a heading
the page does not have, an ordinary `[link](/page)` to a page that does not
exist, and a page published at an address the site keeps for itself
(`/graph/`, `/tags/…`). With `--strict`, as CI runs it, any of these fails the
build.

Rest on any wiki link and a card shows the target's title and opening lines.
Both are written onto the link during the build, so the card costs no request —
and keyboard users get it on focus, dismissed with <kbd>Esc</kbd>.

### Embeds and Transclusion

A leading `!` shows the target instead of linking to it, the way a vault does:

```markdown
![[diagram.png]] # an image from public/, by name or by path
![[diagram.png|Architecture]] # the label becomes alt text
![[manual.pdf]] # a PDF, in a viewer
![[quick-start]] # another page's text, inline
![[quick-start#prerequisites]] # just that section
```

An included page is boxed and carries a link back to where it is maintained, so
a passage can live in one document and appear wherever it is needed rather than
being copied.

Transclusion applies when the embed is alone in its paragraph — blocks cannot
sit inside a sentence — and a page cannot include itself, directly or through a
chain. Nesting stops after three levels. Included headings stay out of the
contents rail, which describes the page you are on.

### PDF Embeds

A PDF embedded on its own line is shown as its first page, drawn to WebP during
the build. Press Open and it becomes a viewer that follows the theme: pages
drawn as you reach them, a counter that follows the scroll, zoom, download, and
full screen.

pdf.js — a megabyte of parser — is fetched only when a reader actually opens a
document, so passing one by costs a single image. What the build emits is that
image and a link to the file, which is also what a reader without JavaScript is
left with.

Posters need `npm i -D @napi-rs/canvas`, which is not installed by default; the
build says so when it finds a PDF without it, and documents open either way. The
data pdf.js fetches for character maps, standard fonts, and image codecs is
staged into `public/pdfjs/` — but only when the wiki contains a PDF, so a wiki
without one deploys nothing extra.

Scans are the exception, and they opt in:

```typescript
documents: {
  raster: ['scans/**'], // paths under public/; * ** ? understood
}
```

Those documents get every page drawn instead, and are shown as those images —
no viewer, no pdf.js, no script at all. A scanned page is already a picture and
carries no text to select or search, so nothing is lost, and the demo scan is
_smaller_ that way: 247 kB as a PDF, 90 kB as images.

It stays opt-in because the same treatment ruins a text document — a six-page
text PDF of 33 kB becomes 1.3 MB of WebP and loses its text layer with it — and
nothing about a file says reliably which kind it is.

### Tags

A file sits in one folder, so the sidebar shows one arrangement. `tags` in
frontmatter give the other:

```markdown
---
title: Deploying to Vercel
tags: [deployment, hosting]
---
```

Each subject gets a page at `/tags/<name>`, `/tags` lists them all, and every
tagged page shows what it belongs to. Hidden pages stay out.

### Crawlers and Answer Engines

Every page carries a canonical URL, Open Graph and Twitter cards, `Article`
structured data, and a `BreadcrumbList` matching the trail the page actually
shows — a trail stated but not shown is the kind of mismatch that costs more
than the markup gains.

`sitemap.xml` dates each page from the commit that last touched it. That is the
whole point of the field: a sitemap that stamps every page with the moment the
site was published tells a crawler that all of it changed, every deploy, until
the crawler stops believing the field. A page with no history yet carries no
date rather than a guess, and an index page carries the newest date among the
pages it lists.

`llms.txt` is written for the other kind of reader. An answer engine arriving
at a page gets navigation it cannot use, a contents rail, a search box, and the
article somewhere inside; it has to infer what the site is and which pages
matter, and the sidebar is thirty links while the article is one. The file
states it instead — the wiki's name, what it is, and every page with a sentence
about it, in reading order:

```markdown
# My Wiki

> My personal knowledge base

## Pages

- [Quick Start](https://example.com/getting-started/quick-start/): Get going in 5 minutes.
```

It is generated from the same registry the sitemap uses, so a page added,
renamed or re-described appears there without anyone maintaining a second list.
Hidden pages are left out of both.

### Wanted Pages

A link to a page that does not exist yet is how a wiki grows: someone writes
`[[deploying to fly]]` while writing about something else, because that is when
they know the page is needed. `npm run check:links` collects those from the
other end — by the page being asked for rather than by the page asking — so the
report is a list of things to write, most-wanted first:

```
Wanted — 1 page linked to but not written, most-wanted first:

  [[Deploying to Fly]] — wanted by 2 pages
    content/deployment/static-export.md
    content/deployment/vercel.md
    npm run new deploying-to-fly
```

That last line is the whole of it. `npm run new` creates the file with its
frontmatter, at the path the link implies:

```bash
npm run new guides/deploying
npm run new "Deploying to Fly"                    # → deploying-to-fly.md
npm run new guides/setup -- --title "Set it up"   # npm needs the `--`
```

A target written as a title keeps its capitalisation, which is what makes the
link that asked for it resolve. Nothing else is needed — the page is published
on the next build. An existing file is never overwritten.

`/graph` lists the same wanted pages, so the gap is visible from the site as
well as from the terminal.

### Wiki Health

`npm run check:links` also reports the two problems a link check cannot see,
because they are about links that are missing rather than links that are wrong:
**orphans** (nothing links here) and **dead ends** (no links out). Neither fails
the build — a correct wiki can have both — but neither is visible from inside a
single page either.

### Diagrams

A ```mermaid fence is drawn during the build and arrives as an SVG — no
renderer ships to the browser, nothing shifts as the page loads, and a crawler
sees the diagram. Colours come from the stylesheet, so it follows dark mode.

`flowchart`, `sequenceDiagram`, `stateDiagram-v2`, `classDiagram` and
`erDiagram` are supported; anything else stays a code block rather than
stopping the build.

### Code Blocks

A fence can say more than its language:

````markdown
```typescript title="lib/greet.ts" {2,4-6} showLineNumbers

```
````

`title=` (or `file=`) replaces the language in the bar, since a filename says
more than "TypeScript" does. `{2,4-6}` marks the lines being discussed, so
prose does not have to ask the reader to count. `showLineNumbers` runs a gutter
down the left, drawn by a CSS counter rather than written into the markup —
which is what keeps the numbers out of what gets copied.

All of it is resolved during the build. An annotation meant for some other tool
is ignored rather than rejected, so a document written elsewhere still renders
as the code it is.

### Maths

`$…$` and `$$…$$` are typeset with [KaTeX](https://katex.org) during the build,
so the browser receives finished markup — no formula parser is downloaded and
nothing reflows once the page settles.

```markdown
The mass–energy relation is $E = mc^2$. A dollar sign that is not maths —
"costs $5 and $10" — is written `\$5`, or the text between the two becomes an
equation.

$$
\int_0^1 x^2 \, dx = \frac{1}{3}
$$
```

Inline maths sits inside a sentence; a `$$` block stands alone and is centred.
The only standing cost is KaTeX's stylesheet, 3.6 kB gzipped and shared by
every page; its fonts are fetched only by the pages that actually draw a
formula.

### GitHub Flavored Markdown

Tables, task lists, footnotes, strikethrough and bare URLs behave as they do on
GitHub:

```markdown
| Option | Default |
| ------ | ------: |
| `lang` |    `en` |

- [x] Written
- [ ] Reviewed

A claim worth sourcing[^1]. ~~Struck out.~~ <https://example.com>

[^1]: Footnotes collect at the foot of the page, each linking back.
```

Emoji shortcodes such as `:smile:` are not expanded — write the character
itself, 😊, which needs no build step and reads the same in the source file.

### Callouts

A blockquote opening with `[!KIND]` becomes a callout, using the syntax GitHub
and Obsidian share:

```markdown
> [!WARNING] Mind the gap
> A title on the marker line replaces the default.

> [!TIP]- Folded away
> A trailing `-` makes it a `<details>`, which needs no script.
```

`note`, `tip`, `important`, `warning` and `caution` each carry a colour, and
Obsidian's longer list maps onto the nearest of them. An unrecognised kind
stays an ordinary quote.

### Aliases

Pages move. Since a URL comes from a file's path, moving one breaks every link
to the old address — declare it and the old URL keeps answering:

```markdown
---
title: Setup
aliases:
  - guides/setup
---
```

Each alias is built as a page that forwards, `noindex`, with its canonical
pointing at the destination. An alias that shadows a real page, or that two
pages claim, stops the build.

### Reading Order

Every page ends with links to the previous and next page. The sequence is the
sidebar flattened, so it follows `order` and `_meta.json` without separate
configuration, and hidden pages are skipped. The links carry `rel="prev"` and
`rel="next"`.

### Interface Language

The pages are in whatever language they were written in, and so is the wiki
around them. Set `global.lang` and the search box, the contents rail, the
previous/next links and the rest follow:

```typescript
global: {
  lang: 'ko',
}
```

English and Korean are translated. Any other language writes its own words,
one key at a time, and keeps the English for whatever it leaves out:

```typescript
global: {
  lang: 'de',
  strings: { search: 'Suchen…', onThisPage: 'Auf dieser Seite' },
}
```

The keys are those of `Strings` in `lib/i18n/strings.ts`. Dates follow `lang`
too, so a Korean wiki reads `2026년 8월 3일` rather than `August 3, 2026`.

Resolved during the build and passed to the page as plain data: a reader
downloads the one language the wiki is in, not every language it has been
translated into.

### Last Updated

Every page says when it last changed. Nothing has to be maintained for that to
be true: the date comes from the last commit that touched the file, which is
the one record of a page's age that cannot fall out of step with the page.

Override it from the frontmatter when the commit is not the story — a typo
fixed today does not make a page from March any newer:

```markdown
---
updated: 2026-03-14
---
```

A page not yet committed carries no date rather than the build time, which
would claim every page was revised the moment the site was published. Since the
history is what supplies the dates, a shallow clone can only date the pages
touched within the commits it has; older ones are left undated rather than
dated wrongly. On GitHub Actions, check out with `fetch-depth: 0`; on Vercel,
set the `VERCEL_DEEP_CLONE` environment variable to `true`.

The same date reaches structured data as `dateModified`, so a reader and a
crawler are never told different things.

### Edit This Page

A wiki is worth more when whoever spots the mistake can fix it, and most of
what decides whether they do is the distance between the two. Set `repoUrl` and
every page carries a link straight to its own source:

```typescript
global: {
  repoUrl: 'https://github.com/you/your-wiki',
  editBranch: 'main', // optional; 'main' unless said otherwise
}
```

github.com and gitlab.com are recognised from the URL alone. For anything else
— a self-hosted forge, a different content directory — give the shape directly,
with `{path}` where the file goes:

```typescript
editUrl: 'https://git.example.com/wiki/-/edit/main/content/{path}';
```

Configure neither and no page offers a link, which is what a private or
unpublished wiki wants.

### Backlinks and Graph

Every page ends with the pages that link to it, gathered from both wiki links
and ordinary Markdown links, and with a small graph of its own neighbourhood:
the page, everything one link away in either direction, and the links among
those neighbours.

The `/graph` page draws the whole site — node size by link count, hover to
isolate a neighbourhood, click to navigate. It is plain SVG with a small
force-directed layout, so no charting library is downloaded anywhere.

### URL Strategies

Set `global.urlStrategy` in `payload/config.ts`:

```
'path' (default)  guides/setup → /guides/setup
'hash'            guides/setup → /c432b372-e0e30267-e65e26a1
```

`path` gives readable, indexable, shareable URLs. `hash` conceals the content
structure, at the cost of SEO and of URLs anyone can interpret — reach for it
only when obscurity is the point.

Either way, write ordinary paths in Markdown and they resolve automatically:

```markdown
[Setup Guide](/guides/setup)
```

List every page and its URL: `npm run show-urls`

### Build-Time Rendering

Markdown is compiled to HTML during the build — parsed, syntax-highlighted with
[Shiki](https://shiki.style), and link-resolved — so no Markdown parser or
highlighter is shipped to the browser. Content pages load **88 kB** of JS
instead of the 314 kB a runtime renderer required.

Shiki bundles grammars for over a hundred languages, and loading all of them
costs ~20s before the first page renders. eziwiki scans your content and loads
only the languages it actually contains, plus common defaults — initialisation
drops to under a second. Unrecognised fences render as plain text rather than
failing the build.

### Automatic Navigation

There is no navigation array to maintain — this repository's own
`payload/config.ts` has none. Pages are discovered under `content/`, grouped by
folder, and ordered by frontmatter `order` and per-folder `_meta.json`:

```json
{ "name": "📚 Getting Started", "order": 2, "color": "#dbeafe" }
```

Add a `navigation` array when you want manual control; it does not have to be
exhaustive, since undeclared pages are still discovered and appended.

## Commands

```bash
npm run dev              # Development server (rebuilds the search index and PDF assets first)
npm run build            # Build for production into out/
npm run validate:payload # Check configuration
npm run check:links      # Report unresolved links and pages worth writing (--strict fails on them)
npm run new <path>       # Create a page, frontmatter and all
npm run build:pdfjs      # Stage the document viewer's assets under public/
npm run build:pdf-images # Draw embedded PDFs' pages (needs @napi-rs/canvas)
npm run show-urls        # List every page and its URL
npm run build:template   # Rebuild the create-eziwiki template
npm test                 # Run the test suite (test:watch to keep it running)
npm run lint             # ESLint (lint:fix to repair)
npm run format           # Prettier (format:check to only report)
npm run type-check       # TypeScript
```

## Security Model

Everything under `content/` is trusted. Raw HTML in Markdown is passed through
to the page as written — it is how a video or a frame is embedded — and that
includes `<script>`. So whoever can merge content can run script on your
readers, and a wiki that accepts pull requests should review a Markdown change
the way it would review code. Titles, descriptions and section colours are
escaped or validated on their way into the page, but the body is the author's.

A hidden page is unlisted, not private: it is built, and anyone with the link
can read it. See [SECURITY.md](SECURITY.md) for how to report a problem.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

The interface is set in [Pretendard](https://github.com/orioncactus/pretendard),
which is distributed under the SIL Open Font License 1.1; its licence text
ships beside the font files in `public/fonts/Pretendard/`.
