---
title: Payload Configuration
description: Complete guide to configuring your eziwiki site
---

# Payload Configuration

The `payload/config.ts` file is the heart of your eziwiki configuration. It defines your site's metadata, navigation structure, and theme.

## Basic Structure

```typescript
import { Payload } from '@/lib/payload/types';

export const payload: Payload = {
  global: {
    // Site metadata
  },
  navigation: [
    // Navigation structure
  ],
  theme: {
    // Theme colors (optional)
  },
};
```

## Global Configuration

### Required Fields

```typescript
global: {
  title: 'My Wiki',
  description: 'My personal knowledge base',
}
```

- **title** - Your site's title (appears in browser tab and header)
- **description** - Site description for SEO

### Optional Fields

```typescript
global: {
  title: 'My Wiki',
  description: 'My personal knowledge base',
  favicon: '/favicon.svg',
  baseUrl: 'https://mywiki.com',
  seo: {
    openGraph: {
      title: 'My Wiki - Knowledge Base',
      description: 'My personal knowledge base',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'My Wiki',
        },
      ],
    },
  },
}
```

- **favicon** - Path to favicon file in `public/` directory
- **baseUrl** - Your site's URL (for SEO and Open Graph)
- **seo.openGraph** - Open Graph metadata for social sharing

## Navigation Configuration

See the [Navigation Guide](/configuration/navigation) for detailed navigation setup.

## Theme Configuration

Customize your site's colors:

```typescript
theme: {
  primary: '#2563eb',      // Primary color (links, buttons)
  secondary: '#7c3aed',    // Secondary color
  background: '#ffffff',   // Page background
  text: '#1f2937',         // Text color
  sidebarBg: '#f9fafb',    // Sidebar background
  codeBg: '#f3f4f6',       // Code block background
}
```

All theme fields are optional. If not specified, default colors are used.

See [Theme Customization](/configuration/theme) for more details.

## Complete Example

```typescript
import { Payload } from '@/lib/payload/types';

export const payload: Payload = {
  global: {
    title: 'TechCorp Documentation',
    description: 'Complete documentation for TechCorp products',
    favicon: '/favicon.svg',
    baseUrl: 'https://docs.techcorp.com',
    seo: {
      openGraph: {
        title: 'TechCorp Documentation',
        description: 'Complete documentation for TechCorp products',
        images: [
          {
            url: '/og-image.png',
            width: 1200,
            height: 630,
            alt: 'TechCorp Documentation',
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
      color: '#dbeafe',
      children: [
        {
          name: 'Installation',
          path: 'getting-started/installation',
        },
        {
          name: 'Quick Start',
          path: 'getting-started/quick-start',
        },
      ],
    },
    {
      name: 'API Reference',
      color: '#fef3c7',
      children: [
        {
          name: 'Authentication',
          path: 'api/authentication',
        },
        {
          name: 'Endpoints',
          path: 'api/endpoints',
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
```

## Validation

eziwiki validates your configuration at build time using JSON Schema:

```bash
# Validate your configuration
npm run validate:payload
```

Common validation errors:

- Missing required fields (`title`, `description`)
- Invalid navigation structure
- Invalid color format (must be hex color)
- Missing content files referenced in navigation

## Environment-Specific Configuration

You can use environment variables in your configuration:

```typescript
global: {
  title: 'My Wiki',
  description: 'My personal knowledge base',
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
}
```

## TypeScript Support

The configuration is fully typed. Your IDE will provide:

- Autocomplete for all fields
- Type checking
- Inline documentation
- Error detection

## Next Steps

- [Configure Navigation](/configuration/navigation)
- [Customize Theme](/configuration/theme)
- [Write Content](/content/markdown-basics)
