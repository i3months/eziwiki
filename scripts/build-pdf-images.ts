#!/usr/bin/env tsx

/**
 * Draws embedded PDFs to WebP at build time.
 *
 * Every document gets its first page, which is what a page shows before — and
 * for most readers instead of — the megabyte of parser the viewer needs. A
 * document named by `documents.raster` in the payload gets all of its pages
 * instead, and is then shown as those images with no viewer and no script at
 * all.
 *
 * Rasterising everything by default was measured and refused. A six-page text
 * PDF of 33 kB came to 1.3 MB of WebP — thirty-eight times the file it
 * replaces — and the pages lost their text on the way, so no selection, no
 * in-page search, and nothing for a screen reader. For a scan none of that is
 * true: the page was already a picture, and re-encoding it usually shrinks the
 * file. Which kind a document is cannot be read reliably off the file, so the
 * payload says.
 *
 * Runs before `next dev` and `next build`, and redraws only what changed.
 */

import fs from 'fs/promises';
import path from 'path';
import { payload } from '../payload/config';
import { matchesAny } from '../lib/content/glob';

/** Where images are written, relative to `public/`. */
const IMAGE_DIR = 'pdf-images';

/** Manifest the render pipeline reads to find what was drawn. */
const MANIFEST = 'index.json';

/**
 * Width a first-page poster is drawn at, in pixels.
 *
 * The article column tops out near 830 CSS pixels, so this is a little over
 * 1.4× the widest it is ever shown at — enough to stay sharp on a dense screen
 * without paying for a full 2× of a preview the reader clicks through.
 */
const POSTER_WIDTH = 1200;

/**
 * Width the pages of a rastered document are drawn at.
 *
 * Wider than a poster, because these are not a preview of the document: they
 * are the document, and they are all the reader will ever get of it.
 */
const RASTER_WIDTH = 1400;

/** WebP quality. High enough that small type stays crisp. */
const QUALITY = 82;

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const TARGET = path.join(PUBLIC_DIR, IMAGE_DIR);

/** Directories under `public/` that hold generated data rather than content. */
const SKIP = new Set([IMAGE_DIR, 'pdfjs', 'fonts']);

/** One drawn page. */
interface DrawnPage {
  url: string;
  width: number;
  height: number;
}

/** What the manifest records about one document. */
interface Entry {
  /** `poster` is the first page only; `raster` is all of them */
  mode: 'poster' | 'raster';
  /** Pages in the document, however many were drawn */
  pages: number;
  /** The images, in page order */
  images: DrawnPage[];
  /** Modification time of the PDF these were drawn from */
  source: number;
}

/**
 * Collects every PDF a page could embed.
 *
 * @param dir - Directory to search
 * @param found - Accumulator of paths relative to `public/`
 * @returns The accumulator
 */
async function findPdfs(dir: string, found: string[] = []): Promise<string[]> {
  let entries;

  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;

    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (dir === PUBLIC_DIR && SKIP.has(entry.name)) continue;
      await findPdfs(full, found);
      continue;
    }

    if (path.extname(entry.name).toLowerCase() === '.pdf') {
      found.push(path.relative(PUBLIC_DIR, full).split(path.sep).join('/'));
    }
  }

  return found;
}

/**
 * The slice of `@napi-rs/canvas` this script touches.
 *
 * Declared here rather than taken from the package's own types, because the
 * package is not a dependency of a scaffolded wiki — `build:template` drops
 * it, and says how to add it — and `typeof import(...)` made TypeScript
 * resolve a module every new project was never meant to have. `npm run
 * type-check` failed in each one, and the scaffold job in CI with it.
 */
interface CanvasModule {
  createCanvas(width: number, height: number): NativeCanvas;
  Path2D: unknown;
  DOMMatrix: unknown;
  ImageData: unknown;
}

interface NativeCanvas {
  width: number;
  height: number;
  getContext(kind: '2d'): {
    fillStyle: string;
    fillRect(x: number, y: number, width: number, height: number): void;
  };
  encode(format: 'webp', quality: number): Promise<Buffer>;
}

