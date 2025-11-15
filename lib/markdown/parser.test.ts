import { describe, it, expect } from 'vitest';
import { parseMarkdownFile } from './parser';

describe('parseMarkdownFile', () => {
  it('should successfully read and parse a markdown file with frontmatter', async () => {
    const result = await parseMarkdownFile('test-sample');

    expect(result.content).toContain('# Test Content');
    expect(result.content).toContain('This is a test markdown file');
    expect(result.frontmatter.title).toBe('Test Sample');
    expect(result.frontmatter.author).toBe('Test Author');
    expect(result.frontmatter.date).toBeInstanceOf(Date);
  });

  it('should parse markdown file without frontmatter', async () => {
    const result = await parseMarkdownFile('test-no-frontmatter');

    expect(result.content).toContain('# Simple Content');
    expect(result.content).toContain('This file has no frontmatter');
    expect(result.frontmatter).toEqual({});
  });

  it('should throw error for missing file with clear message', async () => {
    await expect(parseMarkdownFile('nonexistent-file')).rejects.toThrow(
      'Markdown file not found: nonexistent-file',
    );
    await expect(parseMarkdownFile('nonexistent-file')).rejects.toThrow(
      'Expected file location: content/nonexistent-file.md',
    );
  });
});
