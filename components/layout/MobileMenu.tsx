'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NavigationItem } from '@/lib/payload/types';
import { useTabStore } from '@/lib/store/tabStore';

/**
 * Props for the MobileMenu component
 */
interface MobileMenuProps {
  /** Array of top-level navigation items */
  navigation: NavigationItem[];
  /** Whether the mobile menu is currently open */
  isOpen: boolean;
  /** Callback function to close the menu */
  onClose: () => void;
}

/**
 * Props for the MobileNavigationItem component
 */
interface MobileNavigationItemProps {
  /** Navigation item to render */
  item: NavigationItem;
  /** Current page path for highlighting active item */
  currentPath: string;
  /** Nesting level for indentation (0 = top level) */
  level: number;
  /** Callback function when navigation occurs */
  onNavigate: () => void;
  /** Background color inherited from parent */
  backgroundColor?: string;
}

/**
 * Calculate luminance of a color to determine if it's light or dark
 */
function isLightColor(hexColor: string): boolean {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

/**
 * Recursive mobile navigation item component
 *
 * Renders a single navigation item optimized for mobile with touch-friendly
 * targets and automatic menu closing on navigation.
 *
 * @param props - Component props
 */
function MobileNavigationItem({
  item,
  currentPath,
  level,
  onNavigate,
  backgroundColor,
}: MobileNavigationItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const { activeTabId, tabs, addTab } = useTabStore();
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.path === currentPath;

  // Calculate left margin based on level using inline styles
  const getLeftMarginStyle = () => {
    if (level === 0) return {};
    const baseMargin = level * 24; // 24px per level
    const extraMargin = hasChildren ? 0 : 4; // Extra 4px for documents
    return { marginLeft: `${baseMargin + extraMargin}px` };
  };

  // Use item's color if defined, otherwise inherit from parent
  const bgColor = item.color || backgroundColor;

  // Determine if background is light or dark
  const isLight = bgColor ? isLightColor(bgColor) : true;

  // Get text colors based on background
  const textColor = isLight ? 'rgb(55, 65, 81)' : 'rgb(243, 244, 246)';

  // Get background style
  const getBgStyle = (isTopLevel: boolean) => {
    if (!bgColor) return undefined;
    return {
      backgroundColor: bgColor,
      ...(isTopLevel && { padding: '4px', borderRadius: '6px' }),
    };
  };

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    if (item.path) {
      e.preventDefault();
      const { navigateInHistory } = useTabStore.getState();

      if (activeTabId) {
        // Add to history and update the active tab's path
        navigateInHistory(activeTabId, item.path, item.name);
      } else if (tabs.length === 0) {
        // No tabs at all, create a new one
        addTab({ title: item.name, path: item.path });
      }

      // Navigate and close menu
      router.replace(`/${item.path}`);
      onNavigate();
    }
  };

  return (
    <div className={level === 0 ? 'mb-0.5' : ''} style={level === 0 ? getBgStyle(true) : undefined}>
      <div className="flex items-center" style={level > 0 ? getBgStyle(false) : undefined}>
        {hasChildren ? (
          // Folder with children - entire area is clickable to toggle
          <button
            onClick={handleToggle}
            className={`flex items-center flex-1 px-2 py-1 rounded-md text-sm transition-colors touch-manipulation ${
              !bgColor
                ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700'
                : ''
            }`}
            style={bgColor ? { color: textColor, ...getLeftMarginStyle() } : getLeftMarginStyle()}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            aria-expanded={isExpanded}
          >
            <svg
              className={`w-4 h-4 mr-2 -ml-1 flex-shrink-0 transition-transform duration-[120ms] ${isExpanded ? 'rotate-90' : ''}`}
              style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-semibold">
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.name}
            </span>
          </button>
        ) : item.path ? (
          // Item with path - link
          <Link
            href={`/${item.path}`}
            onClick={handleLinkClick}
            className={`flex-1 px-2 py-1 rounded-md text-sm transition-colors touch-manipulation ${
              isActive
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium'
                : !bgColor
                  ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700'
                  : ''
            }`}
            style={
              bgColor && !isActive
                ? { color: textColor, ...getLeftMarginStyle() }
                : getLeftMarginStyle()
            }
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.name}
          </Link>
        ) : (
          // Item without path or children - static text
          <div
            className={`flex-1 px-2 py-1 text-sm font-semibold ${
              !bgColor ? 'text-gray-900 dark:text-gray-100' : ''
            }`}
            style={bgColor ? { color: textColor, ...getLeftMarginStyle() } : getLeftMarginStyle()}
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.name}
          </div>
        )}
      </div>
      {hasChildren && (
        <div
          className="overflow-hidden transition-all duration-[120ms]"
          style={{
            maxHeight: isExpanded ? '1000px' : '0',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
            ...getBgStyle(false),
          }}
        >
          {item.children!.map((child, index) => (
            <MobileNavigationItem
              key={`${child.name}-${index}`}
              item={child}
              currentPath={currentPath}
              level={level + 1}
              onNavigate={onNavigate}
              backgroundColor={bgColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Mobile navigation menu with slide-out drawer
 *
 * Displays a full-screen overlay menu for mobile devices. The menu slides
 * in from the left and includes a backdrop overlay. Automatically prevents
 * body scrolling when open and closes when a navigation link is clicked.
 *
 * Visible only on mobile viewports (< 768px). On desktop, the Sidebar
 * component is used instead.
 *
 * @param props - Component props
 * @param props.navigation - Array of top-level navigation items to display
 * @param props.isOpen - Whether the menu is currently open
 * @param props.onClose - Callback function to close the menu
 *
 * @example
 * ```tsx
 * const [isMenuOpen, setIsMenuOpen] = useState(false);
 *
 * <MobileMenu
 *   navigation={navigationItems}
 *   isOpen={isMenuOpen}
 *   onClose={() => setIsMenuOpen(false)}
 * />
 * ```
 */
export function MobileMenu({ navigation, isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const currentPath = pathname === '/' ? '' : pathname.slice(1);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden touch-manipulation"
          onClick={onClose}
          onTouchEnd={onClose}
          aria-hidden="true"
          role="button"
          tabIndex={-1}
        />
      )}

      {/* Slide-out drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } overflow-y-auto`}
      >
        <div className="p-4">
          <nav>
            <div className="flex items-center justify-between mb-1">
              <div className="flex-1" />
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 active:bg-gray-100 dark:active:bg-gray-800 rounded-md transition-colors touch-manipulation"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {navigation.map((item, index) => (
              <MobileNavigationItem
                key={`${item.name}-${index}`}
                item={item}
                currentPath={currentPath}
                level={0}
                onNavigate={onClose}
              />
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
