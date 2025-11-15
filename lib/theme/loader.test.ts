import { describe, it, expect } from 'vitest';
import {
  mergeThemeConfig,
  generateThemeCSS,
  themeToStyleObject,
  isValidHexColor,
  validateThemeColors,
  loadTheme,
} from './loader';
import { ThemeConfig } from '../payload/types';

describe('Theme Loader', () => {
  describe('mergeThemeConfig', () => {
    it('should return default theme when no user theme provided', () => {
      const result = mergeThemeConfig();
      expect(result).toHaveProperty('primary');
      expect(result).toHaveProperty('secondary');
      expect(result).toHaveProperty('background');
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('sidebarBg');
      expect(result).toHaveProperty('codeBg');
    });

    it('should merge user theme with defaults', () => {
      const userTheme = { primary: '#ff0000' };
      const result = mergeThemeConfig(userTheme);
      expect(result.primary).toBe('#ff0000');
      expect(result.secondary).toBeDefined();
    });

    it('should override multiple properties', () => {
      const userTheme = {
        primary: '#ff0000',
        background: '#000000',
      };
      const result = mergeThemeConfig(userTheme);
      expect(result.primary).toBe('#ff0000');
      expect(result.background).toBe('#000000');
    });
  });

  describe('generateThemeCSS', () => {
    it('should generate valid CSS variable declarations', () => {
      const theme: ThemeConfig = {
        primary: '#2563eb',
        secondary: '#7c3aed',
        background: '#ffffff',
        text: '#1f2937',
        sidebarBg: '#f9fafb',
        codeBg: '#f3f4f6',
      };
      const css = generateThemeCSS(theme);
      expect(css).toContain('--color-primary: #2563eb');
      expect(css).toContain('--color-secondary: #7c3aed');
      expect(css).toContain(':root');
    });
  });

  describe('themeToStyleObject', () => {
    it('should convert theme to style object', () => {
      const theme: ThemeConfig = {
        primary: '#2563eb',
        secondary: '#7c3aed',
        background: '#ffffff',
        text: '#1f2937',
        sidebarBg: '#f9fafb',
        codeBg: '#f3f4f6',
      };
      const styleObj = themeToStyleObject(theme);
      expect(styleObj['--color-primary']).toBe('#2563eb');
      expect(styleObj['--color-secondary']).toBe('#7c3aed');
    });
  });

  describe('isValidHexColor', () => {
    it('should validate correct hex colors', () => {
      expect(isValidHexColor('#ffffff')).toBe(true);
      expect(isValidHexColor('#000000')).toBe(true);
      expect(isValidHexColor('#2563eb')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(isValidHexColor('ffffff')).toBe(false);
      expect(isValidHexColor('#fff')).toBe(false);
      expect(isValidHexColor('#gggggg')).toBe(false);
      expect(isValidHexColor('red')).toBe(false);
    });
  });

  describe('validateThemeColors', () => {
    it('should validate correct theme colors', () => {
      const theme = {
        primary: '#2563eb',
        secondary: '#7c3aed',
      };
      const result = validateThemeColors(theme);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid colors', () => {
      const theme = {
        primary: 'invalid',
        secondary: '#7c3aed',
      };
      const result = validateThemeColors(theme);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('loadTheme', () => {
    it('should load theme with defaults', () => {
      const result = loadTheme();
      expect(result.theme).toBeDefined();
      expect(result.cssVariables).toBeDefined();
      expect(result.styleObject).toBeDefined();
    });

    it('should load theme with user overrides', () => {
      const userTheme = { primary: '#ff0000' };
      const result = loadTheme(userTheme);
      expect(result.theme.primary).toBe('#ff0000');
      expect(result.cssVariables).toContain('#ff0000');
      expect(result.styleObject['--color-primary']).toBe('#ff0000');
    });
  });
});
