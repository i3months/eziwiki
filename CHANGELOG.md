# Changelog

Notable changes to eziwiki and `create-eziwiki`. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); before 1.0 a minor
release may change a configuration key, a frontmatter field or a `_meta.json`
setting, and every such change is listed here with what to do about it.

## Unreleased

### Fixed since the last entry

- A page whose file name has a space or a character outside ASCII — every
  Korean file name — was exported as a 404 page, with the build green. Its
  address is now encoded wherever it becomes a link and decoded wherever it
  comes back, in the export and in `npm run dev` alike. A name containing
  `#`, `?` or `%` cannot be served by any host and is refused by
  `validate:payload` with the file named.
- Invalid YAML in one page's frontmatter stopped every command with a stack
  trace and no file name, and on the next run came back as an empty page.
  The error names the file.
- `hidden: yes`, and `"hidden": "false"` in `_meta.json`, did the opposite
  of what was written.
- `check:links` suggests the page a typo'd link probably meant, and lists a
  missing embedded file as a file rather than as a page to write.
- `validate:payload` refuses an empty `content/` and a navigation entry that
  names a page that does not exist, or names one twice, with a message that
  says which; a bad config value is named as `theme.primary`, in the dev
  overlay as well as the terminal.
- CI had been failing on every push: the test job's shallow clone left pages
  undated, a content-bound test shipped to scaffolded projects, and the
  lockfile written by npm 11 was refused by npm 10. All three are fixed, and
  the lockfile rule is in CONTRIBUTING.

### Search

- A Korean word with a particle or an ending — `설치를`, `배포하는` — finds
  what the bare word finds. It used to require every one of its bigrams,
  including the one straddling the particle, and found almost nothing.
- A page is found by its name run together (`wikilink`, `quickstart`) and by
  its tags; a term shorter than four letters has to match exactly, so `toc`
  no longer drifts to `to` and `too`.
- The result list marks the words that matched, not only the words typed,
  and a heading with no text of its own shows the page's description in
  place of an empty line.

### Continuous integration

- Every action is pinned to a commit; Dependabot keeps the pins current and
  sends the action updates as one pull request. Jobs time out at fifteen
  minutes, and CI can be run by hand.

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
