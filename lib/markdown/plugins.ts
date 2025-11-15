import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';

/**
 * Remark plugins configuration for Markdown processing
 * Remark plugins transform the Markdown AST before conversion to HTML
 */
export const remarkPlugins = [
  // GitHub Flavored Markdown support (tables, strikethrough, task lists, etc.)
  remarkGfm,
];

/**
 * Rehype plugins configuration for HTML processing
 * Rehype plugins transform the HTML AST after Markdown conversion
 */
export const rehypePlugins = [
  // Add IDs to headings for anchor links
  rehypeSlug,
  // Syntax highlighting for code blocks
  rehypeHighlight,
];

/**
 * Combined plugin configuration for react-markdown
 */
export const markdownPlugins = {
  remarkPlugins,
  rehypePlugins,
};
