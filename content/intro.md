---
title: Introduction
description: Welcome to the documentation site
---

# Welcome to Documentation Site

This is a beautiful, minimal documentation site built with Next.js, inspired by Notion and Obsidian.

## Features

- **Static Site Generation**: All pages are pre-rendered at build time for optimal performance
- **Markdown Support**: Write your content in Markdown with full GitHub Flavored Markdown support
- **Syntax Highlighting**: Code blocks are automatically highlighted with language detection
- **Responsive Design**: Works beautifully on mobile, tablet, and desktop devices
- **Customizable Theme**: Easy theme customization with CSS variables
- **Type-Safe**: Built with TypeScript for maximum reliability

## Getting Started

Check out the [Quick Start](/guides/quick-start) guide to begin using this template.

## Code Examples

Here's a simple TypeScript example:

```typescript
interface User {
  name: string;
  email: string;
  role: 'admin' | 'user';
}

function greetUser(user: User): string {
  return `Hello, ${user.name}!`;
}

const currentUser: User = {
  name: 'Alice',
  email: 'alice@example.com',
  role: 'admin',
};

console.log(greetUser(currentUser));
```

Python example with syntax highlighting:

```python
def calculate_fibonacci(n: int) -> list[int]:
    """Generate Fibonacci sequence up to n terms."""
    if n <= 0:
        return []
    elif n == 1:
        return [0]

    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])

    return fib

# Generate first 10 Fibonacci numbers
result = calculate_fibonacci(10)
print(result)  # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

JSON configuration example:

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0"
  }
}
```

## Next Steps

- Read the [Quick Start Guide](/guides/quick-start) to set up your project
- Learn about [Configuration](/guides/configuration) options
- Customize your theme colors
- Add your own Markdown content
