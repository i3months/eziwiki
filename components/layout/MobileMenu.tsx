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
}

/**
 * Recursive mobile navigation item component
 *
 * Renders a single navigation item optimized for mobile with touch-friendly
 * targets and automatic menu closing on navigation.
 *
 * @param props - Component props
 */
function MobileNavigationItem({ item, currentPath, level, onNavigate }: MobileNavigationItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const { activeTabId, tabs, addTab } = useTabStore();
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.path === currentPath;
  const indentClass = level > 0 ? `pl-${level * 4}` : '';

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
      router.push(`/${item.path}`);
      onNavigate();
    }
  };

  return (
    <div className="mb-1">
      <div className={`flex items-center ${indentClass}`}>
        {hasChildren && (
          <button
            onClick={handleToggle}
            className="mr-2 text-gray-500 dark:text-gray-400 p-2 -ml-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 touch-manipulation"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            aria-expanded={isExpanded}
          >
            <svg
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {item.path ? (
          <Link
            href={`/${item.path}`}
            onClick={handleLinkClick}
            className={`flex-1 px-4 py-3 rounded-md text-base transition-colors touch-manipulation ${
              isActive
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700'
            } ${!hasChildren ? 'ml-7' : ''}`}
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.name}
          </Link>
        ) : (
          <div
            className={`flex-1 px-4 py-3 text-base font-semibold text-gray-900 dark:text-gray-100 ${
              !hasChildren ? 'ml-7' : ''
            }`}
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.name}
          </div>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {item.children!.map((child, index) => (
            <MobileNavigationItem
              key={`${child.name}-${index}`}
              item={child}
              currentPath={currentPath}
              level={level + 1}
              onNavigate={onNavigate}
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Navigation</h2>
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
          <nav>
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
