'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
} from 'lucide-react';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { useStrings } from '@/components/providers/StringsProvider';
import { format, formatBytes } from '@/lib/i18n/format';
import { asset } from '@/lib/basePath';

/**
 * The viewer for documents embedded with `![[manual.pdf]]`.
 *
 * The build emits only a `<figure>` with a link to the file inside it; this
 * mounts the viewer into that figure in the browser. Nothing here reaches a
 * reader who never meets a document — pdf.js is a megabyte of parser and is
 * imported on demand, from inside the effect, so a page without an embed never
 * asks for it.
 */

/**
 * Directory the supporting data pdf.js fetches is served from.
 *
 * Character maps, the standard font programs, and the image codecs are files
 * rather than code: pdf.js requests the ones a given document happens to need.
 * `scripts/copy-pdfjs-assets.ts` puts them there, and only when the wiki
 * actually contains a document.
 */
const PDFJS_DATA = '/pdfjs';

/** Zoom bounds and step, as multiples of the width-fitting scale. */
const ZOOM = { min: 0.5, max: 3, step: 0.25 } as const;

/**
 * How far outside the viewport a page starts rendering, as a fraction of it.
 *
 * Rendering a page costs tens of milliseconds, so waiting until it is on
 * screen shows the reader an empty box for as long as it takes to scroll one
 * page. Half a viewport of lead time is enough to be ready without rendering
 * a hundred-page document all at once.
 */
const PRERENDER_MARGIN = '50%';

/** Loaded once per session, and only once a document is actually embedded. */
let pdfjs: Promise<typeof import('pdfjs-dist')> | null = null;

/**
 * Imports pdf.js and points it at its worker.
 *
 * The worker is served from `PDFJS_DATA` rather than emitted by the bundler:
 * webpack will emit it from a `new URL(…, import.meta.url)`, but Next then
 * puts the emitted asset through the minifier, which reads the module's own
 * `import.meta` as a syntax error and fails the build.
 *
 * Staged files carry no content hash, so the version pdf.js reports is used to
 * bust the cache — an upgrade changes the URL, where the filename alone would
 * leave browsers running last release's worker against this one's parser.
 */
function loadPdfjs(): Promise<typeof import('pdfjs-dist')> {
  pdfjs ??= import('pdfjs-dist').then((mod) => {
    mod.GlobalWorkerOptions.workerSrc = `${asset(
      `${PDFJS_DATA}/pdf.worker.min.mjs`,
    )}?v=${mod.version}`;
    return mod;
  });

  return pdfjs;
}

/**
 * The line under a document's name: how big it is and how long.
 *
 * @param size - Bytes, or 0 when the build did not record it
 * @param pages - Page count, or 0 when it is not known yet
 * @returns A short label, or '' when neither is known
 */
function documentMeta(size: number, pages: number): string {
  return [size ? formatBytes(size) : null, pages ? `${pages}p` : null].filter(Boolean).join(' · ');
}

/** The name and size of a document, shown in the same place either way. */
function PdfHeading({ name, meta }: { name: string; meta: string }) {
  return (
    <div className="ezw-pdf__file">
      <FileText className="ezw-pdf__icon" aria-hidden="true" />
      <span className="ezw-pdf__name" title={name}>
        {name}
      </span>
      {meta && <span className="ezw-pdf__meta">{meta}</span>}
    </div>
  );
}

/** One page of a document, drawn when the reader is close to it. */
interface PdfPageProps {
  /** The open document */
  doc: PDFDocumentProxy;
  /** 1-based page number */
  number: number;
  /** Multiplier applied to the page's natural size */
  scale: number;
  /** Ratio to reserve space with before the page has been measured */
  aspect: number;
}

/**
 * Draws one page onto a canvas once it comes near the viewport.
 *
 * The canvas is sized in device pixels and scaled back down in CSS, so text
 * stays sharp on a retina display instead of being drawn at a third of the
 * resolution the screen can show.
 */
