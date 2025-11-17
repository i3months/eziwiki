---
title: Quick Start Guide
description: Get up and running quickly
---

# Quick Start Guide

Get your documentation site up and running in minutes.

## Installation

First, clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/your-docs.git
cd your-docs
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your site.

## Project Structure

```
your-docs/
├── app/              # Next.js App Router pages
├── components/       # React components
├── content/          # Your Markdown content
├── lib/              # Utility functions
├── payload/          # Site configuration
└── public/           # Static assets
```

## Adding Content

1. Create a new Markdown file in the `content/` directory
2. Add frontmatter with title and description
3. Write your content in Markdown
4. Update the navigation in `payload/config.ts`

Example:

```markdown
---
title: My New Page
description: A description of my page
---

# My New Page

Your content here...
```

## Building for Production

Build the static site:

```bash
npm run build
```

The output will be in the `out/` directory, ready to deploy to any static hosting service.

## Deployment

Deploy to various platforms:

### Vercel

```bash
npm install -g vercel
vercel --prod
```

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=out
```

### GitHub Pages

Add to your `package.json`:

```json
{
  "scripts": {
    "deploy": "next build && touch out/.nojekyll && gh-pages -d out -t true"
  }
}
```

Then run:

```bash
npm run deploy
```

## Customizing Components

You can customize the appearance by modifying components. Here's an example of a custom component:

```tsx
import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, variant = 'primary' }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors';
  const variantClasses =
    variant === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : 'bg-gray-200 text-gray-800 hover:bg-gray-300';

  return (
    <button className={`${baseClasses} ${variantClasses}`} onClick={onClick}>
      {label}
    </button>
  );
};
```

## Tips and Tricks

- Use frontmatter in your Markdown files for metadata
- Organize content in folders that match your navigation structure
- Test your build locally before deploying
- Use relative links between pages for better navigation
