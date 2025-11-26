---
title: Syntax Highlighting
description: Beautiful code highlighting powered by Shiki
---

# Syntax Highlighting

eziwiki uses [Shiki](https://shiki.matsu.io/) for beautiful, accurate syntax highlighting.

## Why Shiki?

- **Accurate** - Uses VS Code's grammar engine
- **Beautiful** - Same highlighting as VS Code
- **Fast** - Pre-rendered at build time
- **100+ Languages** - Supports virtually every language
- **Theme Support** - Multiple color themes available

## Supported Languages

### Popular Languages

- JavaScript, TypeScript, JSX, TSX
- Python, Java, C, C++, C#, Go, Rust
- HTML, CSS, SCSS, Sass, Less
- JSON, YAML, TOML, XML
- Bash, Shell, PowerShell
- SQL, GraphQL
- Markdown, MDX
- PHP, Ruby, Perl, Lua
- And 100+ more!

## Usage

### Basic Code Block

Use triple backticks with a language identifier:

````markdown
```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
```
````

Result:

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
```

### TypeScript Example

````markdown
```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}
```
````

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}
```

### Python Example

````markdown
```python
def calculate_fibonacci(n: int) -> list[int]:
    """Generate Fibonacci sequence."""
    if n <= 0:
        return []

    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])

    return fib
```
````

```python
def calculate_fibonacci(n: int) -> list[int]:
    """Generate Fibonacci sequence."""
    if n <= 0:
        return []

    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])

    return fib
```

## Configuration

### Change Theme

Edit `lib/markdown/highlighter.ts`:

```typescript
import { getHighlighter } from 'shiki';

const highlighter = await getHighlighter({
  themes: ['github-light', 'github-dark'],  // Change themes here
  langs: ['javascript', 'typescript', ...],
});
```

### Available Themes

Popular themes:

- `github-light`, `github-dark` (default)
- `nord`
- `dracula`
- `monokai`
- `one-dark-pro`
- `material-theme`
- `solarized-light`, `solarized-dark`

See [all themes](https://github.com/shikijs/shiki/blob/main/docs/themes.md).

### Add Languages

Add more languages to support:

```typescript
const highlighter = await getHighlighter({
  themes: ['github-light', 'github-dark'],
  langs: [
    'javascript',
    'typescript',
    'python',
    'rust', // Add Rust
    'kotlin', // Add Kotlin
    'swift', // Add Swift
  ],
});
```

## Dark Mode Support

Code blocks automatically adapt to the theme:

```typescript
// Light mode: github-light theme
// Dark mode: github-dark theme

const html = highlighter.codeToHtml(code, {
  lang: 'javascript',
  theme: isDark ? 'github-dark' : 'github-light',
});
```

## Inline Code

Inline code uses a simple monospace style:

```markdown
Use `const` instead of `var` in JavaScript.
```

Use `const` instead of `var` in JavaScript.

## Line Numbers

To add line numbers, modify the highlighter configuration:

```typescript
const html = highlighter.codeToHtml(code, {
  lang: 'javascript',
  theme: 'github-light',
  lineNumbers: true, // Enable line numbers
});
```

## Line Highlighting

Highlight specific lines:

```typescript
const html = highlighter.codeToHtml(code, {
  lang: 'javascript',
  theme: 'github-light',
  lineOptions: [
    { line: 3, classes: ['highlighted'] },
    { line: 5, classes: ['highlighted'] },
  ],
});
```

## Copy Button

Add a copy button to code blocks:

```typescript
'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={copyCode}
        className="absolute top-2 right-2 p-2 rounded bg-gray-700 hover:bg-gray-600"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
```

## Language Detection

If no language is specified, Shiki tries to detect it:

````markdown
```
function hello() {
  console.log('Hello!');
}
```
````

But it's better to always specify the language:

````markdown
```javascript
function hello() {
  console.log('Hello!');
}
```
````

## Performance

### Build-Time Rendering

Code blocks are highlighted at build time, not runtime:

```typescript
// During build
const html = highlighter.codeToHtml(code, { lang, theme });

// Served as static HTML
<div dangerouslySetInnerHTML={{ __html: html }} />
```

This means:

- **Fast loading** - No client-side processing
- **Small bundle** - No syntax highlighting library in browser
- **SEO friendly** - Fully rendered HTML

### Bundle Size

Shiki only runs at build time, so it doesn't increase your client bundle size.

## Best Practices

### Always Specify Language

````markdown
✅ Good:

```javascript
const x = 10;
```

❌ Bad:

```
const x = 10;
```
````

### Use Proper Indentation

````markdown
✅ Good:

```javascript
function example() {
  if (true) {
    console.log('Properly indented');
  }
}
```

❌ Bad:

```javascript
function example() {
  if (true) {
    console.log('Bad indentation');
  }
}
```
````

### Add Comments

````markdown
```javascript
// Initialize user data
const user = {
  name: 'Alice',
  email: 'alice@example.com',
};

// Send welcome email
sendEmail(user.email, 'Welcome!');
```
````

### Keep Examples Focused

````markdown
✅ Good - focused example:

```javascript
// Calculate total
const total = items.reduce((sum, item) => sum + item.price, 0);
```

❌ Bad - too much code:

```javascript
// 100 lines of unrelated code...
```
````

## Troubleshooting

### Language Not Recognized

If a language isn't highlighted:

1. Check the language name is correct
2. Add it to `langs` array in highlighter config
3. See [supported languages](https://github.com/shikijs/shiki/blob/main/docs/languages.md)

### Theme Not Working

If theme doesn't apply:

1. Check theme name is correct
2. Add it to `themes` array in highlighter config
3. Rebuild the site: `npm run build`

### Code Not Highlighting

If code blocks aren't highlighted:

1. Check triple backticks are correct
2. Verify language identifier is specified
3. Check for syntax errors in code
4. Rebuild the site

## Examples

### Diff Highlighting

Show code changes:

````markdown
```diff
- const oldValue = 10;
+ const newValue = 20;
```
````

### Shell Commands

````markdown
```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```
````

### Configuration Files

````markdown
```json
{
  "name": "my-project",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  }
}
```
````

## Next Steps

- [Learn Markdown Basics](/content/markdown-basics)
- [Explore Code Blocks Guide](/content/code-blocks)
- [Customize Theme](/configuration/theme)
