---
tags:
  - deployment
  - seo
title: GitHub Pages
description: Deploy your wiki to GitHub Pages for free
order: 3
---

# GitHub Pages

Deploy your eziwiki to GitHub Pages for free hosting.

## Prerequisites

- GitHub account
- Git repository with your wiki
- GitHub Pages enabled in repository settings

## Quick Deploy

### 1. Update Configuration

Edit `payload/config.ts`:

```typescript
global: {
  title: 'My Wiki',
  description: 'My personal knowledge base',
  baseUrl: 'https://yourusername.github.io/your-repo',
}
```

### 2. Tell the build where the site lives

A project site is served from `https://yourusername.github.io/your-repo/`, so
every path the build emits needs the `/your-repo` prefix. That prefix is read
from an environment variable at build time — nothing in `next.config.js` needs
editing, and the same project builds for the domain root when the variable is
unset:

```bash
NEXT_PUBLIC_BASE_PATH=/your-repo npm run build
```

A user site (`yourusername.github.io`) is served from the root and needs no
prefix.

### 3. Build and Deploy

```bash
# Build the site
NEXT_PUBLIC_BASE_PATH=/your-repo npm run build

# Deploy to gh-pages branch
npx gh-pages -d out
```

## Automated Deployment

### Using GitHub Actions

A project created with `npx create-eziwiki` already carries
`.github/workflows/deploy.yml`, which does all of this on every push to
`main`. If yours does not, create it:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      # Full history: pages are dated from the commit that last touched them,
      # and a shallow clone cannot say.
      - name: Checkout
        uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Setup Pages
        uses: actions/configure-pages@1f0c5cde4bc74cd7e1254d0cb4de8d49e9068c7d # v4

      - name: Install dependencies
        run: npm ci

      # A project site lives under /<repository>; a user site at the root.
      - name: Resolve base path
        id: base
        run: |
          # A repository variable BASE_PATH overrides the guess — set it to
          # "/" for a project site on a custom domain, which is served from
          # the root of that domain.
          if [ -n "${{ vars.BASE_PATH }}" ]; then
            p="${{ vars.BASE_PATH }}"
            [ "$p" = "/" ] && p=""
            echo "path=$p" >> "$GITHUB_OUTPUT"
          else
            case "${{ github.event.repository.name }}" in
              *.github.io) echo "path=" >> "$GITHUB_OUTPUT" ;;
              *) echo "path=/${{ github.event.repository.name }}" >> "$GITHUB_OUTPUT" ;;
            esac
          fi

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_BASE_PATH: ${{ steps.base.outputs.path }}

      - name: Upload artifact
        uses: actions/upload-pages-artifact@56afc609e74202658d3ffba0e8f6dda462b719fa # v3
        with:
          path: out

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e # v4
```

### Enable GitHub Pages

1. Go to repository Settings
2. Navigate to Pages section
3. Source: GitHub Actions
4. Save

### Push to Deploy

```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

Your site will be live at `https://yourusername.github.io/your-repo`

## Custom Domain

### 1. Add CNAME File

Create `public/CNAME`:

```
wiki.example.com
```

### 2. Configure DNS

Add DNS records:

```
Type    Name    Value
A       @       185.199.108.153
A       @       185.199.109.153
A       @       185.199.110.153
A       @       185.199.111.153
```

Or for subdomain:

```
Type    Name    Value
CNAME   wiki    yourusername.github.io
```

### 3. Enable HTTPS

1. Go to repository Settings → Pages
2. Check "Enforce HTTPS"
3. Wait for SSL certificate (can take up to 24 hours)

## Project vs User Site

### Project Site

- URL: `https://username.github.io/repo-name`
- Any repository
- Build with `NEXT_PUBLIC_BASE_PATH=/repo-name`

### User Site

- URL: `https://username.github.io`
- Repository must be named `username.github.io`
- No base path

## Troubleshooting

### 404 Error

Make sure the base path the site was built with matches the repository name —
`NEXT_PUBLIC_BASE_PATH=/your-repo`, with the leading slash and nothing after.
The workflow above derives it from the repository, so a renamed repository
picks up the new name on the next deploy.

### Assets Not Loading

Check that all asset paths are relative:

```markdown
✅ Good: ![Image](/images/screenshot.png)
❌ Bad: ![Image](images/screenshot.png)
```

### Build Fails

Check the Actions tab in GitHub for error logs:

```bash
# Test build locally first
npm run build
```

### Old Content Showing

Clear GitHub Pages cache:

1. Make a change
2. Push to trigger new build
3. Wait 1-2 minutes
4. Hard refresh browser (Ctrl+Shift+R)

## Manual Deployment

### Using gh-pages Package

```bash
# Install gh-pages
npm install -D gh-pages

# Add deploy script to package.json
{
  "scripts": {
    "deploy": "gh-pages -d out"
  }
}

# Build and deploy
npm run build
npm run deploy
```

### Using Git Directly

```bash
# Build the site
npm run build

# Create gh-pages branch
git checkout --orphan gh-pages

# Add built files
git add -f out
git commit -m "Deploy to GitHub Pages"

# Push to gh-pages branch
git push origin gh-pages

# Switch back to main
git checkout main
```

## Custom Domain and the Base Path

A project site on a custom domain is served from the root of that domain, so
build it without a base path — leave `NEXT_PUBLIC_BASE_PATH` unset, and set
`baseUrl` in `payload/config.ts` to the domain. With the workflow above, set a
repository variable `BASE_PATH` to `/` (Settings → Secrets and variables →
Actions → Variables) and the guess from the repository name is skipped.

## Best Practices

### Use GitHub Actions

Automated deployment is more reliable than manual deployment.

### Test Locally

Always test the production build locally:

```bash
npm run build
npx serve out
```

### Version Control

Don't commit the `out/` directory:

```gitignore
# .gitignore
out/
.next/
```

### Monitor Deployments

Check the Actions tab regularly for failed deployments.

## Limitations

- **Build Time**: 10 minutes maximum
- **Site Size**: 1 GB maximum
- **Bandwidth**: 100 GB/month soft limit
- **Builds**: 10 per hour

For larger sites, consider [Vercel](/deployment/vercel) or Netlify.

## Next Steps

- [Deploy to Vercel](/deployment/vercel)
- [Static Export](/deployment/static-export)
