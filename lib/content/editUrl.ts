import { payload } from '@/payload/config';
import type { GlobalConfig } from '../payload/types';

/** The parts of the site config that decide where an edit link goes. */
export type EditConfig = Pick<GlobalConfig, 'editUrl' | 'repoUrl' | 'editBranch'>;

/** Branch an edit link points at when the config does not name one. */
const DEFAULT_BRANCH = 'main';

/**
 * Where a host puts the editor for a file on a branch.
 *
 * Only the two public hosts are recognised, because only they can be
 * identified from a repository URL alone. A self-hosted instance of either —
 * or any other forge — is served by `editUrl`, which says outright what this
 * has to guess.
 */
const FORGES: Record<string, (repo: string, branch: string) => string> = {
  'github.com': (repo, branch) => `${repo}/edit/${branch}/content/{path}`,
  'gitlab.com': (repo, branch) => `${repo}/-/edit/${branch}/content/{path}`,
};

/**
 * Strips the parts of a clone URL that a web URL should not carry.
 *
 * The trailing slash goes first: `wiki.git/` is a shape a clone URL is copied
 * in, and stripping the suffix before the slash would leave it untouched.
 *
 * @param repoUrl - Repository URL from the config
 * @returns The same URL without a `.git` suffix or trailing slash
 */
function webUrl(repoUrl: string): string {
  return repoUrl.replace(/\/+$/, '').replace(/\.git$/, '');
}

/**
 * Resolves the template that turns a content path into an edit link.
 *
 * @param config - The edit-related fields of the site config
 * @returns A template containing `{path}`, or null when none can be resolved
 */
function getTemplate({ editUrl, repoUrl, editBranch }: EditConfig): string | null {
  if (editUrl) return editUrl;
  if (!repoUrl) return null;

  let host: string;
  try {
    host = new URL(repoUrl).hostname;
  } catch {
    return null;
  }

  const forge = FORGES[host];
  return forge ? forge(webUrl(repoUrl), editBranch || DEFAULT_BRANCH) : null;
}

/**
 * Builds the address at which a reader can edit a page.
 *
 * A wiki is worth more when the person who spots the mistake can fix it, and
 * the distance between spotting it and fixing it is most of what decides
 * whether they do. The repository is usually already configured for the sidebar
 * link, so for the common hosts this costs the author no extra setting.
 *
 * @param config - The edit-related fields of the site config
 * @param docPath - Content-relative path without extension
 * @returns Absolute URL, or null when no repository or template is configured
 *
 * @example
 * ```typescript
 * buildEditUrl({ repoUrl: 'https://github.com/you/wiki' }, 'guides/setup');
 * // 'https://github.com/you/wiki/edit/main/content/guides/setup.md'
 * ```
 */
export function buildEditUrl(config: EditConfig, docPath: string): string | null {
  const template = getTemplate(config);
  // Each segment encoded on its own: a space or a `#` in a file name is a
  // wrong link otherwise, and the slashes have to stay slashes.
  const encoded = docPath.split('/').map(encodeURIComponent).join('/');
  return template ? template.replace('{path}', `${encoded}.md`) : null;
}

/**
 * The edit link for a page under this wiki's own configuration.
 *
 * @param docPath - Content-relative path without extension
 * @returns Absolute URL, or null when no repository or template is configured
 */
export function getEditUrl(docPath: string): string | null {
  return buildEditUrl(payload.global, docPath);
}
