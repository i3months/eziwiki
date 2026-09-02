---
title: Writing Pages
description: Frontmatter, links, code, and everything else a page can contain
order: 1
---

# Writing Pages

## Frontmatter

Every page can start with a frontmatter block. All of it is optional.

```markdown
---
title: Writing Pages # Sidebar label; defaults to the file name
description: What this page covers # Used for SEO and search results
order: 1 # Sort weight within its folder
hidden: false # true keeps it out of the sidebar and search
---
```

## Organising pages

Folders become sidebar sections. To name or order one, add a `_meta.json`
beside its pages:

```json
{ "name": "📖 Guides", "order": 1, "color": "#dbeafe" }
```

Files and folders starting with `_` or `.` are skipped, so drafts can live in
`content/_drafts/` without being published.

## Linking

Ordinary Markdown links work with content paths:

```markdown
[Welcome](/intro)
```

Wiki links resolve by full path, file name, or page title — so you can link to
a page without knowing where it sits:

```markdown
[[intro]] [[Writing Pages]] [[guides/writing|see the guide]] [[intro#next]]
```

A link that resolves to nothing is shown as visibly broken rather than as a
dead link. Run `npm run check:links` to list them all.

## Code

Fenced blocks are highlighted at build time and get a copy button:

```typescript
export function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

## Maths

Inline $E = mc^2$ and display maths both render:

$$
\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}
$$

## Tables and task lists

| Feature | Included |
| ------- | -------- |
| Search  | Yes      |
| Graph   | Yes      |

- [x] Write a page
- [ ] Publish it

## Back

Return to [[intro]].

## Callouts

A blockquote that opens with a marker becomes a callout. The syntax is
GitHub's and Obsidian's, so it reads as a plain quote anywhere else:

> [!TIP]
> `note`, `tip`, `important`, `warning` and `caution` each get their own
> colour, and `> [!note]- Title` folds away.

## Tags

Add `tags: [setup, reference]` to a page's frontmatter and the tags appear
under its title, each linking to a page listing everything that shares it.
The index lives at [/tags](/tags/).

## Embedding files

`![[diagram.png]]` shows an image from `public/`, `![[spec.pdf]]` opens a
document viewer right in the page, and `![[intro]]` includes another page's
text — `![[intro#Getting started]]` just that section.

## Starting a page

`npm run new guides/deploying` creates the file, frontmatter and all, and
tells you how to link to it. `npm run check:links` lists the pages your
links are already asking for, most-wanted first.
