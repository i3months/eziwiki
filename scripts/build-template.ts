#!/usr/bin/env tsx

/**
 * Assembles the `create-eziwiki` template from this repository.
 *
 * The engine — app, components, lib, styles, build scripts — is copied from
 * source rather than duplicated, so there is exactly one copy to maintain and
 * the scaffolded project can never drift from what is tested here. Only the
 * parts specific to *this* site (the demo content, the demo config, the
 * repository README) are replaced with starter equivalents.
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const PACKAGE_DIR = path.join(ROOT, 'packages', 'create-eziwiki');
const STARTER_DIR = path.join(PACKAGE_DIR, 'starter');
const TEMPLATE_DIR = path.join(PACKAGE_DIR, 'template');

/**
 * Engine directories copied verbatim from the repository.
 */
const ENGINE_DIRS = ['app', 'components', 'lib', 'styles', 'scripts'];

/**
 * Root files copied verbatim.
 *
 * Dotfiles are renamed on the way in, because npm strips or rewrites some of
 * them in a published tarball; `scaffold.mjs` restores the real names.
 */
const ROOT_FILES: Array<[source: string, target: string]> = [
  // Shipping the lockfile makes a scaffolded install both reproducible and
  // fast, and pins the exact dependency tree this repository tests against.
  ['package-lock.json', 'package-lock.json'],
  ['next.config.js', 'next.config.js'],
  // Vercel serves everything under public/ with `max-age=0, must-revalidate`,
  // so without this a scaffolded site revalidates each font on every page view
  // before text can render. Harmless on other hosts, which ignore the file.
  ['vercel.json', 'vercel.json'],
  ['postcss.config.js', 'postcss.config.js'],
  ['tailwind.config.ts', 'tailwind.config.ts'],
  ['tsconfig.json', 'tsconfig.json'],
  ['vitest.config.ts', 'vitest.config.ts'],
  ['next-env.d.ts', 'next-env.d.ts'],
  ['.gitignore', 'gitignore'],
  ['.eslintrc.js', 'eslintrc.js'],
  ['.eslintignore', 'eslintignore'],
  ['.prettierrc', 'prettierrc'],
  ['.prettierignore', 'prettierignore'],
];

/** Public assets copied from the repository, excluding demo imagery. */
const PUBLIC_INCLUDE = ['favicon.svg'];

/**
 * Collects the font files to ship with a scaffolded project.
 *
 * This used to grep the sources for `/fonts/…woff2` literals, because
 * `public/fonts/` held every weight of two families and copying it wholesale
 * put eight megabytes of unreferenced woff2 into the npm package. The
 * directory now holds exactly the six subsets the layout declares, and their
 * paths are assembled from a weight and a subset name rather than written out,
 * so there is no literal left to match. Reading the directory is both simpler
 * and correct: everything in it is referenced.
 *
 * @returns Paths relative to `public/`, e.g. 'fonts/Pretendard/pretendard-400-latin.woff2'
 */
function findReferencedFonts(): string[] {
  const root = path.join(ROOT, 'public', 'fonts');
  if (!fs.existsSync(root)) return [];

  const found: string[] = [];

  for (const family of fs.readdirSync(root)) {
    const dir = path.join(root, family);
    if (!fs.statSync(dir).isDirectory()) continue;

    for (const file of fs.readdirSync(dir)) {
      // The licence travels with the files it covers: the OFL requires the
      // text to accompany the fonts wherever they are redistributed.
      if (file.endsWith('.woff2') || file.endsWith('.woff') || file.startsWith('LICENSE')) {
        found.push(`fonts/${family}/${file}`);
      }
    }
  }

  return found.sort();
}

/**
 * Files excluded from the engine copy.
 *
 * Tests of the demo content assert against pages the starter does not have, so
 * shipping them would hand every new project a failing suite. The engine's own
 * unit tests travel with it; content-dependent ones do not.
 */
const EXCLUDE_FILES = new Set([
  'scripts/build-template.ts',
  'lib/content/registry.test.ts',
  'lib/navigation/auto.test.ts',
  'lib/graph/build.test.ts',
  'lib/search/build.test.ts',
  'lib/search/client.test.ts',
  'lib/markdown/render.test.ts',
  'lib/markdown/render.hash.test.ts',
  // Asserts that this repository's pages are dated from its commits. A
  // scaffolded project has no history yet, and often no repository at all.
  'lib/content/lastModified.test.ts',
  // The same, one step further out: the sitemap's dates come from those
  // commits, so a project without them has every entry undated — correctly,
  // and these would call it a failure.
  'app/sitemap.test.ts',
  // Both count the demo content. A starter has two pages, no hidden ones, and
  // no document with enough headings to satisfy them.
  'lib/content/llms.test.ts',
  'lib/markdown/headings.test.ts',
]);

/** Directories never copied. */
const SKIP_DIRS = new Set(['node_modules', '.next', 'out']);

/**
 * Recursively copies a directory, honouring the exclusion lists.
 *
 * @param from - Absolute source directory
 * @param to - Absolute destination directory
 * @param relativeBase - Path relative to the repository root, for exclusions
 * @returns Number of files copied
 */
