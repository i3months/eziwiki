# My Wiki

Built with [eziwiki](https://github.com/i3months/eziwiki).

## Develop

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Write

Drop Markdown files into `content/`. Every file becomes a page automatically —
folders become sidebar sections. See `content/guides/writing.md` for what a page
can contain.

Set the site title, theme, and URL style in `payload/config.ts`.

## Build

```bash
npm run build
```

The result is a fully static site in `out/`, deployable to GitHub Pages,
Netlify, Vercel, S3, or any static host.

Each page is dated from the commit that last touched it, so build from a
repository with its history present — a shallow clone leaves pages undated. On
GitHub Actions that means checking out with `fetch-depth: 0`. Set `repoUrl` in
`payload/config.ts` and each page also links to its own source for editing.

## Deploy

A GitHub Pages workflow ships in `.github/workflows/deploy.yml`. To go live:

1. `git init && git add -A && git commit -m "New wiki"`
2. Create a GitHub repository and push to `main`.
3. In the repository settings, under **Pages**, set the source to
   **GitHub Actions**.

Every push to `main` then publishes the site. The workflow works out the
subdirectory and the origin from the repository, so canonical links are right
from the first deploy; for a custom domain, set a `SITE_URL` repository
variable and put the domain in `baseUrl` in `payload/config.ts`. Any other
static host works too — run `npm run build` and upload `out/`.

`package.json` records the release this project came from under
`eziwiki.version` — quote it in bug reports. The engine is copied in rather
than depended on; to update it, scaffold a fresh project with the latest
`create-eziwiki` and carry `content/`, `payload/` and `public/` across.

## Commands

```bash
npm run dev              # Development server
npm run build            # Static production build
npm run check:links      # Report unresolved links and pages worth writing
npm run new <path>       # Create a page, frontmatter and all
npm run show-urls        # List every page and its URL
npm test                 # Run the test suite
```

## Security

Everything under `content/` is trusted: raw HTML, scripts included, is passed
through to the page. Review a Markdown pull request the way you would review
code. A page marked `hidden` is unlisted, not private — anyone with the link
can read it.
