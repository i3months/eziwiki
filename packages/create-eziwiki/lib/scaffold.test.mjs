import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  buildProjectPackageJson,
  titleFromName,
  checkTarget,
  copyTemplate,
  scaffold,
  targetFileName,
  validateProjectName,
} from './scaffold.mjs';

let workdir;

beforeEach(() => {
  workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'eziwiki-scaffold-'));
});

afterEach(() => {
  fs.rmSync(workdir, { recursive: true, force: true });
});

/** Writes a minimal fake template into a directory. */
function makeTemplate(dir) {
  fs.mkdirSync(path.join(dir, 'content'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'node_modules'), { recursive: true });

  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({
      name: 'my-wiki',
      version: '9.9.9',
      description: 'template',
      repository: 'github:someone/eziwiki',
      bin: { thing: './x.js' },
      files: ['bin'],
      dependencies: { next: '^14.0.0' },
    }),
  );
  fs.writeFileSync(path.join(dir, 'gitignore'), 'node_modules\n');
  fs.writeFileSync(path.join(dir, 'content', 'intro.md'), '# Hi\n');
  fs.writeFileSync(path.join(dir, 'node_modules', 'junk.js'), 'nope');

  return dir;
}

describe('validateProjectName', () => {
  it('accepts ordinary names', () => {
    for (const name of ['my-wiki', 'docs', 'a1', 'my.wiki', 'my_wiki']) {
      expect(validateProjectName(name).valid, name).toBe(true);
    }
  });

  it('rejects an empty name', () => {
    expect(validateProjectName('').valid).toBe(false);
    expect(validateProjectName('   ').valid).toBe(false);
    expect(validateProjectName(undefined).valid).toBe(false);
  });

  it('rejects uppercase, which npm does not allow', () => {
    expect(validateProjectName('MyWiki').valid).toBe(false);
  });

  it('rejects spaces and other illegal characters', () => {
    expect(validateProjectName('my wiki').valid).toBe(false);
    expect(validateProjectName('my/wiki').valid).toBe(false);
  });

  it('rejects names starting with a dot or underscore', () => {
    expect(validateProjectName('.hidden').valid).toBe(false);
    expect(validateProjectName('_private').valid).toBe(false);
  });

  it('rejects names longer than npm permits', () => {
    expect(validateProjectName('a'.repeat(215)).valid).toBe(false);
  });

  it('explains why it refused', () => {
    expect(validateProjectName('My Wiki').problem).toBeTruthy();
  });
});

describe('buildProjectPackageJson', () => {
  const template = {
    name: 'my-wiki',
    version: '9.9.9',
    repository: 'github:someone/eziwiki',
    homepage: 'https://example.com',
    bugs: 'https://example.com/issues',
    bin: { x: './x.js' },
    files: ['bin'],
    publishConfig: { access: 'public' },
    scripts: { build: 'next build' },
    dependencies: { next: '^14.0.0' },
  };

  it('uses the requested project name and a fresh version', () => {
    const pkg = buildProjectPackageJson(template, 'my-docs');

    expect(pkg.name).toBe('my-docs');
    expect(pkg.version).toBe('0.1.0');
  });

  it('marks the project private so it is never published by accident', () => {
    expect(buildProjectPackageJson(template, 'my-docs').private).toBe(true);
  });

  it('drops fields belonging to the source repository', () => {
    const pkg = buildProjectPackageJson(template, 'my-docs');

    for (const field of ['repository', 'homepage', 'bugs', 'bin', 'files', 'publishConfig']) {
      expect(pkg, field).not.toHaveProperty(field);
    }
  });

  it('keeps scripts and dependencies', () => {
    const pkg = buildProjectPackageJson(template, 'my-docs');

    expect(pkg.scripts).toEqual({ build: 'next build' });
    expect(pkg.dependencies).toEqual({ next: '^14.0.0' });
  });

  it('does not mutate the input', () => {
    const before = JSON.stringify(template);
    buildProjectPackageJson(template, 'my-docs');

    expect(JSON.stringify(template)).toBe(before);
  });
});

describe('checkTarget', () => {
  it('accepts a path that does not exist', () => {
    expect(checkTarget(path.join(workdir, 'new')).ok).toBe(true);
  });

  it('accepts an existing empty directory', () => {
    const dir = path.join(workdir, 'empty');
    fs.mkdirSync(dir);

    expect(checkTarget(dir).ok).toBe(true);
  });

  it('accepts a directory containing only a git repo', () => {
    const dir = path.join(workdir, 'gitonly');
    fs.mkdirSync(path.join(dir, '.git'), { recursive: true });

    expect(checkTarget(dir).ok).toBe(true);
  });

  it('refuses a directory with files in it', () => {
    const dir = path.join(workdir, 'busy');
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'keep.txt'), 'mine');

    const result = checkTarget(dir);
    expect(result.ok).toBe(false);
    expect(result.problem).toContain('not empty');
  });

  it('refuses a path that is a file', () => {
    const file = path.join(workdir, 'file.txt');
    fs.writeFileSync(file, 'x');

    expect(checkTarget(file).ok).toBe(false);
  });
});

