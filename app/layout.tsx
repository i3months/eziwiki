import type { Metadata } from 'next';
import './globals.css';
import '@/styles/theme.css';
import 'katex/dist/katex.min.css';
import { PageLayout } from '@/components/layout/PageLayout';
import { TabInitializer } from '@/components/layout/TabInitializer';
import { payload } from '@/payload/config';
import { validatePayload } from '@/lib/payload/validator';

// Validate payload at build time
const validation = validatePayload(payload);
if (!validation.valid) {
  console.error('❌ Payload validation failed:');
  validation.errors?.forEach((err) => console.error(`  - ${err}`));
  throw new Error('Invalid payload configuration. Please fix the errors above.');
}

// Generate metadata from payload
export const metadata: Metadata = {
  metadataBase: payload.global.baseUrl ? new URL(payload.global.baseUrl) : undefined,
  title: payload.global.title,
  description: payload.global.description,
  icons: {
    icon: payload.global.favicon || '/favicon.ico',
  },
  openGraph: payload.global.seo?.openGraph
    ? {
        title: payload.global.seo.openGraph.title || payload.global.title,
        description: payload.global.seo.openGraph.description || payload.global.description,
        images: payload.global.seo.openGraph.images,
      }
    : undefined,
  twitter: payload.global.seo?.twitter
    ? {
        card: payload.global.seo.twitter.card || 'summary_large_image',
        site: payload.global.seo.twitter.site,
        creator: payload.global.seo.twitter.creator,
        title: payload.global.seo.twitter.title || payload.global.title,
        description: payload.global.seo.twitter.description || payload.global.description,
        images: payload.global.seo.twitter.images,
      }
    : undefined,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const baseUrl = payload.global.baseUrl || 'https://example.com';

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: payload.global.title,
              description: payload.global.description,
              url: baseUrl,
            }),
          }}
        />
      </head>
      <body>
        <TabInitializer navigation={payload.navigation} />
        <PageLayout navigation={payload.navigation}>{children}</PageLayout>
      </body>
    </html>
  );
}
