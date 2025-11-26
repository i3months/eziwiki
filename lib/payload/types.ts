/**
 * Navigation item in the sidebar hierarchy
 */
export interface NavigationItem {
  /** Display name of the navigation item */
  name: string;
  /** Optional path to content file (without .md extension) */
  path?: string;
  /** Optional nested navigation items */
  children?: NavigationItem[];
  /** Optional icon identifier */
  icon?: string;
  /** Optional background color for the navigation item */
  color?: string;
  /** Hide this item from navigation (accessible only via direct URL) */
  hidden?: boolean;
}

/**
 * Global site configuration
 */
export interface GlobalConfig {
  /** Site title displayed in browser tab */
  title: string;
  /** Site description for SEO */
  description: string;
  /** Path to favicon */
  favicon?: string;
  /** Base URL for the site */
  baseUrl?: string;
  /** SEO metadata */
  seo?: {
    openGraph?: {
      title?: string;
      description?: string;
      images?: Array<{
        url: string;
        width?: number;
        height?: number;
        alt?: string;
      }>;
    };
    twitter?: {
      card?: 'summary' | 'summary_large_image' | 'app' | 'player';
      site?: string;
      creator?: string;
      title?: string;
      description?: string;
      images?: string[];
    };
  };
}

/**
 * Theme color configuration
 */
export interface ThemeConfig {
  /** Primary brand color */
  primary: string;
  /** Secondary accent color */
  secondary: string;
  /** Background color */
  background: string;
  /** Text color */
  text: string;
  /** Sidebar background color */
  sidebarBg: string;
  /** Code block background */
  codeBg: string;
}

/**
 * Complete payload structure
 */
export interface Payload {
  /** Global site configuration */
  global: GlobalConfig;
  /** Navigation structure */
  navigation: NavigationItem[];
  /** Theme customization */
  theme?: Partial<ThemeConfig>;
}