function PdfPage({ doc, number, scale, aspect }: PdfPageProps) {
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(false);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const element = holder.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNear(true);
      },
      // Against the scrolling box rather than the window: a page halfway down
      // a hundred-page document is nowhere near the viewport, and the question
      // being asked is how close the reader is to it.
      { root: element.parentElement, rootMargin: PRERENDER_MARGIN },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // A scale of zero means the box has not been measured yet. Drawing at a
    // guess and redrawing a moment later costs every page two renders and
    // shows the reader the wrong size in between.
    if (!near || scale <= 0) return;

    let cancelled = false;
    let task: RenderTask | null = null;

    (async () => {
      const page = await doc.getPage(number);
      if (cancelled) return;

      const target = canvas.current;
      const context = target?.getContext('2d');
      if (!target || !context) return;

      // Capped: a phone reports 3 and a page at 300% zoom would then be drawn
      // at nine times its area, which is both slower and past what the screen
      // can resolve.
      const density = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale: scale * density });

      target.width = Math.floor(viewport.width);
      target.height = Math.floor(viewport.height);
      target.style.width = `${Math.floor(viewport.width / density)}px`;
      target.style.height = `${Math.floor(viewport.height / density)}px`;

      task = page.render({ canvas: target, canvasContext: context, viewport });

      try {
        await task.promise;
        if (!cancelled) setDrawn(true);
      } catch {
        // A cancelled render rejects; so does one whose document was closed
        // underneath it. Neither is worth showing anyone.
      }
    })();

    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, number, near, scale]);

  return (
    <div
      ref={holder}
      className="ezw-pdf__page"
      data-page={number}
      // Until this page has been drawn it stands in for itself at the shape
      // page one turned out to be, so the document is the right length before
      // any of it has been rendered.
      style={drawn ? undefined : { width: '100%', aspectRatio: aspect }}
    >
      <canvas ref={canvas} />
    </div>
  );
}

/** A document embed found in the rendered page. */
interface PdfViewerProps {
  /** URL of the file, already carrying the deployment base path */
  src: string;
  /** File name, shown in the header */
  name: string;
  /** Size in bytes, shown beside the name; 0 when it was not recorded */
  size: number;
  /** Page count the build recorded, used until the document itself says */
  pages?: number;
}

/**
 * The document viewer: a toolbar, a scrolling stack of pages, and the controls
 * a reader expects to find on one.
 */
