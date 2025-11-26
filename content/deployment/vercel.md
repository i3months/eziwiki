---
title: Deploy to Vercel
description: Deploy your eziwiki to Vercel in minutes
---

# Deploy to Vercel

![eziwiki](/images/eziwiki.png)

Vercel is the easiest way to deploy your eziwiki with zero configuration.

## Quick Deploy

### Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

Follow the prompts and your site will be live in seconds!

### Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Click "Deploy"

That's it! Vercel automatically detects Next.js and configures everything.

## Automatic Deployments

### Production Deployments

Every push to your main branch triggers a production deployment:

```bash
git push origin main
```

Your site updates automatically at `your-project.vercel.app`

### Preview Deployments

Every pull request gets a unique preview URL:

```bash
git checkout -b feature-branch
git push origin feature-branch
```

Create a PR and get a preview link like `your-project-git-feature-branch.vercel.app`

## Custom Domain

### 1. Add Domain

In Vercel dashboard:

1. Go to Project Settings → Domains
2. Add your domain: `wiki.example.com`
3. Follow DNS instructions

### 2. Configure DNS

Add DNS records provided by Vercel:

```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

### 3. Enable HTTPS

Vercel automatically provisions SSL certificates. HTTPS is enabled by default.

## Environment Variables

### Add Variables

In Vercel dashboard:

1. Go to Project Settings → Environment Variables
2. Add variables:

```
NEXT_PUBLIC_BASE_URL=https://wiki.example.com
```

### Use in Code

```typescript
// payload/config.ts
global: {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
}
```

## Build Configuration

### vercel.json

Create `vercel.json` for custom configuration:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "out",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

### Build Settings

In Vercel dashboard:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `out`
- **Install Command**: `npm install`

## Performance Optimization

### Edge Network

Vercel automatically deploys to a global edge network for fast loading worldwide.

### Automatic Caching

Static assets are cached automatically:

- HTML: Cached with revalidation
- JS/CSS: Cached with long expiry
- Images: Optimized and cached

### Analytics

Enable Vercel Analytics:

```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

## Deployment Workflow

### Development

```bash
# Work locally
npm run dev

# Commit changes
git add .
git commit -m "Update content"
```

### Preview

```bash
# Create feature branch
git checkout -b new-feature

# Push to get preview
git push origin new-feature
```

Create PR to get preview URL.

### Production

```bash
# Merge to main
git checkout main
git merge new-feature
git push origin main
```

Automatic production deployment!

## Rollback

### Using Dashboard

1. Go to Deployments
2. Find previous deployment
3. Click "Promote to Production"

### Using CLI

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

## Monitoring

### Deployment Logs

View logs in Vercel dashboard:

1. Go to Deployments
2. Click on a deployment
3. View build and runtime logs

### Real-time Logs

```bash
# Stream logs
vercel logs
```

## Team Collaboration

### Add Team Members

1. Go to Project Settings → Team
2. Invite members
3. Set permissions (Viewer, Developer, Admin)

### Protected Branches

Configure branch protection:

1. Go to Git → Branch Protection
2. Require reviews before merging
3. Require status checks

## Vercel Features

### Instant Rollback

One-click rollback to any previous deployment.

### Preview Comments

Comment on preview deployments directly in GitHub PRs.

### Automatic HTTPS

Free SSL certificates for all domains.

### Global CDN

Deploy to 100+ edge locations worldwide.

### Zero Config

Works out of the box with Next.js.

## Pricing

### Hobby (Free)

- Unlimited deployments
- 100 GB bandwidth/month
- Automatic HTTPS
- Preview deployments
- Perfect for personal wikis

### Pro ($20/month)

- 1 TB bandwidth/month
- Team collaboration
- Analytics
- Password protection
- Custom deployment regions

## Troubleshooting

### Build Fails

Check build logs in Vercel dashboard:

```bash
# Test build locally
npm run build
```

### Environment Variables

Make sure all required variables are set in Vercel dashboard.

### Domain Not Working

1. Check DNS propagation: `dig wiki.example.com`
2. Wait up to 48 hours for DNS propagation
3. Verify DNS records match Vercel's instructions

### Old Content Showing

Vercel caches aggressively. To force refresh:

1. Make a change
2. Push to trigger new deployment
3. Hard refresh browser (Ctrl+Shift+R)

## Best Practices

### Use Git Integration

Connect your Git repository for automatic deployments.

### Enable Preview Deployments

Test changes before merging to production.

### Set Up Custom Domain

Use your own domain for professional appearance.

### Monitor Analytics

Track page views and performance.

### Use Environment Variables

Keep sensitive data out of your code.

## Comparison with Other Platforms

| Feature       | Vercel    | GitHub Pages | Netlify   |
| ------------- | --------- | ------------ | --------- |
| Setup         | Instant   | Manual       | Easy      |
| Custom Domain | Free      | Free         | Free      |
| HTTPS         | Automatic | Automatic    | Automatic |
| Preview URLs  | Yes       | No           | Yes       |
| Analytics     | Yes ($)   | No           | Yes ($)   |
| Build Time    | Fast      | Medium       | Fast      |

## Next Steps

- [Configure Custom Domain](/deployment/custom-domain)
- [Set Up Analytics](/guides/analytics)
- [Optimize Performance](/guides/performance)