/**
 * Loads the canvas implementation, or reports that there is none.
 *
 * `@napi-rs/canvas` is a development dependency rather than a required one: it
 * carries a native binary, and a wiki with no PDFs in it should not be asked
 * to download one.
 *
 * @returns The module, or null when it is not installed
 */
async function loadCanvas(): Promise<CanvasModule | null> {
  // Named through a variable so the import is resolved when it runs, not
  // when the script is type-checked.
  const specifier = '@napi-rs/canvas';

  try {
    return (await import(specifier)) as CanvasModule;
  } catch {
    return null;
  }
}

/**
 * Reads the manifest written by a previous run.
 *
 * @returns What was recorded, or an empty map
 */
async function readManifest(): Promise<Record<string, Entry>> {
  try {
    return JSON.parse(await fs.readFile(path.join(TARGET, MANIFEST), 'utf-8'));
  } catch {
    return {};
  }
}

/**
 * Removes the images an entry names.
 *
 * @param entry - What was recorded for a document
 */
async function removeImages(entry: Entry): Promise<void> {
  for (const image of entry.images ?? []) {
    await fs.rm(path.join(PUBLIC_DIR, image.url.replace(/^\/+/, '')), { force: true });
  }
}

async function main() {
  const pdfs = await findPdfs(PUBLIC_DIR);

  if (pdfs.length === 0) {
    await fs.rm(TARGET, { recursive: true, force: true });
    return;
  }

  const canvasLib = await loadCanvas();

  if (!canvasLib) {
    console.log(`📄 ${pdfs.length} PDF(s) embedded, but no pages were drawn.`);
    console.log('   Install the renderer to have them:  npm i -D @napi-rs/canvas');
    console.log('   Without it a document still opens — the viewer draws its pages in');
    console.log('   the browser, which costs the reader the parser to do it. A document');
    console.log('   listed under `documents.raster` needs the renderer to be shown at all.\n');
    return;
  }

  // Narrowed once, here: the guard above proves it is loaded, but that proof
  // does not survive into the closures below.
  const canvas2d = canvasLib;

  // pdf.js builds its paths from whatever `Path2D` and `DOMMatrix` it finds as
  // globals, and the context that has to fill them belongs to the canvas
  // library. Seeding the globals from that same library is what makes the two
  // agree; without it every render throws on the first filled path.
  const globals = globalThis as Record<string, unknown>;
  globals.Path2D = canvasLib.Path2D;
  globals.DOMMatrix = canvasLib.DOMMatrix;
  globals.ImageData = canvasLib.ImageData;

  // The legacy build, because this is Node: the modern one reaches for browser
  // globals at import time and never gets as far as being asked to render.
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const standardFontDataUrl = path.join(
    path.dirname(require.resolve('pdfjs-dist/package.json')),
    'standard_fonts/',
  );

  /**
   * How pdf.js is to make scratch canvases of its own.
   *
   * It builds one whenever a page contains an image, composes the decoded
   * pixels onto it, and draws that onto the page. In a browser it would reach
   * for `document.createElement`; here there is no document, and what it
   * reached for instead took the whole process down with a segmentation fault
   * — which no `try` can catch, so a single scanned page killed the build.
   *
   * A text-only document never asks for one, which is why this went unnoticed
   * until a scan was drawn.
   */
  class NodeCanvasFactory {
    create(width: number, height: number) {
      const canvas = canvas2d.createCanvas(width || 1, height || 1);
      return { canvas, context: canvas.getContext('2d') };
    }

    reset(target: { canvas: { width: number; height: number } }, width: number, height: number) {
      target.canvas.width = width;
      target.canvas.height = height;
    }

    destroy(target: { canvas: { width: number; height: number } | null; context: unknown }) {
      if (target.canvas) {
        target.canvas.width = 0;
        target.canvas.height = 0;
      }
      target.canvas = null;
      target.context = null;
    }
  }

  const rasterPatterns = payload.documents?.raster;
  const previous = await readManifest();
  const manifest: Record<string, Entry> = {};

  let drawn = 0;
  let reused = 0;
  let bytes = 0;

  await fs.mkdir(TARGET, { recursive: true });

  for (const relative of pdfs) {
    const source = path.join(PUBLIC_DIR, relative);
    const modified = (await fs.stat(source)).mtimeMs;
    const mode = matchesAny(relative, rasterPatterns) ? 'raster' : 'poster';

    const cached = previous[relative];

    // The mode is part of what makes a drawing current: moving a document into
    // `documents.raster` changes how many pages it needs, not what is in them,
    // and comparing only the file would leave it with one.
    if (cached?.source === modified && cached.mode === mode) {
      try {
        for (const image of cached.images) {
          bytes += (await fs.stat(path.join(PUBLIC_DIR, image.url.replace(/^\/+/, '')))).size;
        }
        manifest[relative] = cached;
        reused += 1;
        continue;
      } catch {
        // Recorded but missing; fall through and draw it again.
      }
    }

    // Whatever was there was drawn under different terms. Clearing it first
    // keeps a document that used to have twelve pages from serving eleven
    // stale ones alongside its new single poster.
    if (cached) await removeImages(cached);

    const data = new Uint8Array(await fs.readFile(source));

    try {
      const task = pdfjs.getDocument({
        data,
        standardFontDataUrl,
        CanvasFactory: NodeCanvasFactory,
      });
      const doc = await task.promise;
      const count = mode === 'raster' ? doc.numPages : 1;
      const width = mode === 'raster' ? RASTER_WIDTH : POSTER_WIDTH;
      const images: DrawnPage[] = [];

      for (let number = 1; number <= count; number++) {
        const page = await doc.getPage(number);
        const natural = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: width / natural.width });

        const pixelWidth = Math.floor(viewport.width);
        const pixelHeight = Math.floor(viewport.height);

        const canvas = canvas2d.createCanvas(pixelWidth, pixelHeight);
        const context = canvas.getContext('2d');

        // A PDF page is transparent where nothing is drawn, and WebP keeps
        // that — the page would be shown against whatever is behind it, which
        // in the dark theme is nearly black text on nearly black paper.
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, pixelWidth, pixelHeight);

        // pdf.js types its render target as the DOM's canvas, which is what it
        // meets in a browser. Here it is the native one, which answers every
        // call pdf.js actually makes and none of the events and streams the
        // DOM interface also declares.
        await page.render({
          canvas: canvas as unknown as HTMLCanvasElement,
          canvasContext: context as unknown as CanvasRenderingContext2D,
          viewport,
        }).promise;

        const encoded = await canvas.encode('webp', QUALITY);
        // A single-page document would be `sample.pdf.1.webp`; the poster of a
        // hundred-page one is `manual.pdf.1.webp` too. The number is the page,
        // always, so nothing has to know the mode to find an image.
        const posterPath = `${relative}.${number}.webp`;
        const destination = path.join(TARGET, posterPath);

        await fs.mkdir(path.dirname(destination), { recursive: true });
        await fs.writeFile(destination, encoded);

        images.push({
          url: `/${IMAGE_DIR}/${posterPath}`,
          width: pixelWidth,
          height: pixelHeight,
        });

        bytes += encoded.length;
      }

      manifest[relative] = { mode, pages: doc.numPages, images, source: modified };
      // v6 moved `destroy` onto the loading task.
      await task.destroy();
      drawn += 1;
    } catch (error) {
      // One unreadable document is not a reason to fail the build. It gets no
      // images, and its viewer draws the pages in the browser instead.
      console.warn(`⚠️  Could not draw public/${relative}: ${String(error)}`);
    }
  }

  // Images whose PDF is gone would otherwise be served forever.
  for (const [stale, entry] of Object.entries(previous)) {
    if (manifest[stale]) continue;
    await removeImages(entry);
  }

  await fs.writeFile(path.join(TARGET, MANIFEST), JSON.stringify(manifest), 'utf-8');

  const rastered = Object.values(manifest).filter((entry) => entry.mode === 'raster').length;
  const parts = [`${drawn} drawn`, reused > 0 ? `${reused} unchanged` : null].filter(Boolean);

  console.log(
    `📄 PDF pages: ${parts.join(', ')}` +
      `${rastered > 0 ? `, ${rastered} shown as images` : ''} (${(bytes / 1024).toFixed(0)} kB)\n`,
  );
}

main().catch((error) => {
  console.error('❌ Failed to draw PDF pages:');
  console.error(error);
  process.exit(1);
});
