---
title: Static Export
description: Export your wiki as static HTML files
---

# Static Export

eziwiki generates a fully static site that can be deployed anywhere.

## Build Your Site

```bash
npm run build
```

This creates an optimized static site in the `out/` directory.

## What Gets Generated

```
out/
├── index.html              # Home page
├── getting-started/
│   ├── installation.html
│   ├── quick-start.html
│   └── first-wiki.html
├── configuration/
│   ├── payload.html
│   ├── navigation.html
│   └── theme.html
├── _next/                  # Optimized assets
│   ├── static/
│   └── ...
└── ...
```

## Preview Production Build

```bash
npm run start
```

This starts a local server to preview your production build.

## Deploy Anywhere

The `out/` directory contains only static files (HTML, CSS, JS). You can deploy it to:

- **Static Hosting**: Netlify, Vercel, GitHub Pages
- **CDN**: Cloudflare Pages, AWS S3 + CloudFront
- **Web Server**: Nginx, Apache
- **Any HTTP Server**: Even a simple Python server

## Simple HTTP Server

Test your build locally:

```bash
# Using Python
cd out
python -m http.server 8000

# Using Node.js
npx serve out

# Using PHP
cd out
php -S localhost:8000
```

Visit [http://localhost:8000](http://localhost:8000)

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name wiki.example.com;
    root /var/www/wiki/out;
    index index.html;

    location / {
        try_files $uri $uri.html $uri/ =404;
    }

    # Cache static assets
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Apache Configuration

```apache
<VirtualHost *:80>
    ServerName wiki.example.com
    DocumentRoot /var/www/wiki/out

    <Directory /var/www/wiki/out>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # Rewrite rules
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^(.*)$ /$1.html [L]
    </Directory>

    # Cache static assets
    <Directory /var/www/wiki/out/_next/static>
        Header set Cache-Control "public, max-age=31536000, immutable"
    </Directory>
</VirtualHost>
```

## AWS S3 + CloudFront

### 1. Create S3 Bucket

```bash
aws s3 mb s3://my-wiki
```

### 2. Upload Files

```bash
aws s3 sync out/ s3://my-wiki --delete
```

### 3. Configure Static Website Hosting

```bash
aws s3 website s3://my-wiki \
  --index-document index.html \
  --error-document 404.html
```

### 4. Set Up CloudFront

Create a CloudFront distribution pointing to your S3 bucket for global CDN delivery.

## Cloudflare Pages

### Using Git

1. Push your code to GitHub
2. Connect repository to Cloudflare Pages
3. Set build command: `npm run build`
4. Set output directory: `out`
5. Deploy!

### Using CLI

```bash
# Install Wrangler
npm install -g wrangler

# Deploy
wrangler pages publish out
```

## Custom Domain

After deploying, point your domain to your hosting:

### DNS Configuration

```
Type    Name    Value
A       @       192.0.2.1
CNAME   www     your-site.pages.dev
```

### HTTPS

Most platforms provide free SSL certificates:

- Vercel: Automatic
- Netlify: Automatic
- Cloudflare Pages: Automatic
- GitHub Pages: Automatic

## Build Optimization

### Analyze Bundle Size

```bash
npm run build
```

Check the build output for bundle sizes.

### Optimize Images

Place images in `public/` directory and use Next.js Image component:

```jsx
import Image from 'next/image';

<Image src="/images/screenshot.png" alt="Screenshot" width={800} height={600} />;
```

### Minimize Dependencies

Keep your `package.json` lean. Only install what you need.

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npm run deploy # Your deploy script
```

## Environment Variables

Set environment variables for different environments:

```bash
# .env.production
NEXT_PUBLIC_BASE_URL=https://wiki.example.com
```

## Troubleshooting

### 404 Errors

Make sure your server is configured to serve `.html` files without the extension.

### Assets Not Loading

Check that your `baseUrl` in `payload/config.ts` matches your deployment URL.

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next out
npm run build
```

## Next Steps

- [Deploy to GitHub Pages](/deployment/github-pages)
- [Deploy to Vercel](/deployment/vercel)
- [Configure Custom Domain](/deployment/custom-domain)
