import fs from 'fs';
import path from 'path';

/**
 * Scaffolding logic for `create-eziwiki`.
 *
 * Kept separate from the CLI entry point so the decisions — what a valid
 * project name is, how the template's package.json is rewritten, which files
 * get renamed on the way out — can be tested without spawning a process or
 * touching a real project directory.
 */

/**
 * Files that npm refuses to publish under their real name, and what they must
 * be restored to on disk.
 *
 * npm silently excludes `.gitignore` from a package tarball and renames
 * `.npmrc`, so the template ships them under safe names.
 */
export const RENAME_ON_COPY = {
  gitignore: '.gitignore',
  npmrc: '.npmrc',
  prettierrc: '.prettierrc',
  prettierignore: '.prettierignore',
};

/** Directory names never copied out of the template. */
export const SKIP_DIRS = new Set(['node_modules', '.next', 'out', '.git']);

/**
 * Validates a project directory name.
 *
 * The name becomes both a directory and the `name` field of a package.json, so
 * it has to satisfy npm's rules; rejecting it up front is friendlier than
 * letting `npm install` fail later with a less obvious message.
 *
 * @param {string} name - Proposed project name
 * @returns {{ valid: boolean, problem?: string }} Validation outcome
 *
 * @example
 * validateProjectName('my-wiki'); // { valid: true }
 * validateProjectName('My Wiki'); // { valid: false, problem: '...' }
 */
export function validateProjectName(name) {
  if (!name || !name.trim()) {
    return { valid: false, problem: 'Project name is required.' };
  }

  if (name.length > 214) {
    return { valid: false, problem: 'Project name must be 214 characters or fewer.' };
  }

  if (name.startsWith('.') || name.startsWith('_')) {
    return { valid: false, problem: 'Project name cannot start with "." or "_".' };
  }

  if (name !== name.toLowerCase()) {
    return { valid: false, problem: 'Project name must be lowercase.' };
  }

  if (!/^[a-z0-9-~][a-z0-9._~-]*$/.test(name)) {
    return {
      valid: false,
      problem: 'Project name may only contain lowercase letters, digits, "-", "_", "." and "~".',
    };
  }

  return { valid: true };
}

/**
 * Rewrites the template's package.json for a freshly created project.
 *
 * The new project is the user's own, so anything identifying it as the eziwiki
 * repository — the name, the repository link, the published-package fields — is
 * replaced or dropped rather than inherited.
 *
 * @param {object} pkg - Parsed template package.json
 * @param {string} projectName - Name for the new project
 * @param {string} [cliVersion] - The create-eziwiki release doing the writing
 * @returns {object} The rewritten manifest
 */
export function buildProjectPackageJson(pkg, projectName, cliVersion) {
  const next = {
    ...pkg,
    name: projectName,
    version: '0.1.0',
    private: true,
    description: 'Documentation site built with eziwiki',
    // The engine directories are copied in rather than depended on, so this
    // is the one place a project can say which release they came from — for
    // a bug report, and for knowing whether an update is due.
    ...(cliVersion ? { eziwiki: { version: cliVersion } } : {}),
  };

  // Fields that only make sense for the source repository.
  delete next.repository;
  delete next.homepage;
  delete next.bugs;
  delete next.bin;
  delete next.files;
  delete next.publishConfig;
  delete next.workspaces;

  return next;
}

/**
 * Whether a directory can be used as the target for a new project.
 *
 * An existing but empty directory is fine — people often `mkdir` first — while
 * one with files in it is refused, because overwriting someone's work is not
 * something a scaffolder should decide on their behalf.
 *
 * @param {string} target - Absolute path to the intended project directory
 * @returns {{ ok: boolean, problem?: string }} Whether scaffolding may proceed
 */
export function checkTarget(target) {
  if (!fs.existsSync(target)) return { ok: true };

  const stat = fs.statSync(target);
  if (!stat.isDirectory()) {
    return { ok: false, problem: `${target} exists and is not a directory.` };
  }

  const entries = fs.readdirSync(target).filter((entry) => entry !== '.git');
  if (entries.length > 0) {
    return { ok: false, problem: `${target} is not empty.` };
  }

  return { ok: true };
}

