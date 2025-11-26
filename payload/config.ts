import { Payload } from '@/lib/payload/types';

/**
 * Main payload configuration for eziwiki
 * This defines the site structure, navigation, and theme
 */
export const payload: Payload = {
  global: {
    title: 'eziwiki',
    description:
      'A beautiful, minimal wiki and documentation site generator inspired by Notion and Obsidian',
    favicon: '/favicon.svg',
    baseUrl: 'https://eziwiki.dev',
    seo: {
      openGraph: {
        title: 'eziwiki - Beautiful Documentation Made Easy',
        description:
          'A beautiful, minimal wiki and documentation site generator inspired by Notion and Obsidian',
        images: [
          {
            url: '/og-image.svg',
            width: 1200,
            height: 630,
            alt: 'eziwiki',
          },
        ],
      },
    },
  },
  navigation: [
    {
      name: '🏠 Introduction',
      path: 'intro',
    },
    {
      name: '📚 Getting Started',
      color: '#dbeafe',
      children: [
        {
          name: 'Quick Start',
          path: 'getting-started/quick-start',
        },
        {
          name: 'Installation',
          path: 'getting-started/installation',
        },
        {
          name: 'Your First Wiki',
          path: 'getting-started/first-wiki',
        },
      ],
    },
    {
      name: '⚙️ Configuration',
      color: '#fef3c7',
      children: [
        {
          name: 'Payload Config',
          path: 'configuration/payload',
        },
        {
          name: 'Navigation',
          path: 'configuration/navigation',
        },
        {
          name: 'Theme Customization',
          path: 'configuration/theme',
        },
      ],
    },
    {
      name: '✍️ Writing Content',
      color: '#e9d5ff',
      children: [
        {
          name: 'Markdown Basics',
          path: 'content/markdown-basics',
        },
        {
          name: 'Frontmatter',
          path: 'content/frontmatter',
        },
        {
          name: 'Code Blocks',
          path: 'content/code-blocks',
        },
      ],
    },
    {
      name: '🔧 Features',
      color: '#fcd34d',
      children: [
        {
          name: 'Hash-based Navigation',
          path: 'features/hash-navigation',
        },
        {
          name: 'Hidden Pages',
          path: 'features/hidden-pages',
        },
        {
          name: 'Dark Mode',
          path: 'features/dark-mode',
        },
        {
          name: 'Syntax Highlighting',
          path: 'features/syntax-highlighting',
        },
        {
          name: 'Validation & Testing',
          path: 'features/validation-testing',
        },
      ],
    },
    {
      name: '🚀 Deployment',
      color: '#fecaca',
      children: [
        {
          name: 'Static Export',
          path: 'deployment/static-export',
        },
        {
          name: 'GitHub Pages',
          path: 'deployment/github-pages',
        },
        {
          name: 'Vercel',
          path: 'deployment/vercel',
        },
      ],
    },
    {
      name: '🎨 Examples',
      color: '#d1fae5',
      children: [
        {
          name: 'Personal Wiki',
          path: 'examples/personal-wiki',
        },
        {
          name: 'API Documentation',
          path: 'examples/api-docs',
        },
        {
          name: 'Knowledge Base',
          path: 'examples/knowledge-base',
        },
      ],
    },
    {
      name: 'Secret Demo Page',
      path: 'secret-demo',
      hidden: true,
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
