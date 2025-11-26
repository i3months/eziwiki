---
title: Quick Start
description: Get up and running with eziwiki in 5 minutes
---

# Quick Start

![eziwiki](/images/eziwiki.png)

Get your wiki up and running in less than 5 minutes!

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Basic knowledge of Markdown

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/eziwiki.git
cd eziwiki
```

## Step 2: Install Dependencies

```bash
npm install
```

Or with yarn:

```bash
yarn install
```

## Step 3: Start Development Server

```bash
npm run dev
```

Your wiki will be available at [http://localhost:3000](http://localhost:3000)

## Step 4: Customize Your Wiki

### Edit the Configuration

Open `payload/config.ts` and customize your wiki:

```typescript
export const payload: Payload = {
  global: {
    title: 'My Awesome Wiki',
    description: 'My personal knowledge base',
  },
  navigation: [
    {
      name: 'Home',
      path: 'intro',
    },
  ],
};
```

### Add Your Content

Create Markdown files in the `content/` directory:

```markdown
---
title: My First Page
description: This is my first wiki page
---

# My First Page

Welcome to my wiki!
```

## Step 5: Build for Production

When you're ready to deploy:

```bash
npm run build
```

This generates a static site in the `out/` directory.

## Next Steps

- [Learn about configuration options](/configuration/payload)
- [Explore navigation setup](/configuration/navigation)
- [Customize your theme](/configuration/theme)
- [Deploy your wiki](/deployment/static-export)

## Common Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Preview production build

# Quality
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run test         # Run tests

# Validation
npm run validate:payload  # Validate configuration
```

That's it! You're ready to start building your wiki. 🎉
