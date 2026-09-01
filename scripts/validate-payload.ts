#!/usr/bin/env tsx

/**
 * Build-time payload validation script
 * This script validates the payload configuration against the JSON Schema
 * and exits with an error code if validation fails.
 */

import { validatePayload } from '../lib/payload/validator';
import { getContentRegistry } from '../lib/content/registry';
import type { NavigationItem } from '../lib/payload/types';
import payload from '../payload/config';

/**
 * Finds pages whose file names cannot be served.
 *
 * `#`, `?` and `%` mean something in a URL, and the export writes them into
 * the directory name percent-encoded while a host decodes the request before
 * looking — so a page named `issue #1.md` builds, is listed everywhere, and
 * answers 404 from every host. A space or a non-ASCII name is fine.
 *
 * @returns Problems found, empty when none
 */
function checkFileNames(): string[] {
  return getContentRegistry()
    .docs.filter((doc) => /[#?%]/.test(doc.path))
    .map(
      (doc) =>
        `content/${doc.path}.md has a #, ? or % in its name, which no host can serve; rename it`,
    );
}

/**
 * Checks the navigation against the pages that exist.
 *
 * The schema cannot know the content. An entry naming a page that is not
 * there passed and linked to the home page; a page named twice passed and
 * became its own "next" page.
 *
 * @returns Problems found, empty when none
 */
function checkNavigation(): string[] {
  const { byPath } = getContentRegistry();
  const problems: string[] = [];
  const seen = new Set<string>();

  const walk = (items: NavigationItem[], trail: string) => {
    for (const item of items) {
      const where = `${trail}${item.name}`;
      if (item.path) {
        if (!byPath.has(item.path)) {
          problems.push(
            `navigation "${where}" names content/${item.path}.md, which does not exist`,
          );
        } else if (seen.has(item.path)) {
          problems.push(`navigation "${where}" names content/${item.path}.md a second time`);
        }
        seen.add(item.path);
      }
      if (item.children) walk(item.children, `${where} › `);
    }
  };

  walk(payload.navigation ?? [], '');
  return problems;
}

function main() {
  console.log('🔍 Validating payload configuration...\n');

  const validation = validatePayload(payload);

  if (!validation.valid) {
    console.error('❌ Payload validation failed:\n');
    validation.errors?.forEach((err) => {
      console.error(`  • ${err}`);
    });
    console.error('\nPlease fix the errors in payload/config.ts and try again.\n');
    process.exit(1);
  }

  // A wiki with no pages fails later in `next build` with a message about
  // `generateStaticParams`, which says nothing an author can act on.
  if (getContentRegistry().docs.length === 0) {
    console.error('❌ content/ has no Markdown pages. Add one, or run `npm run new intro`.\n');
    process.exit(1);
  }

  const names = checkFileNames();
  if (names.length > 0) {
    console.error('❌ Some pages cannot be served:\n');
    names.forEach((problem) => console.error(`  • ${problem}`));
    console.error();
    process.exit(1);
  }

  const navigation = checkNavigation();
  if (navigation.length > 0) {
    console.error('❌ Navigation does not match the content:\n');
    navigation.forEach((problem) => console.error(`  • ${problem}`));
    console.error('\nFix payload/config.ts and try again.\n');
    process.exit(1);
  }

  console.log('✅ Payload validation passed!\n');
  process.exit(0);
}

main();
