#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scaffold, validateProjectName } from '../lib/scaffold.mjs';

/**
 * `create-eziwiki` command line entry point.
 *
 * Deliberately non-interactive: it takes a name, writes a project, and prints
 * the next commands. Anything it could prompt for is a value the user can
 * change in `payload/config.ts` afterwards, and a prompt would only get in the
 * way of scripted use.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.resolve(HERE, '..', 'template');
// This package's own version: `npm_package_version` names the package npm was
// run from, which under `npx` is the user's project — or nothing at all.
const VERSION = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'package.json'), 'utf-8')).version;

const HELP = `
  create-eziwiki — scaffold a new eziwiki documentation site

  Usage
    $ npx create-eziwiki <project-name>

  Options
    -h, --help     Show this message
    -v, --version  Show the version

  Example
    $ npx create-eziwiki my-docs
    $ cd my-docs
    $ npm install
    $ npm run dev
`;

function main() {
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help') || args.length === 0) {
    console.log(HELP);
    process.exit(args.length === 0 ? 1 : 0);
  }

  if (args.includes('-v') || args.includes('--version')) {
    console.log(VERSION);
    process.exit(0);
  }

  const projectName = args.find((arg) => !arg.startsWith('-'));
  const check = validateProjectName(projectName);

  if (!check.valid) {
    console.error(`\n  ✖ ${check.problem}\n`);
    process.exit(1);
  }

  const targetDir = path.resolve(process.cwd(), projectName);

  let result;
  try {
    result = scaffold({ templateDir: TEMPLATE_DIR, targetDir, projectName, cliVersion: VERSION });
  } catch (error) {
    console.error(`\n  ✖ ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }

  const relative = path.relative(process.cwd(), targetDir) || '.';

  console.log(`
  ✔ Created ${projectName} (${result.files} files)

  Next steps:

    cd ${relative}
    npm install
    npm run dev

  Then edit content/ to write pages, and payload/config.ts for the title,
  navigation, and theme. \`npm run new <path>\` starts a page for you.

  A GitHub Pages deploy workflow is included — the README's Deploy section
  says how to switch it on.
`);
}

main();