function copyDir(from: string, to: string, relativeBase: string): number {
  let count = 0;

  fs.mkdirSync(to, { recursive: true });

  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;

    const relative = path.posix.join(relativeBase, entry.name);
    if (EXCLUDE_FILES.has(relative)) continue;

    const source = path.join(from, entry.name);
    const destination = path.join(to, entry.name);

    if (entry.isDirectory()) {
      count += copyDir(source, destination, relative);
    } else if (entry.isFile()) {
      fs.copyFileSync(source, destination);
      count += 1;
    }
  }

  return count;
}

/**
 * Builds the package.json shipped inside the template.
 *
 * Scripts and dependencies come from the repository so a scaffolded project
 * builds with exactly the versions tested here.
 */
function buildTemplateManifest(): Record<string, unknown> {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));

  const scripts = { ...pkg.scripts };
  // Only meaningful inside this repository.
  delete scripts['build:template'];

  const devDependencies = { ...pkg.devDependencies };
  // A native binary, some seven megabytes of it, whose only job is drawing the
  // pages of an embedded PDF. Most wikis have no PDF in them and would be
  // downloading it to do nothing. `build:pdf-images` says how to add it, and
  // says so only to someone who has actually embedded a document.
  delete devDependencies['@napi-rs/canvas'];

  return {
    name: 'my-wiki',
    version: '0.1.0',
    private: true,
    description: 'Documentation site built with eziwiki',
    scripts,
    dependencies: pkg.dependencies,
    devDependencies,
    engines: pkg.engines,
  };
}

function main() {
  fs.rmSync(TEMPLATE_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEMPLATE_DIR, { recursive: true });

  let files = 0;

  for (const dir of ENGINE_DIRS) {
    const source = path.join(ROOT, dir);
    if (!fs.existsSync(source)) continue;
    files += copyDir(source, path.join(TEMPLATE_DIR, dir), dir);
  }

  for (const [source, target] of ROOT_FILES) {
    const from = path.join(ROOT, source);
    if (!fs.existsSync(from)) continue;

    fs.copyFileSync(from, path.join(TEMPLATE_DIR, target));
    files += 1;
  }

  // Selected public assets; the demo screenshots and images stay behind.
  const publicDir = path.join(TEMPLATE_DIR, 'public');
  fs.mkdirSync(path.join(publicDir, 'images'), { recursive: true });

  for (const entry of PUBLIC_INCLUDE) {
    const from = path.join(ROOT, 'public', entry);
    if (!fs.existsSync(from)) continue;

    if (fs.statSync(from).isDirectory()) {
      files += copyDir(from, path.join(publicDir, entry), `public/${entry}`);
    } else {
      fs.copyFileSync(from, path.join(publicDir, entry));
      files += 1;
    }
  }

  // Only the font weights the stylesheet declares.
  const fonts = findReferencedFonts();

  for (const font of fonts) {
    const from = path.join(ROOT, 'public', font);
    if (!fs.existsSync(from)) {
      console.warn(`⚠️  Stylesheet references a missing font: public/${font}`);
      continue;
    }

    const to = path.join(publicDir, font);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
    files += 1;
  }

  console.log(`   fonts: ${fonts.length} files (weights and licence)`);

  // Keep the images directory present in the tarball.
  fs.writeFileSync(path.join(publicDir, 'images', '.gitkeep'), '', 'utf-8');

  // Starter content and config replace this site's own.
  files += copyDir(STARTER_DIR, TEMPLATE_DIR, 'starter');

  fs.writeFileSync(
    path.join(TEMPLATE_DIR, 'package.json'),
    `${JSON.stringify(buildTemplateManifest(), null, 2)}\n`,
    'utf-8',
  );
  files += 1;

  // The lockfile records the source repository's name at its root; leave it
  // matching the template manifest so npm does not have to reconcile the two.
  const lockPath = path.join(TEMPLATE_DIR, 'package-lock.json');
  if (fs.existsSync(lockPath)) {
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));

    lock.name = 'my-wiki';
    lock.version = '0.1.0';
    if (lock.packages?.['']) {
      lock.packages[''].name = 'my-wiki';
      lock.packages[''].version = '0.1.0';
      // The root entry mirrors the manifest field by field; anything the
      // manifest lacks, or has that the lock does not, is rewritten by the
      // first install.
      delete lock.packages[''].license;
      lock.packages[''].engines = pkg.engines;

      // The manifest above dropped `@napi-rs/canvas`; the lockfile has to
      // agree, or the first `npm install` in a new project rewrites it — the
      // spurious first diff the scaffolder exists to prevent — and an older
      // npm refuses `npm ci` outright.
      delete lock.packages[''].devDependencies?.['@napi-rs/canvas'];
      for (const key of Object.keys(lock.packages)) {
        if (key.startsWith('node_modules/@napi-rs/canvas')) delete lock.packages[key];
      }
    }

    fs.writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`, 'utf-8');
  }

  console.log(`📦 Template built: ${files} files → packages/create-eziwiki/template\n`);
}

main();
