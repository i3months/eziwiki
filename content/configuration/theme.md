---
title: Theme Customization
description: Customize colors and appearance of your wiki
---

# Theme Customization

eziwiki supports extensive theme customization through the payload configuration and CSS variables.

## Theme Configuration

### Basic Theme

Add a `theme` object to your `payload/config.ts`:

```typescript
export const payload: Payload = {
  global: {
    title: 'My Wiki',
    description: 'My personal knowledge base',
  },
  navigation: [...],
  theme: {
    primary: '#2563eb',
    secondary: '#7c3aed',
    background: '#ffffff',
    text: '#1f2937',
    sidebarBg: '#f9fafb',
    codeBg: '#f3f4f6',
  },
};
```

### Theme Properties

All properties are optional:

- **primary** - Primary color (links, active states)
- **secondary** - Secondary color (accents)
- **background** - Page background color
- **text** - Main text color
- **sidebarBg** - Sidebar background color
- **codeBg** - Code block background color

Colors must be in hex format: `#rrggbb`

## Built-in Dark Mode

eziwiki includes automatic dark mode support. Users can toggle between light and dark themes using the theme toggle button.

Dark mode colors are automatically adjusted, but you can customize them in `styles/theme.css`.

## Advanced Customization

### CSS Variables

For more control, edit `styles/theme.css`:

```css
:root {
  /* Light mode colors */
  --color-primary: #2563eb;
  --color-secondary: #7c3aed;
  --color-background: #ffffff;
  --color-text: #1f2937;
  --color-text-muted: #6b7280;
  --color-sidebar-bg: #f9fafb;
  --color-sidebar-hover: #f3f4f6;
  --color-code-bg: #f3f4f6;
  --color-code-text: #1f2937;
  --color-border: #e5e7eb;
}

.dark {
  /* Dark mode colors */
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
  --color-background: #111827;
  --color-text: #f9fafb;
  --color-text-muted: #9ca3af;
  --color-sidebar-bg: #1f2937;
  --color-sidebar-hover: #374151;
  --color-code-bg: #1f2937;
  --color-code-text: #f9fafb;
  --color-border: #374151;
}
```

### Typography

Customize fonts and text styles:

```css
:root {
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'Fira Code', 'Courier New', monospace;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
}
```

### Spacing

Adjust spacing and layout:

```css
:root {
  --sidebar-width: 280px;
  --content-max-width: 800px;
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}
```

## Color Schemes

### Blue Theme (Default)

```typescript
theme: {
  primary: '#2563eb',
  secondary: '#7c3aed',
  background: '#ffffff',
  text: '#1f2937',
  sidebarBg: '#f9fafb',
  codeBg: '#f3f4f6',
}
```

### Green Theme

```typescript
theme: {
  primary: '#059669',
  secondary: '#10b981',
  background: '#ffffff',
  text: '#1f2937',
  sidebarBg: '#f0fdf4',
  codeBg: '#f3f4f6',
}
```

### Purple Theme

```typescript
theme: {
  primary: '#7c3aed',
  secondary: '#a78bfa',
  background: '#ffffff',
  text: '#1f2937',
  sidebarBg: '#faf5ff',
  codeBg: '#f3f4f6',
}
```

### Dark Theme

```typescript
theme: {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  background: '#111827',
  text: '#f9fafb',
  sidebarBg: '#1f2937',
  codeBg: '#1f2937',
}
```

## Section Colors

Add colors to navigation sections:

```typescript
navigation: [
  {
    name: 'Getting Started',
    color: '#dbeafe',  // Light blue
    children: [...],
  },
  {
    name: 'API Reference',
    color: '#fef3c7',  // Light yellow
    children: [...],
  },
  {
    name: 'Examples',
    color: '#d1fae5',  // Light green
    children: [...],
  },
]
```

### Recommended Section Colors

Light, subtle colors work best:

- **Blue**: `#dbeafe`
- **Yellow**: `#fef3c7`
- **Green**: `#d1fae5`
- **Purple**: `#e9d5ff`
- **Pink**: `#fce7f3`
- **Orange**: `#fed7aa`
- **Red**: `#fecaca`

## Syntax Highlighting

Code blocks use Shiki for syntax highlighting. The theme is configured in `lib/markdown/highlighter.ts`.

Available themes:

- `github-light` (default light)
- `github-dark` (default dark)
- `nord`
- `dracula`
- `monokai`
- `one-dark-pro`

To change the theme, edit `lib/markdown/highlighter.ts`:

```typescript
const highlighter = await getHighlighter({
  themes: ['github-light', 'nord'],  // Change themes here
  langs: ['javascript', 'typescript', ...],
});
```

## Custom Fonts

### Using Google Fonts

Add to `app/layout.tsx`:

```typescript
import { Inter, Fira_Code } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
const firaCode = Fira_Code({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

### Using Local Fonts

Place fonts in `public/fonts/` and add to `styles/theme.css`:

```css
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/CustomFont.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
}

:root {
  --font-sans: 'CustomFont', system-ui, sans-serif;
}
```

## Responsive Design

eziwiki is fully responsive. Customize breakpoints in `tailwind.config.ts`:

```typescript
module.exports = {
  theme: {
    screens: {
      xs: '475px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
};
```

## Next Steps

- [Write Content](/content/markdown-basics)
- [Configure Navigation](/configuration/navigation)
- [Deploy Your Wiki](/deployment/static-export)
