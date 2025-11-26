---
title: Hidden Pages
description: Create unlisted pages accessible only via direct links
---

# Hidden Pages

Create pages that don't appear in the sidebar but are still accessible via their URL.

## What are Hidden Pages?

Hidden pages are:

- **Not visible** in the sidebar navigation
- **Fully accessible** via direct URL
- **Indexed** by search engines (if you want)
- **Included** in the static build

Perfect for:

- Draft content
- Unlisted documentation
- Internal notes
- Work-in-progress pages
- Private links

## How to Create Hidden Pages

### Basic Hidden Page

Add `hidden: true` to any navigation item:

```typescript
// payload/config.ts
navigation: [
  {
    name: 'Public Page',
    path: 'public-page',
  },
  {
    name: 'Secret Page',
    path: 'secret-page',
    hidden: true, // Won't appear in sidebar
  },
];
```

### Hidden Page in Folder

```typescript
navigation: [
  {
    name: 'Documentation',
    children: [
      {
        name: 'Getting Started',
        path: 'docs/getting-started',
      },
      {
        name: 'Draft Guide',
        path: 'docs/draft-guide',
        hidden: true, // Hidden within folder
      },
    ],
  },
];
```

### Multiple Hidden Pages

```typescript
navigation: [
  {
    name: 'Public Content',
    path: 'intro',
  },
  {
    name: 'Draft 1',
    path: 'drafts/draft-1',
    hidden: true,
  },
  {
    name: 'Draft 2',
    path: 'drafts/draft-2',
    hidden: true,
  },
  {
    name: 'Internal Notes',
    path: 'internal/notes',
    hidden: true,
  },
];
```

## Finding Hidden Page URLs

Use the built-in script to find all hidden page URLs:

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

📄 public-page
   → /7d3e4f2a
   → https://eziwiki.dev/7d3e4f2a

🔒 [HIDDEN] secret-page
   → /9f1a2b3c
   → https://eziwiki.dev/9f1a2b3c

🔒 [HIDDEN] drafts/draft-1
   → /4e5f6a7b
   → https://eziwiki.dev/4e5f6a7b

================================================================================
Total pages: 4
Hidden pages: 2

💡 Tip: Hidden pages are not shown in the sidebar but can be accessed via their hash URL.
```

## Accessing Hidden Pages

### Direct URL

Share the hash URL directly:

```
https://your-wiki.com/#9f1a2b3c
```

### Internal Links

Link to hidden pages from other pages:

```markdown
Check out the [draft guide](/drafts/draft-guide).
```

The link works even though the page is hidden from the sidebar.

### Bookmarks

Users can bookmark hidden pages for quick access.

## Use Cases

### 1. Draft Content

Keep drafts accessible but not visible:

```typescript
{
  name: 'New Feature Draft',
  path: 'drafts/new-feature',
  hidden: true,
}
```

Share the URL with reviewers before publishing.

### 2. Internal Documentation

Team-only pages:

```typescript
{
  name: 'Internal Processes',
  path: 'internal/processes',
  hidden: true,
}
{
  name: 'Team Notes',
  path: 'internal/team-notes',
  hidden: true,
}
```

### 3. Deprecated Content

Keep old content accessible but hidden:

```typescript
{
  name: 'Old API v1 Docs',
  path: 'api/v1/deprecated',
  hidden: true,
}
```

Existing links still work, but new users don't see it.

### 4. Easter Eggs

Fun hidden content:

```typescript
{
  name: 'Secret Page',
  path: 'secrets/easter-egg',
  hidden: true,
}
```

### 5. Testing Pages

Test pages during development:

```typescript
{
  name: 'Test Page',
  path: 'test/experimental',
  hidden: true,
}
```

## Content File

Hidden pages need a Markdown file like any other page:

```markdown
---
title: Secret Page
description: This page is hidden from the sidebar
---

# Secret Page

This page is hidden from the sidebar but accessible via direct link.

You can include any content here:

- Text
- Images
- Code blocks
- Links

[Back to home](/intro)
```

## Visibility Control

### Show in Sidebar

Remove `hidden: true`:

```typescript
// Before (hidden)
{
  name: 'Draft Guide',
  path: 'guides/draft',
  hidden: true,
}

// After (visible)
{
  name: 'Draft Guide',
  path: 'guides/draft',
}
```

### Hide from Sidebar

Add `hidden: true`:

```typescript
// Before (visible)
{
  name: 'Old Content',
  path: 'old/content',
}

