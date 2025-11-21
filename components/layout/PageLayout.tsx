'use client';

import React, { useState } from 'react';
import { NavigationItem } from '@/lib/payload/types';
import { Sidebar } from './Sidebar';
import { MobileMenu } from './MobileMenu';
import { TabBar } from './TabBar';
import { NavigationButtons } from './NavigationButtons';
import { ThemeToggle } from '@/components/ThemeToggle';

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

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
          {/* Tab bar and navigation - fixed at top */}
          <div className="sticky top-0 z-20 bg-white dark:bg-gray-950">
            <TabBar />
            <NavigationButtons navigation={navigation} />
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
