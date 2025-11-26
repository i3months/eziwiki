---
title: Navigation Configuration
description: Learn how to structure your wiki's navigation
---

# Navigation Configuration

The navigation array in `payload/config.ts` defines your wiki's sidebar structure.

## Basic Navigation Item

```typescript
{
  name: 'Introduction',
  path: 'intro',
}
```

- **name** - Display name in sidebar
- **path** - Path to Markdown file (without `.md` extension)

The path `'intro'` maps to `content/intro.md`.

## Nested Navigation

Create sections with children:

```typescript
{
  name: 'Getting Started',
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
}
```

The path `'getting-started/installation'` maps to `content/getting-started/installation.md`.

## Section Colors

Add background colors to sections:

```typescript
{
  name: 'API Reference',
  color: '#dbeafe',  // Light blue
  children: [
    {
      name: 'Authentication',
      path: 'api/authentication',
    },
  ],
}
```

Colors must be in hex format (`#rrggbb`).

## Unlimited Nesting

You can nest as deep as you need:

```typescript
{
  name: 'Guides',
  children: [
    {
      name: 'Advanced',
      children: [
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
}
```

## Section Headers

Items without `path` act as section headers:

```typescript
{
  name: 'Documentation',  // Not clickable, just a header
  children: [
    {
      name: 'Getting Started',
      path: 'docs/getting-started',
    },
  ],
}
```

## Hidden Pages

Hide pages from navigation but keep them accessible:

```typescript
{
  name: 'Secret Page',
  path: 'secret',
  hidden: true,
}
```

Hidden pages:

- Don't appear in sidebar
- Are still accessible via direct URL
- Useful for draft pages or unlisted content

## Emojis in Navigation

Add emojis to make navigation more visual:

```typescript
navigation: [
  {
    name: '🏠 Home',
    path: 'intro',
  },
  {
    name: '📚 Documentation',
    children: [
      {
        name: '🚀 Quick Start',
        path: 'docs/quick-start',
      },
      {
        name: '⚙️ Configuration',
        path: 'docs/configuration',
      },
    ],
  },
];
```

## Complete Example

```typescript
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
        name: 'Installation',
        path: 'getting-started/installation',
      },
      {
        name: 'Quick Start',
        path: 'getting-started/quick-start',
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
        name: 'Theme',
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
];
```

## Best Practices

### Keep It Shallow

Avoid more than 3-4 levels of nesting:

```typescript
// ✅ Good - 3 levels
Guides → Advanced → Security

// ❌ Too deep - 5 levels
Docs → Guides → Advanced → Security → Auth → OAuth
```

### Use Descriptive Names

```typescript
// ✅ Good
{ name: 'Getting Started', path: 'getting-started' }

// ❌ Too vague
{ name: 'Start', path: 'start' }
```

### Group Related Content

```typescript
{
  name: 'API Reference',
  children: [
    { name: 'Authentication', path: 'api/auth' },
    { name: 'Users', path: 'api/users' },
    { name: 'Posts', path: 'api/posts' },
  ],
}
```

### Use Colors Consistently

```typescript
// ✅ Good - consistent color scheme
{
  name: 'Tutorials',
  color: '#dbeafe',  // Blue for learning content
  children: [...]
},
{
  name: 'Reference',
  color: '#fef3c7',  // Yellow for reference content
  children: [...]
}
```

## Navigation State

Navigation state (expanded/collapsed sections) is automatically saved to localStorage and persists across page reloads.

## Next Steps

- [Customize Theme Colors](/configuration/theme)
- [Write Markdown Content](/content/markdown-basics)
- [Deploy Your Wiki](/deployment/static-export)
