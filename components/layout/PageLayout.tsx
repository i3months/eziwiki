'use client';

import React, { useCallback, useState } from 'react';
import { NavigationItem } from '@/lib/payload/types';
import { Sidebar } from './Sidebar';
import { MobileMenu } from './MobileMenu';
import { TabBar } from './TabBar';
import { NavigationButtons } from './NavigationButtons';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SearchTrigger } from '@/components/search/SearchTrigger';
import { useStrings } from '@/components/providers/StringsProvider';

/**
 * Props for the PageLayout component
 */
interface PageLayoutProps {
  /** Array of top-level navigation items */
  navigation: NavigationItem[];
  /** Source repository, linked from the sidebar when configured */
  repoUrl?: string;
  /** Page content to render in the main area */
  children: React.ReactNode;
}

/**
 * Main page layout wrapper with responsive navigation
 * Manages the mobile menu open/close state internally.
 *
 * @param props - Component props
 * @param props.navigation - Array of navigation items to display in sidebar/menu
 * @param props.repoUrl - Source repository, linked from the sidebar when set
 * @param props.children - Page content to render in the main content area
 *
 */
export function PageLayout({ navigation, repoUrl, children }: PageLayoutProps) {
  const t = useStrings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((open) => !open);
  }, []);

  // Stable, because the drawer's focus effect depends on it: a new function
  // each render would re-run that effect on every re-render of this layout,
  // yanking focus back to the button and then into the drawer again.
  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/*
        A fixed `h-16` rather than whatever the contents come to: the bar below
        has to stick underneath this one, and it can only be told where to stop
        by a height that is decided here rather than measured.
      */}
      <header className="md:hidden print:hidden sticky top-0 z-30 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4">
        <div className="flex h-full items-center justify-between">
          <button
            onClick={toggleMobileMenu}
            className="p-2 -ml-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors active:bg-gray-200 dark:active:bg-gray-700 touch-manipulation"
            aria-label={t.toggleMenu}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
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
          <SearchTrigger className="mx-3 min-w-0 flex-1" />
          <ThemeToggle />
        </div>
      </header>

      <MobileMenu
        navigation={navigation}
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        repoUrl={repoUrl}
      />

      <div className="flex">
        <Sidebar navigation={navigation} repoUrl={repoUrl} />

        <main id="main-content" tabIndex={-1} className="flex-1 min-w-0 flex flex-col">
          {/*
            `top-16` on a phone, where the header above is sticky at 0 and this
            would otherwise stick to the same line and disappear behind it —
            taking the breadcrumb, and with it any sense of where the reader
            is, out of view the moment they started reading. There is no header
            from `md` up, so it sticks to the top there.
          */}
          <div className="sticky top-16 z-20 bg-white md:top-0 dark:bg-gray-950 print:hidden">
            <TabBar />
            <NavigationButtons navigation={navigation} />
          </div>

          {/*
            No `overflow-y` here. It was set to `auto` and never scrolled —
            nothing constrains this box's height, so it grows to fit the
            article — but declaring it made this the scroll container for
            everything inside, and `position: sticky` sticks to its scroll
            container. The contents rail was sticking to a box that never
            scrolls, so it slid away with the page and left the reader without
            it for the length of the article.
          */}
          <div className="flex-1">
            {/* Wide enough to seat the table-of-contents rail beside the
                article; the article itself stays measured by its own prose
                width. */}
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
