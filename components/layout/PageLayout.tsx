'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { NavigationItem } from '@/lib/payload/types';
import { Sidebar } from './Sidebar';
import { MobileMenu } from './MobileMenu';
import { TabBar } from './TabBar';
import { Breadcrumb } from './Breadcrumb';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTabStore } from '@/lib/store/tabStore';

/**
 * Props for the PageLayout component
 */
interface PageLayoutProps {
  /** Array of top-level navigation items */
  navigation: NavigationItem[];
  /** Page content to render in the main area */
  children: React.ReactNode;
}

/**
 * Main page layout wrapper with responsive navigation
 *
 * Provides the overall page structure with:
 * - Fixed desktop sidebar (visible on screens >= 768px)
 * - Mobile header with hamburger menu (visible on screens < 768px)
 * - Slide-out mobile menu drawer
 * - Centered content area with responsive padding
 *
 * Manages the mobile menu open/close state internally.
 *
 * @param props - Component props
 * @param props.navigation - Array of navigation items to display in sidebar/menu
 * @param props.children - Page content to render in the main content area
 *
 * @example
 * ```tsx
 * import payload from './payload/config';
 *
 * <PageLayout navigation={payload.navigation}>
 *   <h1>Welcome</h1>
 *   <p>This is the page content.</p>
 * </PageLayout>
 * ```
 */
export function PageLayout({ navigation, children }: PageLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { tabs, activeTabId, addTab, updateTabPath, hasHydrated } = useTabStore();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Helper function to find navigation item by path
  const findNavigationItemByPath = (
    items: NavigationItem[],
    path: string,
  ): NavigationItem | null => {
    // Normalize path by removing trailing slash
    const normalizedPath = path.replace(/\/$/, '');

    for (const item of items) {
      // Skip items without a path (category items)
      if (!item.path) {
        // Still search in children
        if (item.children) {
          const found = findNavigationItemByPath(item.children, path);
          if (found) return found;
        }
        continue;
      }

      // Normalize item path
      const normalizedItemPath = item.path.replace(/\/$/, '');
      if (normalizedItemPath === normalizedPath) {
        return item;
      }

      // Search in children
      if (item.children) {
        const found = findNavigationItemByPath(item.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  // Ensure a tab exists for the current URL
  useEffect(() => {
    // Wait for hydration to complete
    if (!hasHydrated) return;

    // Normalize path by removing leading slash and trailing slash
    const currentPath = pathname === '/' ? '' : pathname.slice(1).replace(/\/$/, '');
    const navItem = findNavigationItemByPath(navigation, currentPath);
    // Use nav item name if found, otherwise "New Tab"
    const title = navItem?.name || 'New Tab';

    console.log('🔍 PageLayout useEffect:', {
      currentPath,
      navItem,
      title,
      tabsCount: tabs.length,
      activeTabId,
      tabs: tabs.map((t) => ({ id: t.id, title: t.title, path: t.path })),
    });

    // If no tabs exist, create one for the current path
    if (tabs.length === 0) {
      console.log('✅ Creating new tab:', { title, path: currentPath });
      addTab({ title, path: currentPath });
      return;
    }

    // Check if any tab matches the current path
    const matchingTab = tabs.find((tab) => tab.path === currentPath);

    if (matchingTab) {
      console.log('📍 Found matching tab:', matchingTab);
      // Tab exists for this path, update its title if it's "New Tab"
      if (matchingTab.title === 'New Tab' && navItem) {
        console.log('🔄 Updating tab title from "New Tab" to:', title);
        updateTabPath(matchingTab.id, currentPath, title);
      }
    } else {
      console.log('❌ No matching tab, updating active or first tab');
      // No matching tab found, update the active tab
      if (activeTabId) {
        console.log('🔄 Updating active tab:', activeTabId);
        updateTabPath(activeTabId, currentPath, title);
      } else if (tabs.length > 0) {
        console.log('🔄 Updating first tab:', tabs[0].id);
        // No active tab but tabs exist, update the first tab
        updateTabPath(tabs[0].id, currentPath, title);
      } else {
        console.log('✅ Creating fallback tab');
        // Fallback: create a new tab
        addTab({ title, path: currentPath });
      }
    }
  }, [pathname, tabs, activeTabId, addTab, updateTabPath, navigation, hasHydrated]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Mobile header with hamburger button */}
      <header className="md:hidden sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={toggleMobileMenu}
            className="p-2 -ml-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors active:bg-gray-200 dark:active:bg-gray-700 touch-manipulation"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Documentation</h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile menu */}
      <MobileMenu navigation={navigation} isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />

      {/* Main layout grid */}
      <div className="flex">
        {/* Desktop sidebar */}
        <Sidebar navigation={navigation} />

        {/* Main content area */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Tab bar - fixed at top */}
          <div className="sticky top-0 z-20 bg-white dark:bg-gray-950">
            <TabBar />
            <Breadcrumb navigation={navigation} />
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
