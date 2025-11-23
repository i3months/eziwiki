import { Payload } from '@/lib/payload/types';

/**
 * Main payload configuration for the landing page
 * This defines the site structure, navigation, and theme
 */
export const payload: Payload = {
  global: {
    title: 'Documentation Site',
    description:
      'A beautiful documentation site built with Next.js, inspired by Notion and Obsidian',
    favicon: '/favicon.ico',
    baseUrl: 'https://i3months.com',
    seo: {
      openGraph: {
        title: 'Documentation Site - Modern Static Site Generator',
        description:
          'A beautiful documentation site built with Next.js, inspired by Notion and Obsidian',
        images: [
          {
            url: '/og-image.svg',
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
      name: '🧪 Markdown Test',
      path: 'test-all-markdown',
    },
    {
      name: 'Secret Page',
      path: 'test-sample',
      hidden: true,
    },
    {
      name: 'Empty Folder',
      children: [],
    },
    {
      name: 'Tutorials',
      color: '#fed7aa',
      children: [
        {
          name: 'Beginner',
          children: [
            {
              name: 'First Steps',
              path: 'tutorials/beginner/first-steps',
            },
          ],
        },
        {
          name: 'Intermediate',
          children: [
            {
              name: 'State Management',
              path: 'tutorials/intermediate/state-management',
            },
          ],
        },
      ],
    },
    {
      name: 'Guides',
      color: '#fef08a',
      children: [
        {
          name: 'Quick Start',
          path: 'guides/quick-start',
        },
        {
          name: 'Configuration',
          path: 'guides/configuration',
        },
        {
          name: 'Advanced',
          children: [
            {
              name: 'Deployment',
              path: 'guides/advanced/deployment',
            },
            {
              name: 'Performance',
              path: 'guides/advanced/performance',
            },
            {
              name: 'Security',
              children: [
                {
                  name: 'Authentication',
                  path: 'guides/advanced/security/authentication',
                },
                {
                  name: 'Authorization',
                  path: 'guides/advanced/security/authorization',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'API Reference',
      color: '#bfdbfe',
      children: [
        {
          name: 'Overview',
          path: 'api/overview',
        },
        {
          name: 'Endpoints',
          children: [
            {
              name: 'Users API',
              path: 'api/endpoints/users',
            },
            {
              name: 'Posts API',
              path: 'api/endpoints/posts',
            },
          ],
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
