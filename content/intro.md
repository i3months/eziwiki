---
title: Welcome to eziwiki
description: A beautiful, minimal wiki and documentation site generator
---

# Welcome to eziwiki 👋

![eziwiki](/images/eziwiki.png)

**eziwiki** is a beautiful, minimal wiki and documentation site generator built with Next.js 14, inspired by Notion and Obsidian.

Perfect for creating documentation sites, personal wikis, knowledge bases, and more.

## ✨ Key Features

- **🚀 Static Site Generation** - Lightning-fast pages pre-rendered at build time
- **📝 Markdown-First** - Write content in Markdown with full GitHub Flavored Markdown support
- **🎨 Beautiful UI** - Clean, modern interface inspired by Notion and Obsidian
- **📱 Fully Responsive** - Works beautifully on mobile, tablet, and desktop
- **🌙 Dark Mode** - Built-in dark mode support
- **🎯 Type-Safe** - Built with TypeScript for maximum reliability
- **🔍 Syntax Highlighting** - Powered by Shiki for beautiful code blocks
- **⚡ Zero Config** - Works out of the box, customize when you need
- **🔗 Smart Links** - Internal links automatically converted to hash-based navigation
- **📂 Nested Navigation** - Unlimited nesting with collapsible sections

## 🎯 Perfect For

- **Documentation Sites** - API docs, user guides, technical documentation
- **Personal Wikis** - Your second brain, knowledge management
- **Knowledge Bases** - Team wikis, internal documentation
- **Project Documentation** - README on steroids
- **Learning Notes** - Study materials, course notes

## 🚀 Quick Start

Get started in less than 5 minutes:

```bash
# Clone the repository
git clone https://github.com/yourusername/eziwiki.git
cd eziwiki

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your wiki!

## 📖 What's Next?

- **[Installation Guide](/getting-started/installation)** - Detailed setup instructions
- **[Quick Start](/getting-started/quick-start)** - Get up and running fast
- **[Configuration](/configuration/payload)** - Customize your wiki
- **[Writing Content](/content/markdown-basics)** - Learn Markdown basics
- **[Deployment](/deployment/static-export)** - Deploy your wiki

## 💡 Example

Here's how easy it is to configure your wiki:

```typescript
export const payload: Payload = {
  global: {
    title: 'My Wiki',
    description: 'My personal knowledge base',
  },
  navigation: [
    {
      name: 'Getting Started',
      path: 'intro',
    },
    {
      name: 'Guides',
      color: '#dbeafe',
      children: [
        {
          name: 'Installation',
          path: 'guides/installation',
        },
      ],
    },
  ],
};
```

That's it! Add your Markdown files and you're ready to go.

## 🌟 Why eziwiki?

- **Simple** - No complex setup, just write Markdown
- **Fast** - Static generation means instant page loads
- **Beautiful** - Modern UI that your users will love
- **Flexible** - Customize everything from colors to navigation
- **Free** - Open source and free forever

## 🤝 Community

- **GitHub** - [Star us on GitHub](https://github.com/yourusername/eziwiki)
- **Issues** - [Report bugs or request features](https://github.com/yourusername/eziwiki/issues)
- **Discussions** - [Join the community](https://github.com/yourusername/eziwiki/discussions)

---

Ready to build your wiki? Check out the [Quick Start Guide](/getting-started/quick-start)!