/**
 * Maps a template file name to the name it takes in the created project.
 *
 * @param {string} name - File name inside the template
 * @returns {string} Name to write
 */
export function targetFileName(name) {
  return RENAME_ON_COPY[name] ?? name;
}

/**
 * Recursively copies the template into a target directory.
 *
 * @param {string} from - Template directory
 * @param {string} to - Destination directory
 * @returns {number} Number of files written
 */
export function copyTemplate(from, to) {
  let written = 0;

  fs.mkdirSync(to, { recursive: true });

  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;

    const source = path.join(from, entry.name);
    const destination = path.join(to, targetFileName(entry.name));

    if (entry.isDirectory()) {
      written += copyTemplate(source, destination);
    } else {
      fs.copyFileSync(source, destination);
      written += 1;
    }
  }

  return written;
}

/**
 * Creates a new eziwiki project from the template.
 *
 * @param {object} options
 * @param {string} options.templateDir - Directory holding the template
 * @param {string} options.targetDir - Directory to create the project in
 * @param {string} options.projectName - Name for the project
 * @returns {{ files: number }} Summary of what was written
 * @throws {Error} If the target is unusable or the template is missing
 */
export function scaffold({ templateDir, targetDir, projectName, cliVersion }) {
  if (!fs.existsSync(templateDir)) {
    throw new Error(
      `Template not found at ${templateDir}. ` +
        'If you are running from a clone, build it first with `npm run build:template`.',
    );
  }

  const target = checkTarget(targetDir);
  if (!target.ok) throw new Error(target.problem);

  const files = copyTemplate(templateDir, targetDir);

  seedTitle(targetDir, projectName);

  const manifestPath = path.join(targetDir, 'package.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  fs.writeFileSync(
    manifestPath,
    `${JSON.stringify(buildProjectPackageJson(manifest, projectName, cliVersion), null, 2)}\n`,
    'utf-8',
  );

  renameLockfileRoot(targetDir, projectName);

  return { files };
}

/**
 * Points the shipped lockfile at the new project's name.
 *
 * npm would otherwise notice the mismatch on first install and rewrite the
 * lockfile, producing a spurious diff in the user's very first commit.
 *
 * @param {string} targetDir - Project directory
 * @param {string} projectName - Name the project was created with
 */
export function renameLockfileRoot(targetDir, projectName) {
  const lockPath = path.join(targetDir, 'package-lock.json');
  if (!fs.existsSync(lockPath)) return;

  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));

  lock.name = projectName;
  lock.version = '0.1.0';
  if (lock.packages?.['']) {
    lock.packages[''].name = projectName;
    lock.packages[''].version = '0.1.0';
  }

  fs.writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`, 'utf-8');
}

/**
 * Titles the new site after its project name.
 *
 * `my-docs` became a site called "My Wiki", which read as someone else's.
 * The placeholder is replaced in the config and the README; a template that
 * has drifted from the placeholder is left alone.
 *
 * @param {string} targetDir - The scaffolded project
 * @param {string} projectName - Name the project was created with
 */
export function seedTitle(targetDir, projectName) {
  const title = titleFromName(projectName);

  for (const [file, from, to] of [
    ['payload/config.ts', "title: 'My Wiki',", `title: '${title.replace(/'/g, "\\'")}',`],
    ['README.md', '# My Wiki', `# ${title}`],
  ]) {
    const at = path.join(targetDir, file);
    if (!fs.existsSync(at)) continue;
    const content = fs.readFileSync(at, 'utf-8');
    if (!content.includes(from)) continue;
    fs.writeFileSync(at, content.replace(from, to), 'utf-8');
  }
}

/**
 * Turns a package name into a title: `my-docs` is "My Docs".
 *
 * @param {string} name - Validated project name
 * @returns {string} A human-readable title
 */
export function titleFromName(name) {
  return name
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
