import { Payload } from '@/lib/payload/types';

/**
 * Site configuration.
 *
 * Navigation is optional: pages under `content/` are discovered automatically,
 * ordered by their frontmatter `order` and grouped by folder. Add a
 * `navigation` array here only when you want to override that.
 */
export const payload: Payload = {
  global: {
    title: 'My Wiki',
    description: 'A documentation site built with eziwiki',
    favicon: '/favicon.svg',

    /**
     * The URL the site is published at. Canonical links, the sitemap,
     * robots.txt and llms.txt are all written against it — until you set it,
     * they advertise example.com. The shipped GitHub Pages workflow fills it
     * in at build time; on any other host, set it here.
     */
    baseUrl: 'https://example.com',

    /**
     * Your repository. Linked from the sidebar, and — on GitHub or GitLab —
     * it also gives every page an "edit this page" link.
     */
    // repoUrl: 'https://github.com/you/your-wiki',

    /**
     * 'path' gives readable, indexable URLs (/guides/writing).
     * 'hash' gives opaque ones (/a3f2e9d1-...), hiding the structure at the
     * cost of SEO and shareable links.
     */
    urlStrategy: 'path',

    /** Publish pages found under content/ without listing them below. */
    autoNavigation: true,
  },

  theme: {
    primary: '#2563eb',
    secondary: '#7c3aed',
  },
};

export default payload;
