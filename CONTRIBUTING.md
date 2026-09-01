# Contributing to EziWiki

Thanks for your interest in contributing! We welcome bug fixes, features, documentation improvements, and more.

## Quick Start

1. Fork and clone the repo
2. Install dependencies: `npm install`
   - The lockfile is written by npm 10, the version Node 20 and 22 ship with
     and CI runs. npm 11 rewrites it differently — it drops the nested
     `esbuild` that `vite` lists as optional, and npm 10's `npm ci` then
     refuses the lock. If you are on npm 11, regenerate the lock with
     `npx npm@10 install --package-lock-only` before committing it.
3. Create a branch: `git checkout -b feature/your-feature`
4. Make your changes
5. Run checks: `npm run lint && npm run test && npm run build`
6. Commit and push
7. Open a Pull Request

## Code Standards

This project follows strict TypeScript and React conventions. Key points:

- **TypeScript**: Strict mode, explicit types, no `any`
- **Components**: Named exports, PascalCase files, JSDoc comments
- **Styling**: Tailwind CSS utilities, mobile-first
- **Imports**: Use `@/` alias for internal imports
- **Interface text**: No literal strings in components. Add a key to `Strings`
  in `lib/i18n/strings.ts`, translate it in every table there, and read it from
  `getStrings()` on the server or `useStrings()` on the client. A test fails on
  a table that misses a key or drops a `{placeholder}`.

## Translations

To add a language, copy the `EN` table in `lib/i18n/strings.ts`, translate the
values, and register it in `TABLES` under its primary subtag. Keep every
`{placeholder}` — where it falls in the sentence is yours to decide, but a
dropped one leaves a hole where a number or a date belongs.

Import `format` from `lib/i18n/format`, not from `strings` — the latter carries
every translation, and a client component importing it would send them all to
the browser.

## Commit Messages

Use Conventional Commits format:

```
feat: add new feature
fix: fix bug
docs: update documentation
```

Examples:

- `feat: add icon support`
- `fix: handle missing frontmatter`
- `docs: update README installation steps`

## Pull Requests

We'll review your PR and provide feedback. Thanks for contributing!
