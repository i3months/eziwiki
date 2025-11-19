---
title: 'Complete Markdown Syntax Test'
description: 'Testing all markdown syntax and rendering'
---

# Complete Markdown Syntax Test

## 1. Headings

# H1 Heading

## H2 Heading

### H3 Heading

#### H4 Heading

##### H5 Heading

###### H6 Heading

## 2. Text Styling

**Bold Text**

_Italic Text_

**_Bold + Italic_**

~~Strikethrough~~

`Inline Code`

## 3. Lists

### Unordered List

- Item 1
- Item 2
  - Nested Item 2.1
  - Nested Item 2.2
    - Deeper Nested 2.2.1
- Item 3

### Ordered List

1. First
2. Second
   1. Nested 2.1
   2. Nested 2.2
3. Third

### Checkbox List

- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task

## 4. Links

[Regular Link](https://example.com)

[Link with Title](https://example.com 'Example Site')

<https://auto-link.com>

## 5. Images

### External Images (Placeholder)

![Alt Text](https://via.placeholder.com/150)

![Image with Title](https://via.placeholder.com/200 'Image Title')

### Local Image Test

![Sample Image](/images/docs/sample.jpg)

### Local Image Usage Example

To add images, save them in the `public/images/` folder and reference like this:

```markdown
![Documentation Image](/images/docs/example.png)
![Screenshot](/images/screenshots/demo.png)
![Icon](/images/icons/logo.svg)
```

## 6. Blockquotes

> Simple blockquote.

> Multi-line
> blockquote is also possible.

> Nested blockquote
>
> > Second level
> >
> > > Third level

## 7. Code Blocks

### JavaScript

```javascript
function hello(name) {
  console.log(`Hello, ${name}!`);
  return true;
}

const result = hello('World');
```

### Python

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
```

### TypeScript

```typescript
interface User {
  id: number;
  name: string;
  email?: string;
}

const user: User = {
  id: 1,
  name: 'John Doe',
};
```

### HTML

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Test Page</title>
  </head>
  <body>
    <h1>Hello World</h1>
  </body>
</html>
```

### CSS

```css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
}
```

### JSON

```json
{
  "name": "test",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0"
  }
}
```

### Bash

```bash
#!/bin/bash
echo "Hello, World!"
for i in {1..5}; do
  echo "Number: $i"
done
```

## 8. Tables

| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

### Table with Alignment

| Left Align | Center Align | Right Align |
| :--------- | :----------: | ----------: |
| Left       |    Center    |       Right |
| A          |      B       |           C |

## 9. Horizontal Rules

---

---

---

## 10. HTML Tags

<div style="background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
  <p>HTML tags are also supported.</p>
  <strong>Bold Text</strong>
</div>

## 11. Escape Characters

\* Asterisk
\_ Underscore
\# Hash
\[ Bracket
\] Bracket
\( Parenthesis
\) Parenthesis

## 12. Footnotes

Here is a footnote reference[^1].

Another footnote[^2].

[^1]: First footnote content.

[^2]: Second footnote content.

## 13. Definition Lists

Term 1
: Definition 1

Term 2
: Definition 2a
: Definition 2b

## 14. Abbreviations

HTML is an abbreviation for HyperText Markup Language.

\*[HTML]: HyperText Markup Language

## 15. Complex Nested Structure

1. First item

   > Blockquote inside list

   ```javascript
   const code = 'in list';
   ```

   - Nested list
   - Another item

2. Second item

   | Table | Inside |
   | ----- | ------ |
   | Data  | Value  |

## 16. Emoji

:smile: :heart: :rocket: :fire: :+1:

😀 😃 😄 😁 🚀 💻 🎉

## 17. Math Formulas (if supported)

Inline formula: $E = mc^2$

Block formula:

$$
\frac{n!}{k!(n-k)!} = \binom{n}{k}
$$

## 18. Long Text Test

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

## 19. Special Characters

© ® ™ § ¶ † ‡ • ° ± × ÷ ≠ ≈ ≤ ≥

## 20. Multi-language Test

English: Hello World!
한국어: 안녕하세요!
日本語: こんにちは！
中文: 你好！
Español: ¡Hola Mundo!
Français: Bonjour le monde!
Deutsch: Hallo Welt!
Русский: Привет мир!

---

## Conclusion

This document is for testing most markdown syntax. Check if all elements render properly!
