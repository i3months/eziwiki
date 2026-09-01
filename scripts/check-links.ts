#!/usr/bin/env tsx

/**
 * Reports on the shape of the link graph.
 *
 * Two kinds of finding, treated differently. An unresolved link is an error in
 * the content and `--strict` makes it fail the build, which is what CI passes.
 * A page nothing links to, or nothing links on from, is not an error — a
 * correct wiki can have either — so those are reported and never fail. They are
 * the shapes a set of documents falls into as it stops being a wiki, and
 * neither is visible from inside a single page.
 *
 * Reporting rather than failing on unresolved links by default is deliberate
 * too: a dangling link in one page is not a reason to block a deploy of the
 * other twenty, and content is often written before the page it references.
 */

import { getLinkGraph } from '../lib/graph/build';
import { getWantedPages, getWikiHealth } from '../lib/graph/health';
import { findRouteCollisions, RESERVED_SEGMENTS } from '../lib/navigation/routes';
import type { GraphNode } from '../lib/graph/build';

const strict = process.argv.includes('--strict');
const { broken, nodes, edges } = getLinkGraph();

// Checked here rather than in its own step because it is the same kind of
// finding: a reference the site cannot honour. A page at one of these
// addresses builds, is listed everywhere, and is answered by the app's own
// view — the one failure a reader cannot see from any page.
const collisions = findRouteCollisions();

if (collisions.length > 0) {
  const routes = RESERVED_SEGMENTS.map((segment) => `/${segment}/`).join(' and ');
  console.log(
    `\n🚧 ${collisions.length} page${collisions.length === 1 ? '' : 's'} at a reserved address\n`,
  );
  console.log(
    `  ${routes} are views of their own, served before any page. Rename the file or folder:\n`,
  );
  for (const path of collisions) console.log(`    content/${path}.md`);
  console.log();
}

/**
 * Prints a list of pages under a heading, or nothing when there are none.
 *
 * @param label - What the pages have in common, singular and plural
 * @param explanation - Why it is worth knowing
 * @param pages - The pages found
 */
function report(
  label: { one: string; many: string },
  explanation: string,
  pages: GraphNode[],
): void {
  if (pages.length === 0) return;

  const noun = pages.length === 1 ? label.one : label.many;

  console.log(`⚠️  ${pages.length} ${noun} — ${explanation}`);
  for (const page of pages) console.log(`     content/${page.path}.md`);
  console.log();
}

const ambiguous = broken.filter((link) => link.reason === 'ambiguous');
const anchors = broken.filter((link) => link.reason === 'anchor');
const files = broken.filter((link) => link.reason === 'file');

if (broken.length > 0) {
  console.log(`\n🔗 ${broken.length} unresolved link${broken.length === 1 ? '' : 's'}\n`);

  // Ambiguous links are a fault in the link and are listed where they are
  // written, since that is where the fix goes.
  if (ambiguous.length > 0) {
    console.log('  Ambiguous — use the full path to say which page is meant:\n');

    for (const link of ambiguous) {
      console.log(`    content/${link.from}.md`);
      console.log(`      [[${link.target}]] matches ${link.candidates?.join(', ')}`);
    }

    console.log();
  }

  // An anchor to a heading the page does not have is a fault in the link too,
  // and is listed where it is written.
  if (anchors.length > 0) {
    console.log('  Anchors — the page exists, the heading does not:\n');

    for (const link of anchors) {
      console.log(`    content/${link.from}.md`);
      console.log(`      [[${link.target}]]`);
    }

    console.log();
  }

  if (files.length > 0) {
    console.log('  Files — embedded, but not under public/:\n');

    for (const link of files) {
      console.log(`    content/${link.from}.md`);
      console.log(`      ![[${link.target}]]`);
    }

    console.log();
  }

  // A link to a page that does not exist is listed the other way round: by the
  // page being asked for, so that the report is a list of things to write
  // rather than a list of things that are wrong.
  const wanted = getWantedPages();

  if (wanted.length > 0) {
    const count = `${wanted.length} page${wanted.length === 1 ? '' : 's'}`;
    console.log(`  Wanted — ${count} linked to but not written, most-wanted first:\n`);

    for (const page of wanted) {
      const askers = page.wantedBy.length;
      console.log(`    [[${page.target}]] — wanted by ${askers} page${askers === 1 ? '' : 's'}`);
      for (const asker of page.wantedBy) console.log(`      content/${asker}.md`);
      if (page.nearest) console.log(`      did you mean [[${page.nearest}]]?`);
      console.log(`      npm run new ${page.suggestedPath}`);
      console.log();
    }
  }
} else {
  console.log(`\n🔗 Links OK — ${edges.length} links across ${nodes.length} pages\n`);
}

const { orphans, deadEnds } = getWikiHealth();

report(
  { one: 'orphaned page', many: 'orphaned pages' },
  'nothing links here, so a reader can only arrive from the sidebar',
  orphans,
);

report(
  { one: 'dead end', many: 'dead ends' },
  'no links out, so a reader arrives with nowhere to go',
  deadEnds,
);

if ((broken.length > 0 || collisions.length > 0) && strict) {
  console.error('❌ Failing because --strict was passed.\n');
  process.exit(1);
}
