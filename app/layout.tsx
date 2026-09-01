import type { Metadata } from 'next';
import './globals.css';
import 'katex/dist/katex.min.css';
import { PageLayout } from '@/components/layout/PageLayout';
import { TabInitializer } from '@/components/layout/TabInitializer';
import { UrlMapProvider } from '@/components/providers/UrlMapProvider';
import { StringsProvider } from '@/components/providers/StringsProvider';
import { SearchDialog } from '@/components/search/SearchDialog';
import { payload } from '@/payload/config';
import { validatePayload } from '@/lib/payload/validator';
import { getSite } from '@/lib/site';
import { themeCss } from '@/lib/theme';
import { jsonLd } from '@/lib/seo/jsonLd';
import { asset, fileUrl, pageUrl } from '@/lib/basePath';
import { packUrlMap } from '@/lib/navigation/url';

// Validate payload at build time
const validation = validatePayload(payload);
if (!validation.valid) {
  console.error('❌ Payload validation failed:');
  validation.errors?.forEach((err) => console.error(`  - ${err}`));
  // The errors travel in the message too: the dev overlay shows only this
  // string, and "see above" pointed at a terminal the author may not have.
  throw new Error(
    `payload/config.ts is invalid:\n${(validation.errors ?? []).map((err) => `  - ${err}`).join('\n')}`,
  );
}

/**
 * Rewrites configured social images to absolute URLs.
 *
 * A crawler fetching `og:image` has no page to resolve a relative path
 * against, so the value has to carry the origin and the base path. Entries
 * already absolute are left alone, which is how an image on a CDN keeps
 * working.
 *
 * @param images - `images` as written in the payload, in any form Next accepts
 * @returns The same shape with every local path made absolute
 */
function absoluteImages<T>(images: T): T {
  const toAbsolute = (image: unknown): unknown => {
    if (typeof image === 'string') return fileUrl(image, payload.global.baseUrl);
    if (image && typeof image === 'object' && 'url' in image) {
      const { url } = image as { url: string };
      return { ...image, url: fileUrl(url, payload.global.baseUrl) };
    }
    return image;
  };

  if (Array.isArray(images)) return images.map(toAbsolute) as T;
  return toAbsolute(images) as T;
}

// Generate metadata from payload
export const metadata: Metadata = {
  metadataBase: new URL(pageUrl('', payload.global.baseUrl)),
  // A template, so every route's tab and search result carries the site's
  // name once: the graph route used to append it by hand and the others not
  // at all. The home route opts out with an absolute title.
  title: { default: payload.global.title, template: `%s · ${payload.global.title}` },
  description: payload.global.description,
  icons: {
    icon: asset(payload.global.favicon || '/favicon.ico'),
  },
  // No canonical here: one on the layout is inherited by every route that
  // sets none of its own, and the graph, the tag index and the 404 page were
  // all claiming to be the home page. Each route states its own.
  openGraph: payload.global.seo?.openGraph
    ? {
        title: payload.global.seo.openGraph.title || payload.global.title,
        description: payload.global.seo.openGraph.description || payload.global.description,
        url: pageUrl('', payload.global.baseUrl),
        images: absoluteImages(payload.global.seo.openGraph.images),
      }
    : undefined,
  twitter: payload.global.seo?.twitter
    ? {
        card: payload.global.seo.twitter.card || 'summary_large_image',
        site: payload.global.seo.twitter.site,
        creator: payload.global.seo.twitter.creator,
        title: payload.global.seo.twitter.title || payload.global.title,
        description: payload.global.seo.twitter.description || payload.global.description,
        images: absoluteImages(payload.global.seo.twitter.images),
      }
    : undefined,
};

/**
 * Character ranges each font file covers.
 *
 * Pretendard carries the full Korean syllabary, which is most of its weight:
 * one weight is 750 kB whole, 27 kB once the Hangul is taken out. Splitting it
 * and declaring what each half covers lets the browser fetch only the halves a
 * page actually uses — an English page never asks for the Korean file, and a
 * Korean one pays for it once and keeps it, since `public/` is served
 * immutable.
 */
const RANGES = {
  latin:
    'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,' +
    'U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  korean: 'U+1100-11FF,U+3000-303F,U+3130-318F,U+A960-A97F,U+AC00-D7A3,U+D7B0-D7FF,U+FF00-FFEF',
} as const;

