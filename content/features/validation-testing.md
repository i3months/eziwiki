---
title: Validation & Testing
description: Built-in validation and testing tools
---

# Validation & Testing

eziwiki includes powerful validation and testing tools to ensure your wiki is error-free.

## Payload Validation

### Automatic Validation

Payload configuration is automatically validated before every build:

```bash
npm run build
```

Output:

```
🔍 Validating payload configuration...

✅ Payload validation passed!
```

### Manual Validation

Validate without building:

```bash
npm run validate:payload
```

### What Gets Validated

- **Required fields**: `title`, `description`
- **Navigation structure**: Valid hierarchy
- **Color format**: Hex colors (`#rrggbb`)
- **File existence**: All referenced Markdown files exist
- **Path uniqueness**: No duplicate paths
- **JSON Schema**: Full schema validation

### Validation Errors

Common errors and fixes:

#### Missing Required Field

```
❌ Payload validation failed:

  • global.title is required
```

Fix:

```typescript
global: {
  title: 'My Wiki',  // Add title
  description: 'My description',
}
```

#### Invalid Color Format

```
❌ Payload validation failed:

  • navigation[0].color must be a valid hex color
```

Fix:

```typescript
{
  name: 'Section',
  color: '#dbeafe',  // Must be #rrggbb format
}
```

#### Missing Content File

```
❌ Payload validation failed:

  • Content file not found: content/missing-page.md
```

Fix:

```bash
# Create the missing file
touch content/missing-page.md
```

## Testing

### Run Tests

```bash
# Run all tests
npm run test

# Watch mode (for development)
npm run test:watch
```

### Test Structure

Tests are located in `__tests__` directories:

```
lib/
├── navigation/
│   ├── builder.ts
│   └── __tests__/
│       └── builder.test.ts
```

### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { extractAllPaths } from '../builder';

describe('extractAllPaths', () => {
  it('should extract all paths from navigation', () => {
    const navigation = [
      { name: 'Home', path: 'intro' },
      {
        name: 'Guides',
        children: [{ name: 'Quick Start', path: 'guides/quick-start' }],
      },
    ];

    const paths = extractAllPaths(navigation);

    expect(paths).toEqual(['intro', 'guides/quick-start']);
  });
});
```

### Writing Tests

Create a test file:

```typescript
// lib/utils/__tests__/helper.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '../helper';

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });

  it('should handle edge cases', () => {
    expect(myFunction('')).toBe('');
    expect(myFunction(null)).toBe(null);
  });
});
```

## Type Checking

### Run Type Check

```bash
npm run type-check
```

This runs TypeScript compiler without emitting files, catching type errors:

```
src/components/Example.tsx:10:5 - error TS2322: Type 'string' is not assignable to type 'number'.

10     count: "invalid"
       ~~~~~
```

### Strict Mode

eziwiki uses strict TypeScript mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## Linting

### Run Linter

```bash
npm run lint
```

This runs ESLint with auto-fix:

```
✔ No ESLint warnings or errors
```

### Linting Rules

Configured in `.eslintrc.js`:

```javascript
module.exports = {
  extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended', 'prettier'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
```

## Formatting

### Format Code

```bash
npm run format
```

This runs Prettier on all files:

```
Checking formatting...
All matched files use Prettier code style!
```

### Format Configuration

Configured in `.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

## Pre-commit Checks

### Recommended Workflow

Before committing:

```bash
# 1. Format code
npm run format

# 2. Run linter
npm run lint

# 3. Type check
npm run type-check

# 4. Run tests
npm run test

# 5. Validate payload
npm run validate:payload
```

### Git Hooks

Set up pre-commit hooks with Husky:

```bash
npm install -D husky lint-staged

# Initialize husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run type-check"
```

`.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run lint
npm run type-check
npm run test
npm run validate:payload
```

## CI/CD Integration

### GitHub Actions

`.github/workflows/test.yml`:

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - run: npm ci

      - run: npm run lint

      - run: npm run type-check

      - run: npm run test

      - run: npm run validate:payload

      - run: npm run build
```

## Show URLs Script

View all hash-based URLs:

```bash
npm run show-urls
```

Output:

```
📋 Hash-Based URLs
================================================================================
📄 intro
   → /2c8f9a1b
   → https://eziwiki.dev/2c8f9a1b

📄 getting-started/quick-start
   → /7d3e4f2a
   → https://eziwiki.dev/7d3e4f2a

🔒 [HIDDEN] secret-page
   → /9f1a2b3c
   → https://eziwiki.dev/9f1a2b3c

================================================================================
Total pages: 15
Hidden pages: 1

💡 Tip: Hidden pages are not shown in the sidebar but can be accessed via their hash URL.
```

Useful for:

- Finding hidden page URLs
- Debugging navigation issues
- Sharing direct links
- Testing all pages

## Best Practices

### Validate Early

Run validation before committing:

```bash
npm run validate:payload
```

### Write Tests

Test critical functionality:

```typescript
// Test navigation builder
// Test hash generation
// Test content parsing
// Test validation logic
```

### Use Type Safety

Leverage TypeScript:

```typescript
✅ Good:
interface User {
  name: string;
  email: string;
}

function greet(user: User): string {
  return `Hello, ${user.name}!`;
}

❌ Bad:
function greet(user: any) {
  return `Hello, ${user.name}!`;
}
```

### Keep Tests Fast

```typescript
✅ Good - unit tests:
expect(add(1, 2)).toBe(3);

❌ Bad - slow integration tests:
await fetch('https://api.example.com/test');
```

## Troubleshooting

### Validation Fails

If validation fails:

1. Read error messages carefully
2. Check `payload/config.ts` for issues
3. Verify all Markdown files exist
4. Check color format (`#rrggbb`)

### Tests Fail

If tests fail:

1. Read test output
2. Check for recent code changes
3. Update tests if behavior changed
4. Fix bugs if tests are correct

### Type Errors

If type checking fails:

1. Read error messages
2. Add missing type annotations
3. Fix type mismatches
4. Use `any` sparingly (last resort)

## Next Steps

- [Learn About Hash Navigation](/features/hash-navigation)
- [Explore Dark Mode](/features/dark-mode)
- [Configure Your Wiki](/configuration/payload)
