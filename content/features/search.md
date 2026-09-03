---
tags:
  - search
title: Search
description: Full-text search across titles, headings, and page contents
order: 2
---

# Search

Press <kbd>⌘K</kbd> (<kbd>Ctrl K</kbd> on Windows and Linux) anywhere on the
site, or click the search box in the sidebar.

## What is searched

Every published page contributes several entries to the index:

- the page itself — title, description, and the text before its first heading
- one entry per `h2`, `h3`, and `h4` section

Because sections are indexed separately, a result links straight to the heading
that matched rather than dropping you at the top of a long page.

Code inside fenced blocks **is** indexed. Searching for a flag or an API name is
one of the main things people do in developer documentation, so `--strict` or
`generateStaticParams` will find the page that mentions it.

## Ranking

Fields are weighted, so a page whose _title_ matches outranks one that merely
mentions the words in a paragraph:

| Field       | Weight |
| ----------- | ------ |
| Title       | 4×     |
| Heading     | 3×     |
| Description | 2×     |
| Body        | 1×     |

Queries are matched with prefix and light fuzzy matching, so `deploym` finds
Deployment and `instalation` still finds Installation.

By default every word in the query must appear. If nothing matches all of them,
the search falls back to matching any of them rather than showing an empty list.

## Non-Latin content

Korean, Japanese, and Chinese are written without spaces between words, so
splitting on whitespace would index `위키문서를` as a single token and a search
for `위키` would never match it.

eziwiki indexes CJK runs as overlapping character pairs:

```
위키문서  →  위키문서, 위키, 키문, 문서
```

The same tokenisation runs over your query, so substring searches work without
a morphological analyser. The whole phrase is indexed alongside its pairs, so an
exact match still scores highest.

## How it works

The index is derived from the content and served at `/search-index.json` —
written out as a static file by the build, so it works on GitHub Pages, S3,
or any static host with no server to run and no third-party service to sign
up for. In development it is derived fresh on every request: a page you saved
a moment ago is already searchable.

The index and the search library are fetched the first time you actually search,
so readers who never open the palette never download them.

## What is excluded

[[hidden-pages|Hidden pages]] are left out of the index entirely. They are
unlisted by intent, and returning them in search would defeat that.

## Keyboard

| Key                               | Action               |
| --------------------------------- | -------------------- |
| <kbd>⌘K</kbd> / <kbd>Ctrl K</kbd> | Open or close        |
| <kbd>↑</kbd> <kbd>↓</kbd>         | Move through results |
| <kbd>↵</kbd>                      | Open the result      |
| <kbd>Esc</kbd>                    | Close                |

## Next

- [[table-of-contents]] — navigate within a page
- [[graph-and-backlinks]] — navigate between pages