/**
 * Web fonts, declared here rather than in `globals.css`.
 *
 * A stylesheet has no way to read the deployment base path, so a hardcoded
 * `url('/fonts/…')` keeps pointing at the domain root and 404s once the site is
 * served from a subdirectory — leaving every visitor on fallback fonts. Emitting
 * the declarations from here puts them through `asset()` like every other file
 * in `public/`.
 *
 * Only the Latin halves are preloaded. Preloading the Korean ones would undo
 * the split by fetching them before anything has asked for a Korean glyph.
 */
interface FontFace {
  weight: number;
  subset: keyof typeof RANGES;
  preload?: boolean;
}

const FONT_FACES: FontFace[] = [
  { weight: 400, subset: 'latin', preload: true },
  { weight: 400, subset: 'korean' },
  { weight: 600, subset: 'latin', preload: true },
  { weight: 600, subset: 'korean' },
  { weight: 700, subset: 'latin' },
  { weight: 700, subset: 'korean' },
];

/** Where a weight-and-subset pair is served from. */
function fontFile({ weight, subset }: FontFace): string {
  return `/fonts/Pretendard/pretendard-${weight}-${subset}.woff2`;
}

const fontFaceCss = FONT_FACES.map(
  (font) =>
    `@font-face{font-family:'Pretendard';font-weight:${font.weight};` +
    `src:url('${asset(fontFile(font))}') format('woff2');font-display:swap;` +
    `unicode-range:${RANGES[font.subset]}}`,
).join('');

/** Language announced when the payload names none. */
const DEFAULT_LANG = 'en';

/**
 * Applies the reader's theme before the first paint.
 *
 * The static HTML carries no theme — it cannot know one — and the toggle
 * component only runs after the whole bundle has hydrated. Left to it, every
 * page load flashed white for a dark-mode reader; and since links inside an
 * article are plain anchors, so did every click on one. This runs inline in
 * `<head>`, so the class is on `<html>` before the body is laid out.
 *
 * Written to match what `ThemeToggle` stores: an explicit choice wins, the
 * system preference decides otherwise. Storage can throw in private windows
 * and under strict privacy settings, so the whole thing is guarded.
 */
const themeScript =
  "try{var t=localStorage.getItem('theme');" +
  "if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))" +
  "document.documentElement.classList.add('dark')}catch(e){}" +
  // Paper is white whatever the theme. Printed as it stood, a dark page put
  // near-white text on it; the class comes off for the print and goes back.
  "addEventListener('beforeprint',function(){var c=document.documentElement.classList;" +
  "if(c.contains('dark')){c.remove('dark');document.documentElement.dataset.ezwPrintDark='1'}});" +
  "addEventListener('afterprint',function(){var d=document.documentElement;" +
  "if(d.dataset.ezwPrintDark){d.classList.add('dark');delete d.dataset.ezwPrintDark}});";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const site = getSite();
  const homeUrl = pageUrl('', site.global.baseUrl);
  const theme = themeCss(site.theme);

  return (
    // The class the script above adds is not in the server markup, and React
    // would otherwise report the difference on every dark-mode load.
    <html lang={site.global.lang ?? DEFAULT_LANG} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {FONT_FACES.filter((font) => font.preload).map((font) => (
          <link
            key={fontFile(font)}
            rel="preload"
            href={asset(fontFile(font))}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        ))}
        <style dangerouslySetInnerHTML={{ __html: fontFaceCss }} />
        {theme && <style dangerouslySetInnerHTML={{ __html: theme }} />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: site.global.title,
              description: site.global.description,
              url: homeUrl,
            }),
          }}
        />
      </head>
      <body>
        {/*
          Reaching the article by keyboard otherwise means tabbing past the
          whole navigation tree — thirty-six stops on this site, on every page.
          Visible only while focused, so it costs nothing to a mouse user.
        */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-gray-900 focus:shadow-lg focus:outline focus:outline-2 focus:outline-blue-600 dark:focus:bg-gray-900 dark:focus:text-gray-100"
        >
          {site.strings.skipToContent}
        </a>
        <StringsProvider value={site.strings}>
          <UrlMapProvider value={packUrlMap(site.urlMap)}>
            <TabInitializer navigation={site.navigation} />
            <PageLayout navigation={site.navigation} repoUrl={site.global.repoUrl}>
              {children}
            </PageLayout>
            <SearchDialog />
          </UrlMapProvider>
        </StringsProvider>
      </body>
    </html>
  );
}
