---
title: Frontmatter
description: Add metadata to your Markdown files
---

# Frontmatter

Frontmatter is YAML metadata at the top of your Markdown files. It's optional but recommended for better SEO and organization.

## Basic Syntax

Frontmatter is enclosed between `---` markers:

```markdown
---
title: My Page Title
description: A brief description of the page
---

# My Page Title

Your content here...
```

## Supported Fields

### title

The page title used in:

- Browser tab
- SEO meta tags
- Open Graph tags

```markdown
---
title: Getting Started with eziwiki
---
```

### description

A brief description used in:

- SEO meta description
- Open Graph description
- Search results

```markdown
---
title: Getting Started
description: Learn how to set up and use eziwiki in 5 minutes
---
```

## Complete Example

```markdown
---
title: API Authentication Guide
description: Learn how to authenticate API requests using OAuth 2.0
---

# API Authentication Guide

This guide covers authentication methods...
```

## Why Use Frontmatter?

### Better SEO

Search engines use title and description for:

- Search result titles
- Meta descriptions
- Social media previews

```markdown
---
title: eziwiki - Beautiful Documentation Made Easy
description: A minimal wiki generator built with Next.js, inspired by Notion and Obsidian
---
```

### Consistent Metadata

Frontmatter ensures every page has proper metadata:

```markdown
---
title: Installation Guide
description: Step-by-step installation instructions for eziwiki
---
```

### Social Sharing

When shared on social media, frontmatter provides:

- Card title
- Card description
- Better preview

## Frontmatter vs Markdown Headings

You can use both:

```markdown
---
title: Getting Started
description: Quick start guide
---

# Getting Started

Welcome to the quick start guide...
```

The frontmatter `title` is used for SEO and metadata, while the Markdown `# Heading` is displayed in the content.

## Optional Frontmatter

Frontmatter is completely optional. If not provided:

- Title defaults to the first `# Heading` in the file
- Description is empty

```markdown
# My Page

This page has no frontmatter, but still works fine!
```

## YAML Syntax

Frontmatter uses YAML syntax:

```yaml
---
# Simple values
title: My Title
description: My description

# Quotes for special characters
title: "Title: With Colon"
description: 'Description with "quotes"'

# Multi-line values
description: |
  This is a multi-line
  description that spans
  multiple lines.
---
```

## Common Patterns

### Documentation Page

```markdown
---
title: API Reference
description: Complete API documentation with examples
---

# API Reference

## Authentication

All API requests require...
```

### Tutorial Page

```markdown
---
title: Building Your First App
description: Step-by-step tutorial for beginners
---

# Building Your First App

In this tutorial, you'll learn...
```

### Guide Page

```markdown
---
title: Deployment Guide
description: Deploy your wiki to production
---

# Deployment Guide

This guide covers deployment to...
```

## Best Practices

### Keep Titles Concise

```markdown
## ✅ Good:

## title: Quick Start Guide

## ❌ Too long:

## title: The Complete and Comprehensive Quick Start Guide for Getting Started with eziwiki
```

### Write Descriptive Descriptions

```markdown
## ✅ Good:

## description: Learn how to install eziwiki and create your first wiki page

## ❌ Too vague:

## description: Installation stuff
```

### Use Proper Capitalization

```markdown
## ✅ Good:

## title: Getting Started with eziwiki

## ❌ Bad:

## title: getting started with eziwiki
```

### Avoid Duplicate Content

Don't repeat the title in the description:

```markdown
## ✅ Good:

title: Installation Guide
description: Step-by-step instructions for installing eziwiki

---

## ❌ Bad:

title: Installation Guide
description: Installation Guide - How to install

---
```

## Validation

eziwiki validates frontmatter at build time. Common errors:

```markdown
## ❌ Invalid YAML syntax:

title: Missing closing quote
description: "Unclosed quote

---

## ❌ Invalid structure:

title
description

---

## ✅ Valid:

title: Correct Title
description: Correct description

---
```

## Next Steps

- [Learn Markdown Basics](/content/markdown-basics)
- [Explore Code Blocks](/content/code-blocks)
- [Configure Your Wiki](/configuration/payload)
