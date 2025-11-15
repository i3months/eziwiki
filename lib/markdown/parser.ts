import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

/**
 * Reads and parses a Markdown file from the content directory
 * @param filePath - Path relative to content directory (without .md extension)
 * @returns Parsed content and frontmatter
 * @throws Error if file cannot be read or does not exist
 */
export async function parseMarkdownFile(filePath: string): Promise<{
  content: string;
  frontmatter: Record<string, any>;
}> {
  const fullPath = path.join(process.cwd(), 'content', `${filePath}.md`);

  try {
    const fileContent = await fs.readFile(fullPath, 'utf-8');
    const { data, content } = matter(fileContent);

    return {
      content,
      frontmatter: data,
    };
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(
        `Markdown file not found: ${filePath}\n` + `Expected file location: content/${filePath}.md`,
      );
    }
    throw new Error(
      `Failed to read Markdown file: ${filePath}\n` +
        `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