function PdfViewer({ src, name, size, pages: hinted }: PdfViewerProps) {
  const t = useStrings();
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [failed, setFailed] = useState(false);
  const [aspect, setAspect] = useState(1 / Math.SQRT2);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  // Zero until the box the pages sit in has been measured; see the effect that
  // sets it, and the guard in `PdfPage` that waits for it.
  const [fit, setFit] = useState(0);
  const [full, setFull] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let task: PDFDocumentLoadingTask | null = null;

    (async () => {
      try {
        const mod = await loadPdfjs();
        task = mod.getDocument({
          url: src,
          cMapUrl: asset(`${PDFJS_DATA}/cmaps/`),
          cMapPacked: true,
          standardFontDataUrl: asset(`${PDFJS_DATA}/standard_fonts/`),
          iccUrl: asset(`${PDFJS_DATA}/iccs/`),
          wasmUrl: asset(`${PDFJS_DATA}/wasm/`),
        });

        // v6 moved `destroy` off the document and onto the loading task,
        // which aborts the fetch and the worker together.
        const opened = await task.promise;
        if (cancelled) return;

        // Page one decides the shape every page is assumed to have until it
        // is drawn, and the natural width the fitting scale is measured from.
        const first = await opened.getPage(1);
        const viewport = first.getViewport({ scale: 1 });

        if (cancelled) return;
        setAspect(viewport.width / viewport.height);
        setDoc(opened);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      void task?.destroy();
    };
  }, [src]);

  /**
   * Keeps the width-fitting scale in step with the box the pages sit in.
   *
   * A document opens fitted to the column it was embedded in, and stays fitted
   * when the window is resized or the viewer is thrown full screen — the zoom
   * the reader chose is a multiple of this, so it survives the change.
   */
  useEffect(() => {
    const element = scroller.current;
    if (!element || !doc) return;

    let cancelled = false;

    const measure = async () => {
      const first = await doc.getPage(1);
      if (cancelled) return;

      const natural = first.getViewport({ scale: 1 }).width;
      // The gutter the stylesheet leaves around a page, so fitting the width
      // does not mean fitting it edge to edge.
      const available = element.clientWidth - 32;
      if (natural > 0 && available > 0) setFit(available / natural);
    };

    void measure();

    const observer = new ResizeObserver(() => void measure());
    observer.observe(element);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [doc]);

  /**
   * Follows the reader down the document.
   *
   * Asked of the scroll position rather than reported by the pages themselves:
   * two pages are usually both on screen, and which of them is "the page you
   * are on" is a question about where the reader is looking, not about what
   * happens to be visible. A third of the way down the box is where the eye
   * is, so the page occupying that line is the one the counter names.
   */
  useEffect(() => {
    const element = scroller.current;
    if (!element || !doc) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const mark = element.scrollTop + element.clientHeight / 3;
      let current = 1;

      for (const node of element.querySelectorAll<HTMLElement>('[data-page]')) {
        if (node.offsetTop > mark) break;
        current = Number(node.dataset.page);
      }

      setPage(current);
    };

    const onScroll = () => {
      // Scroll events outrun layout; one read per frame is both enough and all
      // the browser can show.
      if (!frame) frame = requestAnimationFrame(update);
    };

    element.addEventListener('scroll', onScroll, { passive: true });
    update();

    return () => {
      element.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [doc]);

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === root.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const goTo = useCallback((target: number) => {
    const box = scroller.current;
    const element = box?.querySelector(`[data-page="${target}"]`);
    if (!box || !element) return;

    // Scrolled by hand rather than with `scrollIntoView`, which scrolls every
    // ancestor as well — the window included, lifting the page so the
    // toolbar the reader just pressed slides out of the viewport.
    box.scrollTo({
      top: element.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void root.current?.requestFullscreen();
  }, []);

  // The build already counted the pages, so the header can say how long the
  // document is while it is still opening rather than after.
  const pages = doc?.numPages ?? hinted ?? 0;
  const meta = documentMeta(size, pages);

  return (
    <div ref={root} className="ezw-pdf__viewer" data-fullscreen={full ? '' : undefined}>
      <div className="ezw-pdf__bar">
        <PdfHeading name={name} meta={meta} />

        <div className="ezw-pdf__controls">
          {pages > 1 && (
            <div className="ezw-pdf__group">
              <button
                type="button"
                className="ezw-pdf__button"
                onClick={() => goTo(page - 1)}
                disabled={page <= 1}
                aria-label={t.pdfPrevious}
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              <span className="ezw-pdf__count" aria-live="polite">
                {format(t.pdfPageOf, { page, pages })}
              </span>
              <button
                type="button"
                className="ezw-pdf__button"
                onClick={() => goTo(page + 1)}
                disabled={page >= pages}
                aria-label={t.pdfNext}
              >
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
          )}

          <div className="ezw-pdf__group">
            <button
              type="button"
              className="ezw-pdf__button"
              onClick={() => setZoom((z) => Math.max(ZOOM.min, z - ZOOM.step))}
              disabled={!doc || zoom <= ZOOM.min}
              aria-label={t.pdfZoomOut}
            >
              <Minus aria-hidden="true" />
            </button>
            <span className="ezw-pdf__count">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              className="ezw-pdf__button"
              onClick={() => setZoom((z) => Math.min(ZOOM.max, z + ZOOM.step))}
              disabled={!doc || zoom >= ZOOM.max}
              aria-label={t.pdfZoomIn}
            >
              <Plus aria-hidden="true" />
            </button>
          </div>

          <a className="ezw-pdf__button" href={src} download aria-label={t.pdfDownload}>
            <Download aria-hidden="true" />
          </a>
          <button
            type="button"
            className="ezw-pdf__button"
            onClick={toggleFullscreen}
            aria-label={full ? t.pdfExitFullscreen : t.pdfFullscreen}
          >
            {full ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        className="ezw-pdf__scroll"
        // Focusable so the pages can be scrolled from the keyboard; a viewer
        // that can only be driven by a mouse is not one everybody can read.
        tabIndex={0}
        role="group"
        aria-label={format(t.pdfDocument, { name })}
      >
        {failed ? (
          <p className="ezw-pdf__state" role="alert">
            {t.pdfError}{' '}
            <a href={src} download>
              {t.pdfDownload}
            </a>
          </p>
        ) : !doc ? (
          <p className="ezw-pdf__state ezw-pdf__state--loading">{t.pdfLoading}</p>
        ) : (
          Array.from({ length: pages }, (_, i) => (
            <PdfPage key={i + 1} doc={doc} number={i + 1} scale={fit * zoom} aspect={aspect} />
          ))
        )}
      </div>
    </div>
  );
}

/** The first page of a document, drawn during the build. */
interface PosterImage {
  /** URL, already carrying the deployment base path */
  url: string;
  /** Natural size, so the box is the right shape before the image arrives */
  width: number;
  height: number;
}

/**
 * A document shown as its first page, with the viewer one click away.
 *
 * This is what the build's poster buys. The reader sees the document itself
 * rather than a placeholder, at the cost of one image, and pdf.js is not
 * fetched at all until they ask to read past the first page. On a page whose
 * documents are references rather than the point — an appendix, a spec linked
 * in passing — that is most readers.
 *
 * The preview stands exactly as tall as the viewer that replaces it, so
 * opening a document does not move the prose underneath it.
 */
function PdfPreview({
  src,
  name,
  meta,
  poster,
  onOpen,
}: {
  src: string;
  name: string;
  meta: string;
  poster: PosterImage;
  onOpen: () => void;
}) {
  const t = useStrings();

  return (
    <div className="ezw-pdf__viewer">
      <div className="ezw-pdf__bar">
        <PdfHeading name={name} meta={meta} />

        <div className="ezw-pdf__controls">
          <a className="ezw-pdf__button" href={src} download aria-label={t.pdfDownload}>
            <Download aria-hidden="true" />
          </a>
        </div>
      </div>

      <button
        type="button"
        className="ezw-pdf__preview"
        onClick={onOpen}
        aria-label={format(t.pdfOpen, { name })}
      >
        {/* Empty alt: the button around it carries the name, and a screen
            reader announcing both would say the document twice.

            A plain `<img>` rather than `next/image`: the site is a static
            export with optimisation off, so the component would add a wrapper
            and a loader around the same request. This is also the same element
            the build already emitted — replacing it with a different one would
            fetch the poster a second time. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="ezw-pdf__poster"
          src={poster.url}
          width={poster.width}
          height={poster.height}
          alt=""
        />
        <span className="ezw-pdf__open" aria-hidden="true">
          <Maximize2 />
          {t.pdfOpenShort}
        </span>
      </button>
    </div>
  );
}

/**
 * A document embed: its first page, and the viewer once asked for.
 *
 * Without a poster there is nothing to preview, so the viewer opens straight
 * away — which is what happens when the build ran without a canvas to draw on.
 */
function PdfEmbed({ src, name, size, pages, poster }: PdfViewerProps & { poster?: PosterImage }) {
  const [open, setOpen] = useState(!poster);

  if (!open && poster) {
    return (
      <PdfPreview
        src={src}
        name={name}
        meta={documentMeta(size, pages ?? 0)}
        poster={poster}
        onOpen={() => setOpen(true)}
      />
    );
  }

  return <PdfViewer src={src} name={name} size={size} pages={pages} />;
}

/** A figure the build emitted, and what it says about the file inside it. */
interface Embed {
  /** The figure the viewer is mounted into */
  host: HTMLElement;
  /** URL taken from the fallback link, so the base path is already applied */
  src: string;
  name: string;
  size: number;
  pages: number;
  poster?: PosterImage;
}

/**
 * Finds the document embeds on the page and mounts a viewer into each.
 *
 * The same arrangement the copy buttons use: the markup comes from the build
 * and this only brings it to life. The fallback link is read for its `href`
 * before being removed, which keeps the file's address written in exactly one
 * place — the one place `rehypeBasePath` already corrects for a deployment
 * served from a subdirectory.
 *
 * @example
 * ```tsx
 * <div dangerouslySetInnerHTML={{ __html: html }} />
 * <PdfEmbeds />
 * ```
 */
/**
 * What was read off each figure before its fallback markup was removed.
 *
 * The effect below is not otherwise repeatable: it takes the fallback out of
 * the DOM, so a second pass over the same figure finds nothing to read and
 * mounts nothing. Strict Mode makes exactly that second pass in development —
 * every embed came up empty there. Keyed by element, so a figure that arrives
 * with a new page is read afresh and one that has gone is forgotten.
 */
const extracted = new WeakMap<HTMLElement, Omit<Embed, 'host'>>();

export function PdfEmbeds() {
  const [embeds, setEmbeds] = useState<Embed[]>([]);
  // The article's markup is swapped in place on a client-side navigation, so
  // the figures on the page are not the ones this last looked at.
  const pathname = usePathname();

  useEffect(() => {
    const found: Embed[] = [];

    for (const host of document.querySelectorAll<HTMLElement>('[data-ezw-pdf]')) {
      const known = extracted.get(host);
      if (known) {
        found.push({ host, ...known });
        continue;
      }

      const fallback = host.querySelector<HTMLAnchorElement>('.ezw-pdf__fallback');
      if (!fallback) continue;

      const image = host.querySelector<HTMLImageElement>('.ezw-pdf__poster');

      const embed: Omit<Embed, 'host'> = {
        src: fallback.getAttribute('href') ?? '',
        name: host.dataset.name ?? '',
        size: Number(host.dataset.size ?? 0),
        pages: Number(host.dataset.pages ?? 0),
        poster: image
          ? {
              // `getAttribute` rather than `.src`, which resolves to an
              // absolute URL — harmless, but it would make the React-rendered
              // image look like a different one and fetch it again.
              url: image.getAttribute('src') ?? '',
              width: image.width,
              height: image.height,
            }
          : undefined,
      };

      extracted.set(host, embed);
      found.push({ host, ...embed });

      // Only now that the preview is certain to replace them: removing them
      // first and then failing would leave the reader with neither. The image
      // React renders next has the same URL, so it comes from the cache.
      fallback.remove();
      image?.remove();
    }

    // This effect exists to read the server-rendered figures, which are only
    // in the DOM after render — the one job the rule's exceptions describe.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEmbeds(found);

    return () => setEmbeds([]);
  }, [pathname]);

  return (
    <>
      {embeds.map((embed, i) =>
        createPortal(
          <PdfEmbed
            src={embed.src}
            name={embed.name}
            size={embed.size}
            pages={embed.pages}
            poster={embed.poster}
          />,
          embed.host,
          // A page may embed the same document twice, so the position in the
          // page identifies the mount where the URL would not.
          `${i}:${embed.src}`,
        ),
      )}
    </>
  );
}
