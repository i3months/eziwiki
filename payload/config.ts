import { Payload } from '@/lib/payload/types';

/**
 * Main payload configuration for the landing page
 * This defines the site structure, navigation, and theme
 */
export const payload: Payload = {
  global: {
    title: 'Documentation Site',
    description: 'A beautiful documentation site built with Next.js',
    favicon: '/favicon.ico',
    baseUrl: 'https://example.com',
    seo: {
      openGraph: {
        title: 'Documentation Site',
        description: 'A beautiful documentation site built with Next.js',
        images: [
          {
            url: '/og-image.jpg',
            width: 1200,
            height: 630,
            alt: 'Documentation Site',
          },
        ],
      },
    },
  },
  navigation: [
    {
      name: 'Introduction',
      path: 'intro',
    },
    {
      name: 'Getting Started',
      children: [
        {
          name: 'Quick Start',
          path: 'guides/quick-start',
        },
        {
          name: 'Configuration',
          path: 'guides/configuration',
        },
      ],
    },
  ],
  theme: {
    primary: '#2563eb',
    secondary: '#7c3aed',
    background: '#ffffff',
    text: '#1f2937',
    sidebarBg: '#f9fafb',
    codeBg: '#f3f4f6',
  },
};

export default payload;
