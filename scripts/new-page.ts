#!/usr/bin/env tsx

/**
 * Creates a page.
 *
 * A wiki grows by someone writing a link to a page that does not exist yet and
 * then, later, writing the page. `npm run check:links` reports the first half;
 * this is the second. It exists so that the gap between deciding to write a
 * page and having somewhere to write it is one command rather than a directory
 * to create, a filename convention to remember, and frontmatter to look up.
 *
 * ```bash
 * npm run new guides/deploying
 * npm run new "Quick Start"                      # becomes quick-start.md
 * npm run new guides/setup -- --title "Set up"   # npm needs the `--`
 * ```
 */

import fs from 'fs';
import path from 'path';
import { CONTENT_DIR, titleize } from '../lib/content/registry';
import { yamlScalar } from '../lib/content/frontmatter';
import { suggestPath } from '../lib/graph/health';

/**
 * Reads the arguments the script was invoked with.
 *
 * @param argv - Arguments after the script name
 * @returns The requested path and title, or null when no path was given
 */
function parseArgs(argv: string[]): { target: string; title?: string } | null {
  const positional: string[] = [];
  let title: string | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--title' || argv[i] === '-t') {
      title = argv[i + 1];
      i += 1;
      continue;
    }
    positional.push(argv[i]);
  }

  return positional[0] ? { target: positional[0], title } : null;
}

/**
 * Writes the file, refusing to disturb one that already exists.
 *
 * @param docPath - Content-relative path without extension
 * @param title - Title for the frontmatter and opening heading
 */
function create(docPath: string, title: string): void {
  const file = path.join(CONTENT_DIR, `${docPath}.md`);

  if (fs.existsSync(file)) {
    console.error(`\n❌ content/${docPath}.md already exists.\n`);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(file), { recursive: true });

  // No `order` and no `description`: both are better left out than guessed at,
  // and an unset `order` sorts the page last, which is where a page nobody has
  // placed yet belongs.
  fs.writeFileSync(file, `---\ntitle: ${yamlScalar(title)}\n---\n\n# ${title}\n\nTODO\n`, 'utf-8');
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  if (!args) {
    console.error('\nUsage: npm run new <path|title> [-- --title "Page Title"]\n');
    process.exit(1);
  }

  const docPath = suggestPath(args.target);

  if (!docPath) {
    console.error(`\n❌ "${args.target}" leaves nothing that can be a filename.\n`);
    process.exit(1);
  }

  // A target written as a title keeps its own capitalisation; one written as a
  // path has none to keep, so the filename is titled instead. It matters
  // because a wiki link resolves on the title, and `[[Deploying to Fly]]` finds
  // a page called "Deploying to Fly" more readably than "Deploying To Fly".
  // The last segment only: `guides/Quick Start` is a page called "Quick
  // Start" in guides, not a page called "guides/Quick Start".
  const written = path.basename(args.target.trim());
  const title =
    args.title ?? (args.target === docPath ? titleize(path.basename(docPath)) : written);
  create(docPath, title);

  console.log(`\n✅ content/${docPath}.md\n`);

  // The path it was created at, not the one that was asked for: a title given
  // on the command line becomes a filename, and knowing which one is what lets
  // the author link to it.
  if (docPath !== args.target) {
    console.log(`   Asked for "${args.target}", created at ${docPath}`);
  }

  console.log(`   Link to it with [[${docPath}]]`);
  console.log('   Nothing else to do — it shows on the next request in `npm run dev`,');
  console.log('   and in search after the next build.\n');
}

main();
