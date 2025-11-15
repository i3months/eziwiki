import { ThemeConfig } from '../payload/types';

/**
 * Default theme configuration matching Notion/Obsidian aesthetic
 */
const defaultTheme: ThemeConfig = {
  primary: '#2563eb',
  secondary: '#7c3aed',
  background: '#ffffff',
  text: '#1f2937',
  sidebarBg: '#f9fafb',
  codeBg: '#f3f4f6',
};

/**
 * Merges user-provided theme configuration with default values
 * @param userTheme - Partial theme configuration from payload
 * @returns Complete theme configuration with all required properties
 */
export function mergeThemeConfig(userTheme?: Partial<ThemeConfig>): ThemeConfig {
  return {
    ...defaultTheme,
    ...userTheme,
  };
}

/**
 * Generates CSS variable declarations from theme configuration
 * @param theme - Complete theme configuration
 * @returns CSS string with custom property declarations
 */
export function generateThemeCSS(theme: ThemeConfig): string {
  return `
    :root {
      --color-primary: ${theme.primary};
      --color-secondary: ${theme.secondary};
      --color-background: ${theme.background};
      --color-text: ${theme.text};
      --color-sidebar-bg: ${theme.sidebarBg};
      --color-code-bg: ${theme.codeBg};
    }
  `.trim();
}

/**
 * Converts theme configuration to inline style object for React
 * @param theme - Complete theme configuration
 * @returns Style object with CSS custom properties
 */
export function themeToStyleObject(theme: ThemeConfig): Record<string, string> {
  return {
    '--color-primary': theme.primary,
    '--color-secondary': theme.secondary,
    '--color-background': theme.background,
    '--color-text': theme.text,
    '--color-sidebar-bg': theme.sidebarBg,
    '--color-code-bg': theme.codeBg,
  } as Record<string, string>;
}

/**
 * Validates that a color string is a valid hex color
 * @param color - Color string to validate
 * @returns True if valid hex color, false otherwise
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Validates all colors in a theme configuration
 * @param theme - Theme configuration to validate
 * @returns Object with validation result and any error messages
 */
export function validateThemeColors(theme: Partial<ThemeConfig>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (theme.primary && !isValidHexColor(theme.primary)) {
    errors.push(`Invalid primary color: ${theme.primary}. Must be a hex color (e.g., #2563eb)`);
  }

  if (theme.secondary && !isValidHexColor(theme.secondary)) {
    errors.push(`Invalid secondary color: ${theme.secondary}. Must be a hex color (e.g., #7c3aed)`);
  }

  if (theme.background && !isValidHexColor(theme.background)) {
    errors.push(
      `Invalid background color: ${theme.background}. Must be a hex color (e.g., #ffffff)`,
    );
  }

  if (theme.text && !isValidHexColor(theme.text)) {
    errors.push(`Invalid text color: ${theme.text}. Must be a hex color (e.g., #1f2937)`);
  }

  if (theme.sidebarBg && !isValidHexColor(theme.sidebarBg)) {
    errors.push(`Invalid sidebarBg color: ${theme.sidebarBg}. Must be a hex color (e.g., #f9fafb)`);
  }

  if (theme.codeBg && !isValidHexColor(theme.codeBg)) {
    errors.push(`Invalid codeBg color: ${theme.codeBg}. Must be a hex color (e.g., #f3f4f6)`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Loads and processes theme configuration for use in the application
 * @param userTheme - Optional user-provided theme configuration
 * @returns Processed theme configuration ready for injection
 */
export function loadTheme(userTheme?: Partial<ThemeConfig>): {
  theme: ThemeConfig;
  cssVariables: string;
  styleObject: Record<string, string>;
} {
  // Validate user theme if provided
  if (userTheme) {
    const validation = validateThemeColors(userTheme);
    if (!validation.valid) {
      console.warn('Theme validation warnings:', validation.errors);
      // Continue with default values for invalid colors
    }
  }

  // Merge with defaults
  const theme = mergeThemeConfig(userTheme);

  // Generate CSS and style objects
  const cssVariables = generateThemeCSS(theme);
  const styleObject = themeToStyleObject(theme);

  return {
    theme,
    cssVariables,
    styleObject,
  };
}