describe('targetFileName', () => {
  it('restores names npm strips from a tarball', () => {
    expect(targetFileName('gitignore')).toBe('.gitignore');
    expect(targetFileName('npmrc')).toBe('.npmrc');
    expect(targetFileName('prettierrc')).toBe('.prettierrc');
  });

  it('leaves ordinary names alone', () => {
    expect(targetFileName('package.json')).toBe('package.json');
  });
});

describe('copyTemplate', () => {
  it('copies files and directories', () => {
    const template = makeTemplate(path.join(workdir, 'template'));
    const target = path.join(workdir, 'out');

    copyTemplate(template, target);

    expect(fs.existsSync(path.join(target, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(target, 'content', 'intro.md'))).toBe(true);
  });

  it('renames dotfiles on the way out', () => {
    const template = makeTemplate(path.join(workdir, 'template'));
    const target = path.join(workdir, 'out');

    copyTemplate(template, target);

    expect(fs.existsSync(path.join(target, '.gitignore'))).toBe(true);
    expect(fs.existsSync(path.join(target, 'gitignore'))).toBe(false);
  });

  it('never copies node_modules', () => {
    const template = makeTemplate(path.join(workdir, 'template'));
    const target = path.join(workdir, 'out');

    copyTemplate(template, target);

    expect(fs.existsSync(path.join(target, 'node_modules'))).toBe(false);
  });
});

describe('scaffold', () => {
  it('creates a working project directory', () => {
    const templateDir = makeTemplate(path.join(workdir, 'template'));
    const targetDir = path.join(workdir, 'my-docs');

    const result = scaffold({ templateDir, targetDir, projectName: 'my-docs' });

    expect(result.files).toBeGreaterThan(0);
    expect(fs.existsSync(path.join(targetDir, 'content', 'intro.md'))).toBe(true);
  });

  it('rewrites the manifest for the new project', () => {
    const templateDir = makeTemplate(path.join(workdir, 'template'));
    const targetDir = path.join(workdir, 'my-docs');

    scaffold({ templateDir, targetDir, projectName: 'my-docs' });

    const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf-8'));
    expect(pkg.name).toBe('my-docs');
    expect(pkg.private).toBe(true);
    expect(pkg).not.toHaveProperty('repository');
  });

  it('points a shipped lockfile at the new name', () => {
    const templateDir = makeTemplate(path.join(workdir, 'template'));
    fs.writeFileSync(
      path.join(templateDir, 'package-lock.json'),
      JSON.stringify({ name: 'my-wiki', version: '9.9.9', packages: { '': { name: 'my-wiki' } } }),
    );

    const targetDir = path.join(workdir, 'my-docs');
    scaffold({ templateDir, targetDir, projectName: 'my-docs' });

    const lock = JSON.parse(fs.readFileSync(path.join(targetDir, 'package-lock.json'), 'utf-8'));
    expect(lock.name).toBe('my-docs');
    expect(lock.packages[''].name).toBe('my-docs');
  });

  it('refuses to overwrite a non-empty directory', () => {
    const templateDir = makeTemplate(path.join(workdir, 'template'));
    const targetDir = path.join(workdir, 'busy');

    fs.mkdirSync(targetDir);
    fs.writeFileSync(path.join(targetDir, 'important.txt'), 'do not lose me');

    expect(() => scaffold({ templateDir, targetDir, projectName: 'busy' })).toThrow(/not empty/);
    expect(fs.readFileSync(path.join(targetDir, 'important.txt'), 'utf-8')).toBe('do not lose me');
  });

  it('explains what to do when the template is missing', () => {
    expect(() =>
      scaffold({
        templateDir: path.join(workdir, 'nope'),
        targetDir: path.join(workdir, 'out'),
        projectName: 'out',
      }),
    ).toThrow(/build:template/);
  });
});

describe('buildProjectPackageJson provenance', () => {
  it('records the release the project was created from', () => {
    const pkg = buildProjectPackageJson({ name: 'my-wiki', scripts: {} }, 'my-docs', '0.5.0');
    expect(pkg.eziwiki).toEqual({ version: '0.5.0' });
  });

  it('records nothing when no release is known', () => {
    const pkg = buildProjectPackageJson({ name: 'my-wiki', scripts: {} }, 'my-docs');
    expect(pkg.eziwiki).toBeUndefined();
  });
});

describe('titleFromName', () => {
  it('titles the site after the project', () => {
    expect(titleFromName('my-docs')).toBe('My Docs');
    expect(titleFromName('wiki')).toBe('Wiki');
    expect(titleFromName('team_handbook')).toBe('Team Handbook');
  });
});
