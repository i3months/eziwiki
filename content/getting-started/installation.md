---
title: Installation
description: Detailed installation guide for eziwiki
---

# Installation

![eziwiki](/images/eziwiki.png)

This guide covers different ways to install and set up eziwiki.

## Method 1: Clone from GitHub (Recommended)

The easiest way to get started:

```bash
# Clone the repository
git clone https://github.com/yourusername/eziwiki.git

# Navigate to the directory
cd eziwiki

# Install dependencies
npm install

# Start development server
npm run dev
```

## Method 2: Use as Template

1. Go to the [eziwiki GitHub repository](https://github.com/yourusername/eziwiki)
2. Click "Use this template"
3. Create your new repository
4. Clone your new repository
5. Install dependencies and start

```bash
git clone https://github.com/yourusername/your-wiki.git
cd your-wiki
npm install
npm run dev
```

## Method 3: Download ZIP

1. Download the latest release from GitHub
2. Extract the ZIP file
3. Open terminal in the extracted directory
4. Install and run:

```bash
npm install
npm run dev
```

## System Requirements

- **Node.js**: 18.0 or higher
- **npm**: 9.0 or higher (or yarn 1.22+)
- **OS**: macOS, Windows, or Linux
- **RAM**: 2GB minimum
- **Disk Space**: 500MB for dependencies

## Verify Installation

After installation, verify everything works:

```bash
# Check Node.js version
node --version  # Should be 18.0 or higher

# Check npm version
npm --version   # Should be 9.0 or higher

# Run tests
npm run test

# Validate configuration
npm run validate:payload
```

## Project Structure

After installation, you'll have this structure:

```
eziwiki/
├── app/              # Next.js App Router
├── components/       # React components
├── content/          # Your Markdown files
├── lib/              # Utilities and logic
├── payload/          # Configuration
│   └── config.ts     # Main config file
├── public/           # Static assets
├── styles/           # Global styles
└── package.json      # Dependencies
```

## Troubleshooting

### Node.js Version Error

If you see a Node.js version error:

```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js 18
nvm install 18
nvm use 18
```

### Port Already in Use

If port 3000 is already in use:

```bash
# Use a different port
PORT=3001 npm run dev
```

### Module Not Found

If you see module errors:

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

- [Quick Start Guide](/getting-started/quick-start)
- [Create Your First Wiki](/getting-started/first-wiki)
- [Configure Your Wiki](/configuration/payload)
