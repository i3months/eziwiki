---
title: GitHub Pages
description: Deploy your wiki to GitHub Pages for free
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

### 2. Update next.config.js

```javascript
const nextConfig = {
  output: 'export',
  basePath: '/your-repo', // Your repository name
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
```

### 3. Build and Deploy

```bash
# Build the site
npm run build

# Deploy to gh-pages branch
npx gh-pages -d out
```

## Automated Deployment

### Using GitHub Actions

Create `.github/workflows/deploy.yml`:

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

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: ./out

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
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
- Requires `basePath` in config

### User Site

- URL: `https://username.github.io`
- Repository must be named `username.github.io`
- No `basePath` needed

## Troubleshooting

### 404 Error

Make sure `basePath` in `next.config.js` matches your repository name:

```javascript
basePath: '/your-repo',  // Must match repo name
```

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

## Environment-Specific Config

Use environment variables:

```javascript
// next.config.js
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  basePath: isProd ? '/your-repo' : '',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
```

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

For larger sites, consider [Vercel](/deployment/vercel) or [Netlify](/deployment/netlify).

## Next Steps

- [Configure Custom Domain](/deployment/custom-domain)
- [Deploy to Vercel](/deployment/vercel)
- [Optimize Performance](/guides/performance)
