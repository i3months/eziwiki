---
title: Dark Mode
description: Built-in dark mode with automatic theme switching
---

# Dark Mode

eziwiki includes a beautiful dark mode that users can toggle with a single click.

## Features

- **One-Click Toggle** - Switch themes instantly
- **Persistent Preference** - Remembers user choice
- **System Sync** - Respects OS theme preference
- **Smooth Transitions** - Animated theme changes
- **Accessible** - WCAG compliant contrast ratios

## How to Use

### Toggle Button

Click the theme toggle button in the top-right corner:

- ☀️ Light mode
- 🌙 Dark mode

### Keyboard Shortcut

Press `Ctrl/Cmd + Shift + D` to toggle (if implemented).

## Theme Colors

### Light Mode

```css
:root {
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
```

### Dark Mode

```css
.dark {
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

## Customization

### Custom Colors

Edit `styles/theme.css` to customize colors:

```css
.dark {
  /* Your custom dark mode colors */
  --color-primary: #10b981; /* Green primary */
  --color-background: #0f172a; /* Darker background */
  --color-sidebar-bg: #1e293b; /* Darker sidebar */
}
```

### Disable Dark Mode

To remove dark mode entirely:

1. Remove the theme toggle component
2. Remove `.dark` styles from `styles/theme.css`
3. Remove dark mode logic from `components/ThemeToggle.tsx`

### Force Dark Mode

To always use dark mode:

```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
```

## Implementation

### Theme Toggle Component

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Load saved theme
    const saved = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

    const initialTheme = saved || systemTheme;
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}
```

### System Preference Detection

Automatically detect user's OS theme:

```typescript
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  const newTheme = e.matches ? 'dark' : 'light';
  setTheme(newTheme);
});
```

### Persistent Storage

Theme preference is saved to localStorage:

```typescript
// Save theme
localStorage.setItem('theme', 'dark');

// Load theme
const savedTheme = localStorage.getItem('theme');
```

## Syntax Highlighting

Code blocks automatically adapt to the theme:

```typescript
// Light mode: github-light theme
// Dark mode: github-dark theme

const highlighter = await getHighlighter({
  themes: ['github-light', 'github-dark'],
  langs: ['javascript', 'typescript', ...],
});
```

## Accessibility

### Contrast Ratios

All colors meet WCAG AA standards:

- **Normal text**: 4.5:1 minimum
- **Large text**: 3:1 minimum
- **UI components**: 3:1 minimum

### Focus Indicators

Focus states are visible in both themes:

```css
button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Screen Readers

Theme toggle is properly labeled:

```tsx
<button aria-label="Toggle dark mode">{/* Icon */}</button>
```

## Best Practices

### Test Both Themes

Always test your content in both light and dark modes:

```bash
npm run dev
# Toggle theme and check:
# - Text readability
# - Image visibility
# - Code block contrast
# - Link colors
```

### Use CSS Variables

Use CSS variables instead of hardcoded colors:

```css
✅ Good:
.button {
  background: var(--color-primary);
  color: var(--color-text);
}

❌ Bad:
.button {
  background: #2563eb;
  color: #1f2937;
}
```

### Avoid Pure Black/White

Use slightly off-black and off-white for better readability:

```css
✅ Good:
--color-background: #111827;  /* Dark gray */
--color-text: #f9fafb;        /* Off-white */

❌ Bad:
--color-background: #000000;  /* Pure black */
--color-text: #ffffff;        /* Pure white */
```

### Test Images

Some images may not look good in dark mode. Consider:

```markdown
<!-- Light mode image -->

![Screenshot](/images/screenshot-light.png)

<!-- Or use CSS to adjust -->
<img src="/images/screenshot.png" class="dark:opacity-80" />
```

## Troubleshooting

### Theme Not Persisting

If theme doesn't persist across page reloads:

1. Check localStorage is enabled
2. Verify theme is saved: `localStorage.getItem('theme')`
3. Check for JavaScript errors
4. Clear browser cache

### Flash of Wrong Theme

If you see a flash of light theme on dark mode:

Add this script to `app/layout.tsx` before content:

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `
      (function() {
        const theme = localStorage.getItem('theme') || 'light';
        document.documentElement.classList.toggle('dark', theme === 'dark');
      })();
    `,
  }}
/>
```

### Colors Not Changing

If colors don't change when toggling:

1. Check `.dark` class is added to `<html>`
2. Verify CSS variables are defined
3. Check for CSS specificity issues
4. Inspect element in DevTools

## Examples

### Custom Theme Switcher

```typescript
export function ThemeSelector() {
  const themes = ['light', 'dark', 'auto'];
  const [theme, setTheme] = useState('auto');

  const applyTheme = (newTheme: string) => {
    if (newTheme === 'auto') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      document.documentElement.classList.toggle('dark', systemTheme === 'dark');
    } else {
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }
    localStorage.setItem('theme', newTheme);
  };

  return (
    <select value={theme} onChange={(e) => {
      setTheme(e.target.value);
      applyTheme(e.target.value);
    }}>
      <option value="light">☀️ Light</option>
      <option value="dark">🌙 Dark</option>
      <option value="auto">💻 System</option>
    </select>
  );
}
```

### Multiple Color Schemes

```css
/* Blue theme (default) */
:root {
  --color-primary: #2563eb;
}

/* Green theme */
.theme-green {
  --color-primary: #059669;
}

/* Purple theme */
.theme-purple {
  --color-primary: #7c3aed;
}
```

## Next Steps

- [Customize Theme Colors](/configuration/theme)
- [Learn About Syntax Highlighting](/features/syntax-highlighting)
- [Explore Hash Navigation](/features/hash-navigation)
