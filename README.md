![EziWiki](eziwiki.png)

A modern, lightweight wiki and documentation generator

## Introduction

Anyone can create beautiful documentation sites. (with just a bit of coding..)

- Write content in Markdown
- Configure navigation with TypeScript
- Deploy anywhere as static files

## Requirements

- Node.js 18.0 or higher
- npm (comes with Node.js)

## Quick Start

```bash
git clone https://github.com/yourusername/eziwiki.git
cd eziwiki
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your wiki.

## Project Structure

```
eziwiki/
├── payload/
│   └── config.ts          # Site configuration
├── content/               # Your Markdown files
│   ├── intro.md
│   ├── guides/
│   ├── api/
│   └── tutorials/
├── public/                # Static assets
│   ├── images/
│   └── favicon.svg
├── out/                   # Built site (auto-generated)
│
├── app/                   # Next.js pages
├── components/            # React components
├── lib/                   # Core utilities
├── scripts/               # Build scripts
└── styles/                # Global styles
```

**To get started, edit:**

- `payload/config.ts` - Navigation, theme, SEO
- `content/` - Your Markdown content
- `public/` - Images and assets

**Want to customize further?** You can modify `components/`, `styles/`, and `lib/` to fit your needs.

## Configuration

### Edit `payload/config.ts`

```typescript
import { Payload } from '@/lib/payload/types';

export const payload: Payload = {
  global: {
    title: 'My Wiki',
    description: 'My personal knowledge base',
    baseUrl: 'https://your-site.com',
  },
  navigation: [
    {
      name: 'Introduction',
      path: 'intro', // Links to content/intro.md
    },
    {
      name: 'Guides',
      color: '#fef08a', // Optional folder color
      children: [
        { name: 'Quick Start', path: 'guides/quick-start' },
        { name: 'Configuration', path: 'guides/configuration' },
      ],
    },
  ],
  theme: {
    // Optional - uses defaults if omitted
    primary: '#2563eb',
    secondary: '#7c3aed',
  },
};
```

### Navigation Options

**Basic page:**

```typescript
{ name: 'Getting Started', path: 'intro' }
```

**Folder with children:**

```typescript
{
  name: 'Guides',
  color: '#fef08a',  // Optional
  children: [
    { name: 'Setup', path: 'guides/setup' },
  ],
}
```

**Hidden page:**

```typescript
{ name: 'Secret', path: 'private/notes', hidden: true }
```

### Add Content

Create Markdown files in `content/` matching your paths:

**`content/guides/quick-start.md`**

```markdown
---
title: Quick Start Guide
---

# Quick Start Guide

Welcome! Check out the [Configuration Guide](/guides/configuration).
```

Frontmatter is optional.

## Export

Build your wiki as static files:

```bash
npm run build
```

Deploy the `out/` directory to Netlify, Vercel, Github pages

## Features

### Hash-Based URLs

Pages use hash URLs for privacy:

```
intro → /c432b372-e0e30267-e65e26a1
```

Write normal paths in Markdown - auto-converted:

```markdown
[Setup Guide](/guides/setup)
```

Find all URLs: `npm run show-urls`

## Commands

```bash
npm run dev              # Development server
npm run build            # Build for production
npm run validate:payload # Check configuration
npm run show-urls        # List all hash URLs
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.