// After (hidden)
{
  name: 'Old Content',
  path: 'old/content',
  hidden: true,
}
```

## SEO Considerations

### Hidden ≠ Private

Hidden pages are:

- ✅ Included in the static build
- ✅ Accessible to anyone with the URL
- ✅ Indexed by search engines (by default)
- ❌ NOT password protected
- ❌ NOT truly private

### Prevent Search Indexing

To prevent search engines from indexing hidden pages, add to frontmatter:

```markdown
---
title: Secret Page
robots: noindex, nofollow
---

# Secret Page

This page won't be indexed by search engines.
```

Or add to the page's `<head>`:

```html
<meta name="robots" content="noindex, nofollow" />
```

### True Privacy

For truly private content:

- Use authentication
- Host on a private server
- Use password protection
- Don't include in the build

Hidden pages are **unlisted**, not **private**.

## Best Practices

### Use Descriptive Names

Even though hidden, use clear names:

```typescript
✅ Good:
{
  name: 'Draft: New Feature Guide',
  path: 'drafts/new-feature-guide',
  hidden: true,
}

❌ Bad:
{
  name: 'Draft',
  path: 'draft',
  hidden: true,
}
```

### Organize Hidden Pages

Group hidden pages in folders:

```
content/
├── drafts/
│   ├── feature-1.md
│   └── feature-2.md
├── internal/
│   ├── team-notes.md
│   └── processes.md
└── deprecated/
    └── old-api.md
```

### Document Hidden Pages

Keep a list of hidden pages and their purpose:

```typescript
// Hidden pages for internal use:
// - drafts/new-feature: Draft of upcoming feature
// - internal/processes: Team processes (share with team)
// - test/experimental: Testing new layouts
```

### Clean Up Regularly

Review and remove unused hidden pages:

```bash
# Find all hidden pages
npm run show-urls | grep HIDDEN

# Remove if no longer needed
rm content/drafts/old-draft.md
```

## Troubleshooting

### Hidden Page Shows in Sidebar

Check that `hidden: true` is set:

```typescript
{
  name: 'Page',
  path: 'page',
  hidden: true,  // Make sure this is present
}
```

### Can't Access Hidden Page

1. Get the URL: `npm run show-urls`
2. Check the Markdown file exists
3. Verify the path matches exactly
4. Rebuild: `npm run build`

### Hidden Page Not in Build

Hidden pages are included in the build. If missing:

1. Check the Markdown file exists
2. Verify path in `payload/config.ts`
3. Run validation: `npm run validate:payload`
4. Check build output for errors

## Examples

### Draft Section

```typescript
navigation: [
  {
    name: 'Documentation',
    children: [
      { name: 'Getting Started', path: 'docs/getting-started' },
      { name: 'API Reference', path: 'docs/api' },
    ],
  },
  // Hidden drafts
  {
    name: 'Draft: Advanced Guide',
    path: 'drafts/advanced-guide',
    hidden: true,
  },
  {
    name: 'Draft: Troubleshooting',
    path: 'drafts/troubleshooting',
    hidden: true,
  },
];
```

### Internal Wiki

```typescript
navigation: [
  // Public pages
  {
    name: 'Public Documentation',
    children: [{ name: 'Overview', path: 'public/overview' }],
  },
  // Internal pages (hidden)
  {
    name: 'Team Processes',
    path: 'internal/processes',
    hidden: true,
  },
  {
    name: 'Meeting Notes',
    path: 'internal/meeting-notes',
    hidden: true,
  },
  {
    name: 'Credentials',
    path: 'internal/credentials',
    hidden: true,
  },
];
```

### Version Migration

```typescript
navigation: [
  // Current version
  {
    name: 'API v2',
    children: [
      { name: 'Overview', path: 'api/v2/overview' },
      { name: 'Endpoints', path: 'api/v2/endpoints' },
    ],
  },
  // Old version (hidden but accessible)
  {
    name: 'API v1 (Deprecated)',
    path: 'api/v1/overview',
    hidden: true,
  },
];
```

## Comparison

| Feature            | Hidden Page | Regular Page |
| ------------------ | ----------- | ------------ |
| In sidebar         | ❌ No       | ✅ Yes       |
| Accessible via URL | ✅ Yes      | ✅ Yes       |
| In build           | ✅ Yes      | ✅ Yes       |
| Searchable         | ✅ Yes\*    | ✅ Yes       |
| Linkable           | ✅ Yes      | ✅ Yes       |

\*Unless you add `noindex` meta tag

## Live Demo

Want to see a hidden page in action? We have a secret demo page!

Run this command to find it:

```bash
npm run show-urls | grep "secret-demo"
```

Or check the [Hash Navigation guide](/features/hash-navigation) for hints on how to find it. 😉

## Next Steps

- [Learn About Hash Navigation](/features/hash-navigation)
- [Configure Navigation](/configuration/navigation)
- [Explore Validation Tools](/features/validation-testing)
