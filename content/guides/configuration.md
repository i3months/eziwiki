---
title: Configuration Guide
description: Learn how to configure your documentation site
---

# Configuration Guide

Customize your documentation site to match your needs.

## Payload Configuration

The main configuration is in `payload/config.ts`. This file defines:

- **Global settings**: Site title, description, SEO metadata
- **Navigation structure**: Hierarchical menu structure
- **Theme customization**: Color scheme

### Example Configuration

```typescript
import { Payload } from '@/lib/payload/types';

export const payload: Payload = {
  global: {
    title: 'My Documentation',
    description: 'My awesome documentation site',
    favicon: '/favicon.ico',
  },
  navigation: [
    {
      name: 'Getting Started',
      path: 'intro',
    },
    {
      name: 'Guides',
      children: [
        { name: 'Installation', path: 'guides/installation' },
        { name: 'Usage', path: 'guides/usage' },
      ],
    },
  ],
  theme: {
    primary: '#2563eb',
    secondary: '#7c3aed',
  },
};
```

## Navigation Structure

Navigation items can be nested to create a hierarchical structure:

```typescript
{
  name: 'Parent Section',
  children: [
    { name: 'Child Page', path: 'section/child' },
    {
      name: 'Nested Section',
      children: [
        { name: 'Nested Page', path: 'section/nested/page' },
      ],
    },
  ],
}
```

## Theme Customization

Customize colors by providing a theme object:

```typescript
theme: {
  primary: '#2563eb',      // Primary brand color
  secondary: '#7c3aed',    // Secondary accent color
  background: '#ffffff',   // Background color
  text: '#1f2937',         // Text color
  sidebarBg: '#f9fafb',    // Sidebar background
  codeBg: '#f3f4f6',       // Code block background
}
```

All colors must be valid hex colors (e.g., `#2563eb`).

## SEO Configuration

Add SEO metadata for better search engine visibility:

```typescript
global: {
  title: 'My Site',
  description: 'My site description',
  seo: {
    openGraph: {
      title: 'My Site',
      description: 'My site description',
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'My Site',
        },
      ],
    },
  },
}
```

## Advanced Navigation Examples

### Multi-level Nesting

Create deeply nested navigation structures:

```typescript
navigation: [
  {
    name: 'Documentation',
    children: [
      {
        name: 'Getting Started',
        children: [
          { name: 'Installation', path: 'docs/getting-started/installation' },
          { name: 'First Steps', path: 'docs/getting-started/first-steps' },
        ],
      },
      {
        name: 'Advanced',
        children: [
          { name: 'Performance', path: 'docs/advanced/performance' },
          { name: 'Security', path: 'docs/advanced/security' },
        ],
      },
    ],
  },
  {
    name: 'API Reference',
    path: 'api',
  },
];
```

### Navigation with Icons

Add icon identifiers to navigation items:

```typescript
navigation: [
  {
    name: 'Home',
    path: 'intro',
    icon: 'home',
  },
  {
    name: 'Settings',
    path: 'settings',
    icon: 'settings',
  },
];
```

## CSS Customization

Beyond theme colors, you can customize CSS in `styles/theme.css`:

```css
:root {
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'Fira Code', monospace;
  --border-radius: 0.5rem;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

.prose {
  max-width: 65ch;
  font-size: 1.125rem;
  line-height: 1.75;
}
```

## Environment Variables

Configure environment-specific settings:

```bash
# .env.local
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

Access in your code:

```typescript
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
```

## Markdown Features

### Tables

| Feature    | Supported | Notes                    |
| ---------- | --------- | ------------------------ |
| Tables     | ✅        | GitHub Flavored Markdown |
| Task Lists | ✅        | Use `- [ ]` syntax       |
| Footnotes  | ✅        | Use `[^1]` syntax        |

### Task Lists

- [x] Set up project
- [x] Configure payload
- [ ] Add custom content
- [ ] Deploy to production

### Inline Code and Links

Use `inline code` for commands and [links](https://example.com) for references.

## Validation

The payload is automatically validated at build time. If there are errors, the build will fail with clear error messages indicating what needs to be fixed.

Example validation error:

```bash
❌ Payload validation failed:
  - /navigation/0/name must be a string
  - /theme/primary must match pattern "^#[0-9A-Fa-f]{6}$"
```

Fix the errors in your `payload/config.ts` and rebuild.
