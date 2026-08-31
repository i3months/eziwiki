# Changelog

Notable changes to eziwiki and `create-eziwiki`. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); before 1.0 a minor
release may change a configuration key, a frontmatter field or a `_meta.json`
setting, and every such change is listed here with what to do about it.

## Unreleased

### Changed

- **Node.js 20 or later is required.** The README said 18; the dependencies
  did not agree.
- A tag's URL is now a slug of its name: `CI/CD` lives at `/tags/ci-cd/`, where
  it used to be unreachable. A tag whose name is one lower-case word is
  unaffected.
- An alias that differs from a page, or from another alias, only in case is now
  refused at build time: on a case-insensitive host the two wrote into the same
  directory.
- `payload/config.ts` is validated strictly: an unknown key under `global`,
  `theme` or `documents` is an error rather than silently ignored.
- The GitHub Pages workflow derives the base path from the repository name.
  Set `NEXT_PUBLIC_BASE_PATH` yourself only when building elsewhere.

### Added

- `theme` in `payload/config.ts` is applied. It had been documented and
  validated, and read by nothing.
- A scaffolded project records the release it came from in `package.json`
  (`eziwiki.version`) and ships a GitHub Pages deploy workflow.
- `check:links` also reports an ordinary `[link](/page)` to a page that does
  not exist, an anchor to a heading the page does not have, and a page at an
  address the app reserves (`/graph/`, `/tags/…`). With `--strict`, as CI runs
  it, each fails the build.
- The tab strip, the search dialog, the phone drawer and the graph are usable
  from the keyboard and by a screen reader; pages print without the chrome.
- Wiki-link anchors may name the heading's text (`[[page#Heading text]]`), as
  Obsidian writes them.

### Security

- A page title or description containing `</script>` could run script from
  the page's structured-data block. Structured data is escaped for the script
  element it sits in.
- A section colour from `_meta.json` or frontmatter could carry further CSS
  declarations into the sidebar's inline style. Only a colour is accepted.
- Dependencies with published advisories were updated where no breaking
  change was involved; `next` and `pdfjs-dist` majors are pending.

### Performance

- The phone drawer's navigation and folded sidebar sections are rendered when
  they open rather than into every page's HTML; the URL map travels to the
  browser as a list of paths rather than two copies of every path. A page's
  HTML shrinks by about 1 KB per page of the site.
- The whole-site graph is laid out once, during the build, instead of in
  every reader's browser.

### Fixed

- Pages with non-ASCII file names had no "last updated" date; shallow clones
  dated every page with the newest commit.
- On macOS, a Korean file name typed on the keyboard did not match the same
  name read from the volume.
- Content pages shipped without a social image; the graph, tag and 404 pages
  claimed the home page as their canonical address.
- `editUrl` could never pass validation; a scaffolded project failed
  `type-check`; the template lockfile was rewritten by the first install.
- Callouts inside included pages, nested callouts, and callout titles with
  inline code; code fences with no language or a capitalised one; base-path
  rewriting of `video`, `iframe`, `srcset` and `poster`.
- The theme flashed light on every load for dark-mode readers.

## 0.4.0 — 2026-08-03

Last release published before this changelog was kept.
