---
title: Hash-based Navigation
description: Fast, client-side navigation without page reloads
---

# Hash-based Navigation

eziwiki uses hash-based URLs for instant, client-side navigation without page reloads.

## How It Works

Traditional URLs:

```
https://wiki.example.com/getting-started/installation
https://wiki.example.com/configuration/theme
```

Hash-based URLs:

```
https://wiki.example.com/#2c8f9a1b
https://wiki.example.com/#7d3e4f2a
```

Each content path is converted to a unique hash, enabling:

- **Instant navigation** - No page reloads
- **Persistent state** - Sidebar state preserved
- **Browser history** - Back/forward buttons work
- **Bookmarkable** - Share direct links to pages

## Benefits

### Lightning Fast

No server requests needed. Content loads instantly from the static bundle.

```typescript
// Traditional navigation
window.location.href = '/page'; // Full page reload

// Hash navigation
window.location.hash = '#abc123'; // Instant, no reload
```

### State Preservation

Your sidebar state (expanded/collapsed sections) persists across navigation:

```typescript
// Sidebar state stored in localStorage
{
  "sidebar-state": {
    "getting-started": true,  // Expanded
    "configuration": false     // Collapsed
  }
}
```

### Works Offline

Once loaded, the entire site works offline. No network requests for navigation.

## View All URLs

Use the built-in script to see all hash URLs:

```bash
npm run show-urls
```

Output:

```
📋 Hash-Based URLs
================================================================================
📄 intro
   → /2c8f9a1b
   → https://eziwiki.dev/2c8f9a1b

📄 getting-started/quick-start
   → /7d3e4f2a
   → https://eziwiki.dev/7d3e4f2a

🔒 [HIDDEN] secret-page
   → /9f1a2b3c
   → https://eziwiki.dev/9f1a2b3c

================================================================================
Total pages: 15
Hidden pages: 1
```

## Hidden Pages

Pages marked as `hidden: true` don't appear in the sidebar but are still accessible via their hash URL:

```typescript
// payload/config.ts
navigation: [
  {
    name: 'Secret Page',
    path: 'secret-page',
    hidden: true, // Not in sidebar
  },
];
```

Use cases:

- Draft pages
- Unlisted content
- Internal documentation
- Work-in-progress pages

Find hidden page URLs:

```bash
npm run show-urls | grep HIDDEN
```

## Internal Links

Write normal Markdown links - they're automatically converted to hash URLs:

```markdown
Check out the [Quick Start Guide](/getting-started/quick-start).
```

Becomes:

```html
<a href="#7d3e4f2a">Quick Start Guide</a>
```

## Technical Details

### Hash Generation

Paths are hashed using a deterministic algorithm:

```typescript
import { generatePathHash } from '@/lib/navigation/hash';

const hash = generatePathHash('getting-started/quick-start');
// Returns: "7d3e4f2a"
```

### Navigation State

The current page is tracked in Zustand store:

```typescript
import { useTabStore } from '@/lib/store/tabStore';

const { activeTab, setActiveTab } = useTabStore();

// Navigate to a page
setActiveTab('getting-started/quick-start');
```

### Browser Integration

Hash changes update browser history:

```typescript
// Navigate forward
window.location.hash = '#7d3e4f2a';

// Navigate back
window.history.back();

// Listen to changes
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.slice(1);
  // Load content for hash
});
```

## SEO Considerations

Hash-based navigation is client-side only. For SEO:

1. **Static Export**: All pages are pre-rendered as HTML
2. **Meta Tags**: Each page has proper meta tags
3. **Sitemap**: Generate a sitemap for search engines
4. **Open Graph**: Social sharing works correctly

Search engines see the full content, users get instant navigation.

## Comparison

| Feature     | Hash Navigation | Traditional     |
| ----------- | --------------- | --------------- |
| Speed       | Instant         | Page reload     |
| State       | Preserved       | Lost            |
| Offline     | Works           | Requires server |
| Bundle Size | Larger          | Smaller         |
| SEO         | Pre-rendered    | Native          |

## Best Practices

### Use Descriptive Paths

```typescript
✅ Good:
{ name: 'Quick Start', path: 'getting-started/quick-start' }

❌ Bad:
{ name: 'Quick Start', path: 'qs' }
```

Descriptive paths make debugging easier.

### Organize by Folder

```
content/
├── getting-started/
│   ├── installation.md
│   └── quick-start.md
├── configuration/
│   ├── payload.md
│   └── theme.md
```

Folder structure reflects navigation hierarchy.

### Test Navigation

```bash
# Start dev server
npm run dev

# Test all links
# Click through your navigation
# Use browser back/forward buttons
# Refresh pages
# Test bookmarks
```

## Troubleshooting

### Page Not Found

If a hash URL doesn't work:

1. Check the path exists in `payload/config.ts`
2. Verify the Markdown file exists
3. Run `npm run show-urls` to see all valid URLs
4. Check browser console for errors

### State Not Persisting

If sidebar state doesn't persist:

1. Check localStorage is enabled
2. Clear browser cache
3. Check for console errors
4. Verify Zustand store is working

### Links Not Working

If internal links don't work:

1. Use absolute paths: `/getting-started/quick-start`
2. Don't use relative paths: `../quick-start`
3. Match paths exactly as in `payload/config.ts`

## Next Steps

- [Learn About Dark Mode](/features/dark-mode)
- [Explore Syntax Highlighting](/features/syntax-highlighting)
- [Configure Navigation](/configuration/navigation)
